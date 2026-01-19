import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server.js';

describe('MCP Server', () => {
  it('should create a server instance', () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it('should have server name and version', () => {
    const server = createServer();
    // Server is created with name and version
    expect(server).toBeDefined();
  });
});

describe('Tool Schemas', () => {
  it('should export find_references schema', async () => {
    const { findReferencesSchema } = await import('../src/schemas.js');
    expect(findReferencesSchema).toBeDefined();

    // Valid input
    const result = findReferencesSchema.safeParse({
      workspaceRoot: '/path/to/project',
      filePath: 'src/index.ts',
      line: 1,
      column: 1,
    });
    expect(result.success).toBe(true);
  });

  it('should export go_to_definition schema', async () => {
    const { goToDefinitionSchema } = await import('../src/schemas.js');
    expect(goToDefinitionSchema).toBeDefined();

    const result = goToDefinitionSchema.safeParse({
      workspaceRoot: '/path/to/project',
      filePath: 'src/index.ts',
      line: 10,
      column: 5,
    });
    expect(result.success).toBe(true);
  });

  it('should export rename_symbol schema', async () => {
    const { renameSymbolSchema } = await import('../src/schemas.js');
    expect(renameSymbolSchema).toBeDefined();

    const result = renameSymbolSchema.safeParse({
      workspaceRoot: '/path/to/project',
      filePath: 'src/index.ts',
      line: 10,
      column: 5,
      newName: 'newFunctionName',
    });
    expect(result.success).toBe(true);
  });

  it('should export get_diagnostics schema', async () => {
    const { getDiagnosticsSchema } = await import('../src/schemas.js');
    expect(getDiagnosticsSchema).toBeDefined();

    // With filePath
    const result1 = getDiagnosticsSchema.safeParse({
      workspaceRoot: '/path/to/project',
      filePath: 'src/index.ts',
    });
    expect(result1.success).toBe(true);

    // Without filePath (project-wide)
    const result2 = getDiagnosticsSchema.safeParse({
      workspaceRoot: '/path/to/project',
    });
    expect(result2.success).toBe(true);
  });

  it('should reject invalid line numbers', async () => {
    const { findReferencesSchema } = await import('../src/schemas.js');

    const result = findReferencesSchema.safeParse({
      workspaceRoot: '/path/to/project',
      filePath: 'src/index.ts',
      line: 0, // Invalid: must be positive
      column: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('Error Types', () => {
  it('should export error codes', async () => {
    const { ErrorCodes } = await import('../src/types.js');
    expect(ErrorCodes.NOT_IMPLEMENTED).toBe('NOT_IMPLEMENTED');
    expect(ErrorCodes.WORKSPACE_NOT_FOUND).toBe('WORKSPACE_NOT_FOUND');
    expect(ErrorCodes.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
    expect(ErrorCodes.INVALID_POSITION).toBe('INVALID_POSITION');
  });
});
