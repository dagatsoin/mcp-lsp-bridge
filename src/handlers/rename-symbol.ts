/**
 * rename_symbol tool handler
 * @implements FS-001.3
 */

import * as fs from 'fs';
import * as path from 'path';
import { TSServerWrapper } from '../tsserver.js';
import {
  ErrorCodes,
  type RenameSymbolInput,
  type RenameSymbolResponse,
  type FileModification,
  type FileChange,
} from '../types.js';

/**
 * Make a path relative to workspace root
 */
function makeRelativePath(absolutePath: string, workspaceRoot: string): string {
  const normalizedPath = path.normalize(absolutePath);
  const normalizedRoot = path.normalize(workspaceRoot);

  if (normalizedPath.startsWith(normalizedRoot)) {
    return path.relative(normalizedRoot, normalizedPath);
  }

  return absolutePath;
}

/**
 * Check if a file is within the workspace root
 * @implements BS-001.4: External Modification Boundary
 */
function isWithinWorkspace(filePath: string, workspaceRoot: string): boolean {
  const normalizedPath = path.normalize(path.resolve(filePath));
  const normalizedRoot = path.normalize(path.resolve(workspaceRoot));
  return normalizedPath.startsWith(normalizedRoot);
}

/**
 * Apply text changes to a file and return modification info
 */
function applyChangesToFile(
  filePath: string,
  changes: Array<{
    start: { line: number; offset: number };
    end: { line: number; offset: number };
    newText: string;
  }>,
  workspaceRoot: string
): FileModification {
  // Read current file content
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const fileChanges: FileChange[] = [];

  // Sort changes by position (reverse order so we can apply from bottom to top)
  const sortedChanges = [...changes].sort((a, b) => {
    if (b.start.line !== a.start.line) {
      return b.start.line - a.start.line;
    }
    return b.start.offset - a.start.offset;
  });

  // Apply each change
  for (const change of sortedChanges) {
    const lineIdx = change.start.line - 1;
    if (lineIdx >= 0 && lineIdx < lines.length) {
      const oldLine = lines[lineIdx];
      const startCol = change.start.offset - 1;
      const endCol = change.end.offset - 1;

      // Apply the change to this line
      const newLine =
        oldLine.substring(0, startCol) + change.newText + oldLine.substring(endCol);

      fileChanges.push({
        line: change.start.line,
        oldText: oldLine,
        newText: newLine,
      });

      lines[lineIdx] = newLine;
    }
  }

  // Write the modified content back
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');

  // Reverse fileChanges to show in document order
  fileChanges.reverse();

  return {
    filePath: makeRelativePath(filePath, workspaceRoot),
    changeCount: fileChanges.length,
    changes: fileChanges,
  };
}

/**
 * Handle rename_symbol tool request
 */
export async function handleRenameSymbol(
  input: RenameSymbolInput,
  tsserver: TSServerWrapper
): Promise<RenameSymbolResponse> {
  const { workspaceRoot, filePath, line, column, newName } = input;

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

  // Validate newName is a valid identifier
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(newName)) {
    return {
      success: false,
      error: {
        code: ErrorCodes.RENAME_CONFLICT,
        message: `Invalid identifier: "${newName}" is not a valid JavaScript/TypeScript identifier`,
        resolution: 'Choose a valid identifier name (letters, numbers, underscores, starting with letter or underscore)',
      },
    };
  }

  try {
    // Ensure file is open in tsserver
    await tsserver.openFile(absoluteFilePath, fileContent);

    // Get rename locations from tsserver
    const response = await tsserver.rename(absoluteFilePath, line, column);

    if (!response.success) {
      // Check for specific error types
      if (response.message?.includes('not find')) {
        return {
          success: false,
          error: {
            code: ErrorCodes.NO_SYMBOL_AT_POSITION,
            message: 'No symbol found at the specified position',
            resolution: 'Position the cursor on a symbol (identifier, type name, etc.)',
          },
        };
      }

      return {
        success: false,
        error: {
          code: ErrorCodes.LANGUAGE_SERVER_ERROR,
          message: response.message || 'Failed to get rename information from language server',
          resolution: 'Retry the operation. If persistent, check project configuration',
        },
      };
    }

    // Parse rename response
    const renameInfo = response.body as {
      info?: {
        canRename: boolean;
        displayName?: string;
        fullDisplayName?: string;
        kind?: string;
        localizedErrorMessage?: string;
      };
      locs?: Array<{
        file: string;
        locs: Array<{
          start: { line: number; offset: number };
          end: { line: number; offset: number };
        }>;
      }>;
    } | undefined;

    if (!renameInfo) {
      return {
        success: false,
        error: {
          code: ErrorCodes.NO_SYMBOL_AT_POSITION,
          message: 'No symbol found at the specified position',
          resolution: 'Position the cursor on a symbol (identifier, type name, etc.)',
        },
      };
    }

    // Check if rename is allowed
    if (renameInfo.info && !renameInfo.info.canRename) {
      return {
        success: false,
        error: {
          code: ErrorCodes.RENAME_CONFLICT,
          message: renameInfo.info.localizedErrorMessage || 'Cannot rename this symbol',
          resolution: 'This symbol cannot be renamed. It may be a built-in or external symbol.',
        },
      };
    }

    if (!renameInfo.locs || renameInfo.locs.length === 0) {
      return {
        success: false,
        error: {
          code: ErrorCodes.NO_SYMBOL_AT_POSITION,
          message: 'No symbol found at the specified position',
          resolution: 'Position the cursor on a symbol (identifier, type name, etc.)',
        },
      };
    }

    // Filter locations to only include files within workspace (BS-001.4)
    const workspaceLocations = renameInfo.locs.filter((loc) =>
      isWithinWorkspace(loc.file, workspaceRoot)
    );

    if (workspaceLocations.length === 0) {
      return {
        success: false,
        error: {
          code: ErrorCodes.RENAME_CONFLICT,
          message: 'No rename locations found within the workspace',
          resolution: 'The symbol may only be referenced in external files (node_modules)',
        },
      };
    }

    // Apply changes to each file
    const filesModified: FileModification[] = [];
    let totalChanges = 0;

    for (const fileLocs of workspaceLocations) {
      try {
        // Convert locations to text changes
        const textChanges = fileLocs.locs.map((loc) => ({
          start: loc.start,
          end: loc.end,
          newText: newName,
        }));

        const modification = applyChangesToFile(
          fileLocs.file,
          textChanges,
          workspaceRoot
        );

        filesModified.push(modification);
        totalChanges += modification.changeCount;
      } catch (error) {
        // Log error but continue with other files
        console.error(`Failed to apply changes to ${fileLocs.file}:`, error);
      }
    }

    return {
      success: true,
      filesModified,
      totalChanges,
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
