import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleFindReferences } from '../src/handlers/find-references.js';
import { TSServerWrapper } from '../src/tsserver.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'sample-project');

describe('find_references handler', () => {
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
    it('should find references to exported function', async () => {
      // In utils.ts line 5: export function greet(name: string): string {
      // 'greet' starts at column 17
      const result = await handleFindReferences(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/utils.ts',
          line: 5,
          column: 17, // Position on 'greet' in the function definition
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.references.length).toBeGreaterThan(0);
        expect(result.totalCount).toBeGreaterThan(0);
        expect(result.truncated).toBe(false);

        // Should have at least one declaration
        const declaration = result.references.find((r) => r.referenceType === 'declaration');
        expect(declaration).toBeDefined();

        // Should have usages in index.ts
        const usageInIndex = result.references.find(
          (r) => r.filePath === 'src/index.ts' && r.referenceType === 'usage'
        );
        expect(usageInIndex).toBeDefined();
      }
    }, 30000);

    it('should find references to type/interface', async () => {
      // In utils.ts line 13: export interface User {
      // 'User' starts at column 18
      const result = await handleFindReferences(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/utils.ts',
          line: 13,
          column: 18, // Position on 'User' in interface definition
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.references.length).toBeGreaterThan(0);

        // Check for declaration
        const declaration = result.references.find((r) => r.referenceType === 'declaration');
        expect(declaration).toBeDefined();
      }
    }, 30000);

    it('should return empty array when no references found', async () => {
      // Position on keyword or whitespace
      const result = await handleFindReferences(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 1,
          column: 1,
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.references).toBeDefined();
        expect(result.truncated).toBe(false);
      }
    }, 30000);

    it('should include code snippets for each reference', async () => {
      const result = await handleFindReferences(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/utils.ts',
          line: 5,
          column: 17,
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success && result.references.length > 0) {
        result.references.forEach((ref) => {
          expect(ref.codeSnippet).toBeDefined();
          expect(typeof ref.codeSnippet).toBe('string');
        });
      }
    }, 30000);

    it('should order declarations first, then usages by file path', async () => {
      const result = await handleFindReferences(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/utils.ts',
          line: 5,
          column: 17,
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success && result.references.length > 1) {
        // First reference(s) should be declarations
        let seenUsage = false;
        for (const ref of result.references) {
          if (ref.referenceType === 'usage') {
            seenUsage = true;
          } else if (ref.referenceType === 'declaration' && seenUsage) {
            // Declaration after usage - ordering is wrong
            throw new Error('Declarations should come before usages');
          }
        }
      }
    }, 30000);
  });

  describe('Error cases', () => {
    it('should return WORKSPACE_NOT_FOUND for invalid workspace', async () => {
      const result = await handleFindReferences(
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
      const result = await handleFindReferences(
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
      const result = await handleFindReferences(
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
  });

  describe('Filtering', () => {
    it('should exclude node_modules by default', async () => {
      // Find references to a symbol that might have node_modules refs
      const result = await handleFindReferences(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/utils.ts',
          line: 5,
          column: 17,
          includeNodeModules: false,
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const nodeModulesRefs = result.references.filter((r) =>
          r.filePath.includes('node_modules')
        );
        expect(nodeModulesRefs.length).toBe(0);
      }
    }, 30000);
  });

  describe('Path handling', () => {
    it('should return relative paths for project files', async () => {
      const result = await handleFindReferences(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/utils.ts',
          line: 5,
          column: 17,
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        result.references.forEach((ref) => {
          // Paths should be relative, not absolute
          expect(ref.filePath).not.toMatch(/^\//);
        });
      }
    }, 30000);
  });
});
