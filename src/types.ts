/**
 * Type definitions for MCP-LSP Bridge
 * @implements FS-001
 */

// FS-001.7: Error Response Format
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    resolution: string;
  };
}

// Standard error codes from FS-001.7
export const ErrorCodes = {
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_POSITION: 'INVALID_POSITION',
  NO_SYMBOL_AT_POSITION: 'NO_SYMBOL_AT_POSITION',
  RENAME_CONFLICT: 'RENAME_CONFLICT',
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  LANGUAGE_SERVER_ERROR: 'LANGUAGE_SERVER_ERROR',
} as const;

// FS-001.1: find_references types
export interface FindReferencesInput {
  workspaceRoot: string;
  filePath: string;
  line: number;
  column: number;
  includeNodeModules?: boolean;
}

export interface Reference {
  filePath: string;
  line: number;
  column: number;
  codeSnippet: string;
  referenceType: 'declaration' | 'usage';
}

export interface FindReferencesSuccess {
  success: true;
  references: Reference[];
  totalCount: number;
  truncated: boolean;
  failures?: Array<{ filePath: string; reason: string }>;
}

export type FindReferencesResponse = FindReferencesSuccess | ErrorResponse;

// FS-001.2: go_to_definition types
export interface GoToDefinitionInput {
  workspaceRoot: string;
  filePath: string;
  line: number;
  column: number;
}

export interface Definition {
  filePath: string;
  line: number;
  column: number;
  codeSnippet: string;
  isExternal: boolean;
}

export interface GoToDefinitionSuccess {
  success: true;
  definitions: Definition[];
}

export type GoToDefinitionResponse = GoToDefinitionSuccess | ErrorResponse;

// FS-001.3: rename_symbol types
export interface RenameSymbolInput {
  workspaceRoot: string;
  filePath: string;
  line: number;
  column: number;
  newName: string;
}

export interface FileChange {
  line: number;
  oldText: string;
  newText: string;
}

export interface FileModification {
  filePath: string;
  changeCount: number;
  changes: FileChange[];
}

export interface RenameSymbolSuccess {
  success: true;
  filesModified: FileModification[];
  totalChanges: number;
}

export type RenameSymbolResponse = RenameSymbolSuccess | ErrorResponse;

// FS-001.4: get_diagnostics types
export interface GetDiagnosticsInput {
  workspaceRoot: string;
  filePath?: string;
}

export interface Diagnostic {
  filePath: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  severity: 'error' | 'warning' | 'info' | 'hint';
  code: string;
  message: string;
  codeSnippet: string;
}

export interface GetDiagnosticsSuccess {
  success: true;
  diagnostics: Diagnostic[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  hintCount: number;
}

export type GetDiagnosticsResponse = GetDiagnosticsSuccess | ErrorResponse;
