/**
 * Zod schemas for MCP tool input validation
 * @implements FS-001
 */

import { z } from 'zod';

// FS-001.1: find_references schema
export const findReferencesSchema = z.object({
  workspaceRoot: z
    .string()
    .describe('Absolute path to the project root directory'),
  filePath: z
    .string()
    .describe('Path to the file containing the symbol (relative to workspaceRoot)'),
  line: z
    .number()
    .int()
    .positive()
    .describe('Line number of the symbol position (1-indexed)'),
  column: z
    .number()
    .int()
    .positive()
    .describe('Column number of the symbol position (1-indexed)'),
  includeNodeModules: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include references from node_modules (default: false)'),
});

// FS-001.2: go_to_definition schema
export const goToDefinitionSchema = z.object({
  workspaceRoot: z
    .string()
    .describe('Absolute path to the project root directory'),
  filePath: z
    .string()
    .describe('Path to the file containing the symbol (relative to workspaceRoot)'),
  line: z
    .number()
    .int()
    .positive()
    .describe('Line number of the symbol position (1-indexed)'),
  column: z
    .number()
    .int()
    .positive()
    .describe('Column number of the symbol position (1-indexed)'),
});

// FS-001.3: rename_symbol schema
export const renameSymbolSchema = z.object({
  workspaceRoot: z
    .string()
    .describe('Absolute path to the project root directory'),
  filePath: z
    .string()
    .describe('Path to the file containing the symbol (relative to workspaceRoot)'),
  line: z
    .number()
    .int()
    .positive()
    .describe('Line number of the symbol position (1-indexed)'),
  column: z
    .number()
    .int()
    .positive()
    .describe('Column number of the symbol position (1-indexed)'),
  newName: z
    .string()
    .min(1)
    .describe('The new name for the symbol'),
});

// FS-001.4: get_diagnostics schema
export const getDiagnosticsSchema = z.object({
  workspaceRoot: z
    .string()
    .describe('Absolute path to the project root directory'),
  filePath: z
    .string()
    .optional()
    .describe('Path to specific file (relative to workspaceRoot). If omitted, returns project-wide diagnostics'),
});
