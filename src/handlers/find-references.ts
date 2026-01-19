/**
 * find_references tool handler
 * @implements FS-001.1
 */

import * as fs from 'fs';
import * as path from 'path';
import { TSServerWrapper } from '../tsserver.js';
import {
  ErrorCodes,
  type FindReferencesInput,
  type FindReferencesResponse,
  type Reference,
} from '../types.js';

const MAX_RESULTS = 500;

/**
 * Read a specific line from a file
 */
function readLineFromFile(filePath: string, lineNumber: number): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    if (lineNumber > 0 && lineNumber <= lines.length) {
      return lines[lineNumber - 1];
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Check if a file path is in node_modules
 */
function isInNodeModules(filePath: string): boolean {
  return filePath.includes('node_modules');
}

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
 * Determine if a reference is a declaration or usage
 * A reference is a declaration if it's the definition location of the symbol
 */
function determineReferenceType(
  ref: { file: string; start: { line: number; offset: number }; isDefinition?: boolean },
  _symbolPosition: { file: string; line: number; column: number }
): 'declaration' | 'usage' {
  // TSServer provides isDefinition flag in references response
  if (ref.isDefinition) {
    return 'declaration';
  }
  return 'usage';
}

/**
 * Handle find_references tool request
 */
export async function handleFindReferences(
  input: FindReferencesInput,
  tsserver: TSServerWrapper
): Promise<FindReferencesResponse> {
  const { workspaceRoot, filePath, line, column, includeNodeModules = false } = input;

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

    // Get references from tsserver
    const response = await tsserver.getReferences(absoluteFilePath, line, column);

    if (!response.success) {
      return {
        success: false,
        error: {
          code: ErrorCodes.LANGUAGE_SERVER_ERROR,
          message: response.message || 'Failed to get references from language server',
          resolution: 'Retry the operation. If persistent, check project configuration',
        },
      };
    }

    // Transform tsserver response
    const tsRefs = response.body as {
      refs: Array<{
        file: string;
        start: { line: number; offset: number };
        end: { line: number; offset: number };
        isDefinition?: boolean;
        isWriteAccess?: boolean;
      }>;
      symbolName: string;
      symbolStartOffset: number;
      symbolDisplayString: string;
    } | undefined;

    if (!tsRefs || !tsRefs.refs || tsRefs.refs.length === 0) {
      // No references found
      return {
        success: true,
        references: [],
        totalCount: 0,
        truncated: false,
      };
    }

    const symbolPosition = { file: absoluteFilePath, line, column };

    // Filter and transform references
    let references: Reference[] = tsRefs.refs
      .filter((ref) => {
        // Filter out node_modules unless explicitly requested
        if (!includeNodeModules && isInNodeModules(ref.file)) {
          return false;
        }
        return true;
      })
      .map((ref) => {
        const relativePath = makeRelativePath(ref.file, workspaceRoot);
        const codeSnippet = readLineFromFile(ref.file, ref.start.line);
        const referenceType = determineReferenceType(ref, symbolPosition);

        return {
          filePath: relativePath,
          line: ref.start.line,
          column: ref.start.offset,
          codeSnippet,
          referenceType,
        };
      });

    // Sort references: declarations first, then by file path (BS-001.3)
    references.sort((a, b) => {
      // Declarations come first
      if (a.referenceType === 'declaration' && b.referenceType !== 'declaration') {
        return -1;
      }
      if (a.referenceType !== 'declaration' && b.referenceType === 'declaration') {
        return 1;
      }
      // Then sort by file path
      const pathCompare = a.filePath.localeCompare(b.filePath);
      if (pathCompare !== 0) {
        return pathCompare;
      }
      // Then by line number
      return a.line - b.line;
    });

    const totalCount = references.length;
    const truncated = totalCount > MAX_RESULTS;

    // Truncate if necessary (BS-001.5)
    if (truncated) {
      references = references.slice(0, MAX_RESULTS);
    }

    return {
      success: true,
      references,
      totalCount,
      truncated,
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
