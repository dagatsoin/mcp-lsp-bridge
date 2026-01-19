/**
 * get_diagnostics tool handler
 * @implements FS-001.4
 */

import * as fs from 'fs';
import * as path from 'path';
import { TSServerWrapper } from '../tsserver.js';
import {
  ErrorCodes,
  type GetDiagnosticsInput,
  type GetDiagnosticsResponse,
  type Diagnostic,
} from '../types.js';

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
 * Map tsserver diagnostic category to severity
 */
function mapCategoryToSeverity(
  category: string
): 'error' | 'warning' | 'info' | 'hint' {
  switch (category.toLowerCase()) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'suggestion':
      return 'hint';
    case 'message':
    default:
      return 'info';
  }
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
 * Transform tsserver diagnostic to our format
 */
function transformDiagnostic(
  diag: {
    start: { line: number; offset: number };
    end: { line: number; offset: number };
    text: string;
    code: number;
    category: string;
  },
  filePath: string,
  workspaceRoot: string
): Diagnostic {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(workspaceRoot, filePath);
  const relativePath = makeRelativePath(absolutePath, workspaceRoot);
  const codeSnippet = readLineFromFile(absolutePath, diag.start.line);

  return {
    filePath: relativePath,
    line: diag.start.line,
    column: diag.start.offset,
    endLine: diag.end.line,
    endColumn: diag.end.offset,
    severity: mapCategoryToSeverity(diag.category),
    code: `TS${diag.code}`,
    message: diag.text,
    codeSnippet,
  };
}

/**
 * Handle get_diagnostics tool request
 */
export async function handleGetDiagnostics(
  input: GetDiagnosticsInput,
  tsserver: TSServerWrapper
): Promise<GetDiagnosticsResponse> {
  const { workspaceRoot, filePath } = input;

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

  // If filePath is provided, validate it exists
  let absoluteFilePath: string | undefined;
  if (filePath) {
    absoluteFilePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(workspaceRoot, filePath);

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
  }

  try {
    const diagnostics: Diagnostic[] = [];

    if (absoluteFilePath) {
      // Single file diagnostics
      const fileContent = fs.readFileSync(absoluteFilePath, 'utf-8');
      await tsserver.openFile(absoluteFilePath, fileContent);

      const { syntactic, semantic, suggestion } = await tsserver.getDiagnostics(
        absoluteFilePath
      );

      // Process syntactic diagnostics
      if (syntactic.success && Array.isArray(syntactic.body)) {
        for (const diag of syntactic.body as Array<{
          start: { line: number; offset: number };
          end: { line: number; offset: number };
          text: string;
          code: number;
          category: string;
        }>) {
          diagnostics.push(
            transformDiagnostic(
              { ...diag, category: 'error' },
              absoluteFilePath,
              workspaceRoot
            )
          );
        }
      }

      // Process semantic diagnostics
      if (semantic.success && Array.isArray(semantic.body)) {
        for (const diag of semantic.body as Array<{
          start: { line: number; offset: number };
          end: { line: number; offset: number };
          text: string;
          code: number;
          category: string;
        }>) {
          diagnostics.push(
            transformDiagnostic(diag, absoluteFilePath, workspaceRoot)
          );
        }
      }

      // Process suggestion diagnostics
      if (suggestion.success && Array.isArray(suggestion.body)) {
        for (const diag of suggestion.body as Array<{
          start: { line: number; offset: number };
          end: { line: number; offset: number };
          text: string;
          code: number;
          category: string;
        }>) {
          diagnostics.push(
            transformDiagnostic(
              { ...diag, category: 'suggestion' },
              absoluteFilePath,
              workspaceRoot
            )
          );
        }
      }
    } else {
      // Project-wide diagnostics
      // We need to open some file to get project diagnostics
      // Find TypeScript files in the workspace
      const findTsFiles = (dir: string, files: string[] = []): string[] => {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (entry.name !== 'node_modules' && entry.name !== 'dist') {
                findTsFiles(fullPath, files);
              }
            } else if (
              entry.isFile() &&
              (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
              !entry.name.endsWith('.d.ts')
            ) {
              files.push(fullPath);
            }
          }
        } catch {
          // Ignore errors reading directories
        }
        return files;
      };

      const tsFiles = findTsFiles(workspaceRoot);

      for (const file of tsFiles) {
        try {
          const fileContent = fs.readFileSync(file, 'utf-8');
          await tsserver.openFile(file, fileContent);

          const { syntactic, semantic, suggestion } = await tsserver.getDiagnostics(file);

          // Process diagnostics
          if (syntactic.success && Array.isArray(syntactic.body)) {
            for (const diag of syntactic.body as Array<{
              start: { line: number; offset: number };
              end: { line: number; offset: number };
              text: string;
              code: number;
              category: string;
            }>) {
              diagnostics.push(
                transformDiagnostic(
                  { ...diag, category: 'error' },
                  file,
                  workspaceRoot
                )
              );
            }
          }

          if (semantic.success && Array.isArray(semantic.body)) {
            for (const diag of semantic.body as Array<{
              start: { line: number; offset: number };
              end: { line: number; offset: number };
              text: string;
              code: number;
              category: string;
            }>) {
              diagnostics.push(transformDiagnostic(diag, file, workspaceRoot));
            }
          }

          if (suggestion.success && Array.isArray(suggestion.body)) {
            for (const diag of suggestion.body as Array<{
              start: { line: number; offset: number };
              end: { line: number; offset: number };
              text: string;
              code: number;
              category: string;
            }>) {
              diagnostics.push(
                transformDiagnostic(
                  { ...diag, category: 'suggestion' },
                  file,
                  workspaceRoot
                )
              );
            }
          }
        } catch {
          // Continue with other files if one fails
        }
      }
    }

    // Count diagnostics by severity
    const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
    const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
    const infoCount = diagnostics.filter((d) => d.severity === 'info').length;
    const hintCount = diagnostics.filter((d) => d.severity === 'hint').length;

    return {
      success: true,
      diagnostics,
      errorCount,
      warningCount,
      infoCount,
      hintCount,
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
