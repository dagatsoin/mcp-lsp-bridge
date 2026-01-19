/**
 * TSServer Process Wrapper
 *
 * Manages communication with TypeScript's language server (tsserver)
 * using newline-delimited JSON protocol over stdin/stdout.
 *
 * Note: tsserver uses its own protocol (not LSP). Messages are JSON objects
 * terminated by newlines, not Content-Length framed.
 *
 * @implements FS-001.5, FS-001.7
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// Logging utility - all logs go to stderr
function log(message: string): void {
  console.error(`[tsserver-wrapper] ${message}`);
}

// TSServer message types
export interface TSServerRequest {
  seq: number;
  type: 'request';
  command: string;
  arguments?: Record<string, unknown>;
}

export interface TSServerResponse {
  seq: number;
  type: 'response';
  command: string;
  request_seq: number;
  success: boolean;
  message?: string;
  body?: unknown;
}

export interface TSServerEvent {
  seq: number;
  type: 'event';
  event: string;
  body?: unknown;
}

export type TSServerMessage = TSServerResponse | TSServerEvent;

// Configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const BACKOFF_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

interface PendingRequest {
  resolve: (response: TSServerResponse) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export class TSServerWrapper extends EventEmitter {
  private process: ChildProcess | null = null;
  private workspaceRoot: string;
  private sequenceNumber = 0;
  private pendingRequests = new Map<number, PendingRequest>();
  private buffer = '';
  private isDisposed = false;
  private retryCount = 0;

  constructor(workspaceRoot: string) {
    super();
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Find the tsserver executable path
   * Priority: workspace node_modules > npx fallback
   */
  private findTSServerPath(): string {
    // Check workspace's node_modules first
    const workspaceTsServer = path.join(
      this.workspaceRoot,
      'node_modules',
      'typescript',
      'lib',
      'tsserver.js'
    );

    if (fs.existsSync(workspaceTsServer)) {
      log(`Using workspace TypeScript: ${workspaceTsServer}`);
      return workspaceTsServer;
    }

    // Fallback to global/npx
    log('Using npx tsserver as fallback');
    return 'tsserver';
  }

  /**
   * Start the tsserver process
   */
  async start(): Promise<void> {
    if (this.process) {
      throw new Error('TSServer already started');
    }

    const tsserverPath = this.findTSServerPath();
    const useNpx = tsserverPath === 'tsserver';

    try {
      if (useNpx) {
        this.process = spawn('npx', ['tsserver'], {
          cwd: this.workspaceRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } else {
        this.process = spawn('node', [tsserverPath], {
          cwd: this.workspaceRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      }

      this.setupProcessHandlers();
      log('TSServer process started');
    } catch (error) {
      throw new Error(`Failed to start tsserver: ${error}`);
    }
  }

  /**
   * Set up handlers for process I/O and lifecycle events
   */
  private setupProcessHandlers(): void {
    if (!this.process || !this.process.stdout || !this.process.stderr) {
      return;
    }

    // Handle stdout (Content-Length framed messages)
    this.process.stdout.on('data', (data: Buffer) => {
      this.handleData(data.toString('utf-8'));
    });

    // Handle stderr (logging from tsserver)
    this.process.stderr.on('data', (data: Buffer) => {
      log(`tsserver stderr: ${data.toString('utf-8').trim()}`);
    });

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      log(`TSServer exited with code ${code}, signal ${signal}`);
      this.process = null;

      // Reject all pending requests
      for (const [seq, pending] of this.pendingRequests) {
        clearTimeout(pending.timer);
        pending.reject(new Error(`TSServer process exited unexpectedly`));
        this.pendingRequests.delete(seq);
      }

      // Attempt reconnection if not disposed
      if (!this.isDisposed) {
        this.attemptReconnect();
      }
    });

    // Handle process errors
    this.process.on('error', (error) => {
      log(`TSServer process error: ${error.message}`);
      this.emit('error', error);
    });
  }

  /**
   * Handle incoming data from tsserver stdout
   * Implements newline-delimited JSON parsing
   */
  private handleData(chunk: string): void {
    this.buffer += chunk;

    // Process complete lines (newline-delimited JSON)
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.length === 0) {
        continue;
      }

      try {
        const message = JSON.parse(line) as TSServerMessage;
        this.handleMessage(message);
      } catch (error) {
        // Skip non-JSON lines (tsserver sometimes outputs plain text)
        if (line.startsWith('{')) {
          log(`Failed to parse JSON message: ${error}`);
        }
      }
    }
  }

  /**
   * Handle a parsed message from tsserver
   */
  private handleMessage(message: TSServerMessage): void {
    if (message.type === 'response') {
      const response = message as TSServerResponse;
      const pending = this.pendingRequests.get(response.request_seq);

      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(response.request_seq);
        pending.resolve(response);
      } else {
        log(`Received response for unknown request: ${response.request_seq}`);
      }
    } else if (message.type === 'event') {
      const event = message as TSServerEvent;
      this.emit('event', event);
      this.emit(event.event, event.body);
    }
  }

  /**
   * Send a request to tsserver and wait for response
   */
  async sendRequest(command: string, args?: Record<string, unknown>): Promise<TSServerResponse> {
    if (!this.process || !this.process.stdin) {
      throw new Error('TSServer is not running');
    }

    const seq = ++this.sequenceNumber;
    const request: TSServerRequest = {
      seq,
      type: 'request',
      command,
      arguments: args,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(seq);
        reject(new Error(`Request timed out after ${DEFAULT_TIMEOUT}ms: ${command}`));
      }, DEFAULT_TIMEOUT);

      this.pendingRequests.set(seq, { resolve, reject, timer });

      // Send as newline-delimited JSON
      const message = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(message, 'utf-8');
    });
  }

  /**
   * Attempt to reconnect to tsserver after a crash
   */
  private async attemptReconnect(): Promise<void> {
    if (this.retryCount >= MAX_RETRIES) {
      log('Max retries reached, giving up');
      this.emit('failed', new Error('TSServer failed after maximum reconnection attempts'));
      return;
    }

    const delay = BACKOFF_DELAYS[this.retryCount];
    log(`Attempting reconnect in ${delay}ms (attempt ${this.retryCount + 1}/${MAX_RETRIES})`);
    this.retryCount++;

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.start();
      this.retryCount = 0; // Reset on successful reconnect
      this.emit('reconnected');
      log('Reconnected successfully');
    } catch (error) {
      log(`Reconnection attempt failed: ${error}`);
      this.attemptReconnect();
    }
  }

  /**
   * Open a file in tsserver
   */
  async openFile(filePath: string, content?: string): Promise<TSServerResponse> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    const args: Record<string, unknown> = {
      file: absolutePath,
    };

    if (content !== undefined) {
      args.fileContent = content;
    }

    return this.sendRequest('open', args);
  }

  /**
   * Close a file in tsserver
   */
  async closeFile(filePath: string): Promise<TSServerResponse> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    return this.sendRequest('close', { file: absolutePath });
  }

  /**
   * Get project info for a file
   */
  async getProjectInfo(filePath: string): Promise<TSServerResponse> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    return this.sendRequest('projectInfo', {
      file: absolutePath,
      needFileNameList: true,
    });
  }

  /**
   * Get definition locations for a symbol at a position
   * @implements FS-001.2
   */
  async getDefinition(
    filePath: string,
    line: number,
    column: number
  ): Promise<TSServerResponse> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    // tsserver uses 1-based line/column, same as our API
    return this.sendRequest('definition', {
      file: absolutePath,
      line,
      offset: column, // tsserver calls column "offset"
    });
  }

  /**
   * Get references to a symbol at a position
   * @implements FS-001.1
   */
  async getReferences(
    filePath: string,
    line: number,
    column: number
  ): Promise<TSServerResponse> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    return this.sendRequest('references', {
      file: absolutePath,
      line,
      offset: column,
    });
  }

  /**
   * Get diagnostics for a file
   * @implements FS-001.4
   */
  async getDiagnostics(filePath: string): Promise<{
    syntactic: TSServerResponse;
    semantic: TSServerResponse;
    suggestion: TSServerResponse;
  }> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    const [syntactic, semantic, suggestion] = await Promise.all([
      this.sendRequest('syntacticDiagnosticsSync', { file: absolutePath }),
      this.sendRequest('semanticDiagnosticsSync', { file: absolutePath }),
      this.sendRequest('suggestionDiagnosticsSync', { file: absolutePath }),
    ]);

    return { syntactic, semantic, suggestion };
  }

  /**
   * Rename a symbol at a position
   * @implements FS-001.3
   */
  async rename(
    filePath: string,
    line: number,
    column: number,
    findInComments: boolean = false,
    findInStrings: boolean = false
  ): Promise<TSServerResponse> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    return this.sendRequest('rename', {
      file: absolutePath,
      line,
      offset: column,
      findInComments,
      findInStrings,
    });
  }

  /**
   * Get the workspace root path
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Dispose the wrapper and kill the tsserver process
   */
  dispose(): void {
    this.isDisposed = true;

    // Clear all pending requests
    for (const [seq, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('TSServer disposed'));
      this.pendingRequests.delete(seq);
    }

    // Kill the process
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }

    log('TSServer wrapper disposed');
  }

  /**
   * Check if tsserver is running
   */
  isRunning(): boolean {
    return this.process !== null && !this.isDisposed;
  }
}
