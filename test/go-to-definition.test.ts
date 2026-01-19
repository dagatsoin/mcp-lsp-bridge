import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleGoToDefinition } from '../src/handlers/go-to-definition.js';
import { TSServerWrapper } from '../src/tsserver.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'sample-project');

describe('go_to_definition handler', () => {
  let tsserver: TSServerWrapper;

  beforeAll(async () => {
    tsserver = new TSServerWrapper(FIXTURE_PATH);
    await tsserver.start();
  }, 30000);

  afterAll(() => {
    if (tsserver) {
      tsserver.dispose();
    }
  });

  describe('Success cases', () => {
    it('should find definition of imported function', async () => {
      // In index.ts line 5: import { greet, add, createUser, User } from './utils.js';
      // 'greet' starts at column 10
      const result = await handleGoToDefinition(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 5,
          column: 10, // Position on 'greet'
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.definitions.length).toBeGreaterThan(0);
        const def = result.definitions[0];
        expect(def.filePath).toBe('src/utils.ts');
        expect(def.isExternal).toBe(false);
        expect(def.codeSnippet).toContain('greet');
      }
    }, 30000);

    it('should find definition of local variable usage', async () => {
      // In index.ts line 9: console.log(greeting);
      // 'greeting' is at column 13
      const result = await handleGoToDefinition(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 9,
          column: 13, // Position on 'greeting'
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.definitions.length).toBeGreaterThan(0);
        const def = result.definitions[0];
        expect(def.filePath).toBe('src/index.ts');
        expect(def.line).toBe(8); // Definition is on line 8: const greeting = greet('World');
        expect(def.isExternal).toBe(false);
      }
    }, 30000);

    it('should return empty array when no definition exists', async () => {
      // Position on whitespace/keyword where there's no symbol
      const result = await handleGoToDefinition(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 1,
          column: 1, // Beginning of file - comment
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should return success with empty definitions, not an error
        expect(result.definitions).toBeDefined();
      }
    }, 30000);

    it('should find definition of type', async () => {
      // In index.ts line 16: const user: User = createUser(1, 'John', 'john@example.com');
      // 'User' is at column 13
      const result = await handleGoToDefinition(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 16,
          column: 13, // Position on 'User'
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.definitions.length).toBeGreaterThan(0);
        const def = result.definitions[0];
        expect(def.filePath).toBe('src/utils.ts');
        expect(def.codeSnippet).toContain('User');
        expect(def.isExternal).toBe(false);
      }
    }, 30000);
  });

  describe('Error cases', () => {
    it('should return WORKSPACE_NOT_FOUND for invalid workspace', async () => {
      const result = await handleGoToDefinition(
        {
          workspaceRoot: '/nonexistent/workspace',
          filePath: 'src/index.ts',
          line: 1,
          column: 1,
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKSPACE_NOT_FOUND');
      }
    }, 30000);

    it('should return FILE_NOT_FOUND for non-existent file', async () => {
      const result = await handleGoToDefinition(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/nonexistent.ts',
          line: 1,
          column: 1,
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_NOT_FOUND');
      }
    }, 30000);

    it('should return INVALID_POSITION for out-of-bounds line', async () => {
      const result = await handleGoToDefinition(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 9999,
          column: 1,
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_POSITION');
      }
    }, 30000);

    it('should return INVALID_POSITION for out-of-bounds column', async () => {
      const result = await handleGoToDefinition(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 1,
          column: 9999,
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_POSITION');
      }
    }, 30000);
  });

  describe('Path handling', () => {
    it('should return relative paths for project files', async () => {
      // Line 5: import { greet, ... } from './utils.js';
      const result = await handleGoToDefinition(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 5,
          column: 10,
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success && result.definitions.length > 0) {
        const def = result.definitions[0];
        // Path should be relative, not absolute
        expect(def.filePath).not.toMatch(/^\//);
        expect(def.filePath).toBe('src/utils.ts');
      }
    }, 30000);
  });
});
