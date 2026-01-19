/**
 * MCP Server implementation for MCP-LSP Bridge
 * @implements FS-001
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  findReferencesSchema,
  goToDefinitionSchema,
  renameSymbolSchema,
  getDiagnosticsSchema,
} from './schemas.js';
import { ErrorCodes, type ErrorResponse, type GoToDefinitionInput, type FindReferencesInput, type GetDiagnosticsInput, type RenameSymbolInput } from './types.js';
import { TSServerWrapper } from './tsserver.js';
import { handleGoToDefinition } from './handlers/go-to-definition.js';
import { handleFindReferences } from './handlers/find-references.js';
import { handleGetDiagnostics } from './handlers/get-diagnostics.js';
import { handleRenameSymbol } from './handlers/rename-symbol.js';

// Logging utility - all logs go to stderr (stdout reserved for MCP protocol)
function log(message: string): void {
  console.error(`[mcp-lsp-bridge] ${message}`);
}

// TSServer instance cache - one per workspace
const tsserverCache = new Map<string, TSServerWrapper>();

/**
 * Get or create a TSServer wrapper for a workspace
 */
async function getTSServer(workspaceRoot: string): Promise<TSServerWrapper> {
  let tsserver = tsserverCache.get(workspaceRoot);

  if (!tsserver || !tsserver.isRunning()) {
    // Clean up old instance if exists
    if (tsserver) {
      tsserver.dispose();
      tsserverCache.delete(workspaceRoot);
    }

    // Create new instance
    tsserver = new TSServerWrapper(workspaceRoot);
    await tsserver.start();
    tsserverCache.set(workspaceRoot, tsserver);
    log(`Started TSServer for workspace: ${workspaceRoot}`);
  }

  return tsserver;
}

/**
 * Dispose all TSServer instances
 */
function disposeAllTSServers(): void {
  for (const [workspace, tsserver] of tsserverCache) {
    log(`Disposing TSServer for workspace: ${workspace}`);
    tsserver.dispose();
  }
  tsserverCache.clear();
}

// Create and configure the MCP server
export function createServer(): McpServer {
  const server = new McpServer({
    name: 'mcp-lsp-bridge',
    version: '0.1.0',
  });

  // FS-001.1: find_references tool
  server.tool(
    'find_references',
    'Locates all references to a symbol at a specified position in the codebase. Returns file paths, line/column numbers, code snippets, and whether each reference is a declaration or usage.',
    findReferencesSchema.shape,
    async (args) => {
      log('find_references called');

      try {
        const input = args as unknown as FindReferencesInput;
        const tsserver = await getTSServer(input.workspaceRoot);
        const result = await handleFindReferences(input, tsserver);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: ErrorCodes.LANGUAGE_SERVER_ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
            resolution: 'Retry the operation. If persistent, check project configuration',
          },
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      }
    }
  );

  // FS-001.2: go_to_definition tool
  server.tool(
    'go_to_definition',
    'Navigates to the definition of a symbol at a specified position. Returns the file path, line/column of the definition, and indicates if the definition is external (node_modules or .d.ts).',
    goToDefinitionSchema.shape,
    async (args) => {
      log('go_to_definition called');

      try {
        const input = args as unknown as GoToDefinitionInput;
        const tsserver = await getTSServer(input.workspaceRoot);
        const result = await handleGoToDefinition(input, tsserver);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: ErrorCodes.LANGUAGE_SERVER_ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
            resolution: 'Retry the operation. If persistent, check project configuration',
          },
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      }
    }
  );

  // FS-001.3: rename_symbol tool
  server.tool(
    'rename_symbol',
    'Renames a symbol and updates all references across the project. Modifies files directly and returns a detailed report of all changes made.',
    renameSymbolSchema.shape,
    async (args) => {
      log('rename_symbol called');

      try {
        const input = args as unknown as RenameSymbolInput;
        const tsserver = await getTSServer(input.workspaceRoot);
        const result = await handleRenameSymbol(input, tsserver);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: ErrorCodes.LANGUAGE_SERVER_ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
            resolution: 'Retry the operation. If persistent, check project configuration',
          },
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      }
    }
  );

  // FS-001.4: get_diagnostics tool
  server.tool(
    'get_diagnostics',
    'Retrieves compilation errors, warnings, and other diagnostics for a file or the entire project. Returns severity, diagnostic codes, and code snippets.',
    getDiagnosticsSchema.shape,
    async (args) => {
      log('get_diagnostics called');

      try {
        const input = args as unknown as GetDiagnosticsInput;
        const tsserver = await getTSServer(input.workspaceRoot);
        const result = await handleGetDiagnostics(input, tsserver);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: ErrorCodes.LANGUAGE_SERVER_ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
            resolution: 'Retry the operation. If persistent, check project configuration',
          },
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      }
    }
  );

  return server;
}

// Start the server with stdio transport
export async function startServer(): Promise<void> {
  log('Starting MCP-LSP Bridge server...');

  const server = createServer();
  const transport = new StdioServerTransport();

  // Graceful shutdown handlers
  const shutdown = () => {
    log('Shutting down...');
    disposeAllTSServers();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await server.connect(transport);
  log('Server connected and ready');
}

// Export for testing
export { getTSServer, disposeAllTSServers };
