/**
 * go_to_definition tool handler
 * @implements FS-001.2
 */

import * as fs from 'fs';
import * as path from 'path';
import { TSServerWrapper } from '../tsserver.js';
import {
  ErrorCodes,
  type GoToDefinitionInput,
  type GoToDefinitionResponse,
  type Definition,
} from '../types.js';

/**
 * Read a specific line from a file
 */
function readLineFromFile(filePath: string, lineNumber: number): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    // lineNumber is 1-indexed
    if (lineNumber > 0 && lineNumber <= lines.length) {
      return lines[lineNumber - 1];
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Check if a file path is external (node_modules or .d.ts)
 */
function isExternalPath(filePath: string, workspaceRoot: string): boolean {
  // Check if it's in node_modules
  if (filePath.includes('node_modules')) {
    return true;
  }

  // Check if it's a .d.ts file outside the workspace
  if (filePath.endsWith('.d.ts')) {
    const normalizedPath = path.normalize(filePath);
    const normalizedRoot = path.normalize(workspaceRoot);
    if (!normalizedPath.startsWith(normalizedRoot)) {
      return true;
    }
  }

  return false;
}

/**
 * Make a path relative to workspace root, unless it's external
 */
function makeRelativePath(
  absolutePath: string,
  workspaceRoot: string,
  isExternal: boolean
): string {
  if (isExternal) {
    return absolutePath;
  }

  const normalizedPath = path.normalize(absolutePath);
  const normalizedRoot = path.normalize(workspaceRoot);

  if (normalizedPath.startsWith(normalizedRoot)) {
    return path.relative(normalizedRoot, normalizedPath);
  }

  return absolutePath;
}

/**
 * Handle go_to_definition tool request
 */
export async function handleGoToDefinition(
  input: GoToDefinitionInput,
  tsserver: TSServerWrapper
): Promise<GoToDefinitionResponse> {
  const { workspaceRoot, filePath, line, column } = input;

  // Validate workspace exists
  if (!fs.existsSync(workspaceRoot)) {
    return {
      success: false,
      error: {
        code: ErrorCodes.WORKSPACE_NOT_FOUND,
        message: `Workspace directory does not exist: ${workspaceRoot}`,
        resolution: 'Verify the workspace path exists and is accessible',
      },
    };
  }

  // Resolve absolute file path
  const absoluteFilePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(workspaceRoot, filePath);

  // Validate file exists
  if (!fs.existsSync(absoluteFilePath)) {
    return {
      success: false,
      error: {
        code: ErrorCodes.FILE_NOT_FOUND,
        message: `File does not exist: ${filePath}`,
        resolution: 'Check that the file path is correct and the file exists',
      },
    };
  }

  // Validate position is within file bounds
  const fileContent = fs.readFileSync(absoluteFilePath, 'utf-8');
  const lines = fileContent.split('\n');

  if (line < 1 || line > lines.length) {
    return {
      success: false,
      error: {
        code: ErrorCodes.INVALID_POSITION,
        message: `Line ${line} is out of bounds (file has ${lines.length} lines)`,
        resolution: 'Verify the position is within the file bounds',
      },
    };
  }

  const lineContent = lines[line - 1];
  if (column < 1 || column > lineContent.length + 1) {
    return {
      success: false,
      error: {
        code: ErrorCodes.INVALID_POSITION,
        message: `Column ${column} is out of bounds for line ${line} (line has ${lineContent.length} characters)`,
        resolution: 'Verify the position is within the file bounds',
      },
    };
  }

  try {
    // Ensure file is open in tsserver
    await tsserver.openFile(absoluteFilePath, fileContent);

    // Get definition from tsserver
    const response = await tsserver.getDefinition(absoluteFilePath, line, column);

    if (!response.success) {
      return {
        success: false,
        error: {
          code: ErrorCodes.LANGUAGE_SERVER_ERROR,
          message: response.message || 'Failed to get definition from language server',
          resolution: 'Retry the operation. If persistent, check project configuration',
        },
      };
    }

    // Transform tsserver response to our format
    const tsDefinitions = response.body as Array<{
      file: string;
      start: { line: number; offset: number };
      end: { line: number; offset: number };
    }> | undefined;

    if (!tsDefinitions || tsDefinitions.length === 0) {
      // No definition found - could be whitespace, comment, or no symbol
      // Return success with empty array per AC-1.2.4
      return {
        success: true,
        definitions: [],
      };
    }

    const definitions: Definition[] = tsDefinitions.map((def) => {
      const isExternal = isExternalPath(def.file, workspaceRoot);
      const relativePath = makeRelativePath(def.file, workspaceRoot, isExternal);
      const codeSnippet = readLineFromFile(def.file, def.start.line);

      return {
        filePath: relativePath,
        line: def.start.line,
        column: def.start.offset,
        codeSnippet,
        isExternal,
      };
    });

    return {
      success: true,
      definitions,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ErrorCodes.LANGUAGE_SERVER_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        resolution: 'Retry the operation. If persistent, check project configuration',
      },
    };
  }
}
