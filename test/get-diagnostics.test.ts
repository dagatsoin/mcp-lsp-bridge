import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleGetDiagnostics } from '../src/handlers/get-diagnostics.js';
import { TSServerWrapper } from '../src/tsserver.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'sample-project');

describe('get_diagnostics handler', () => {
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

  describe('Single file diagnostics', () => {
    it('should return diagnostics for file with errors', async () => {
      // errors.ts has intentional type errors
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/errors.ts',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.diagnostics.length).toBeGreaterThan(0);
        expect(result.errorCount).toBeGreaterThan(0);

        // Check diagnostic structure
        const firstDiag = result.diagnostics[0];
        expect(firstDiag.filePath).toBe('src/errors.ts');
        expect(firstDiag.line).toBeGreaterThan(0);
        expect(firstDiag.column).toBeGreaterThan(0);
        expect(firstDiag.severity).toBeDefined();
        expect(firstDiag.code).toMatch(/^TS\d+$/);
        expect(firstDiag.message).toBeDefined();
        expect(firstDiag.codeSnippet).toBeDefined();
      }
    }, 30000);

    it('should return empty diagnostics for clean file', async () => {
      // utils.ts should have no errors
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/utils.ts',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Clean file should have no errors
        expect(result.errorCount).toBe(0);
      }
    }, 30000);

    it('should include all severity levels in counts', async () => {
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/errors.ts',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.errorCount).toBe('number');
        expect(typeof result.warningCount).toBe('number');
        expect(typeof result.infoCount).toBe('number');
        expect(typeof result.hintCount).toBe('number');

        // Total should match diagnostics count
        const totalCount =
          result.errorCount +
          result.warningCount +
          result.infoCount +
          result.hintCount;
        expect(totalCount).toBe(result.diagnostics.length);
      }
    }, 30000);
  });

  describe('Project-wide diagnostics', () => {
    it('should return diagnostics for entire project', async () => {
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: FIXTURE_PATH,
          // No filePath - project-wide
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should find errors from errors.ts
        expect(result.diagnostics.length).toBeGreaterThan(0);

        // Should have diagnostics from errors.ts
        const errorsDiags = result.diagnostics.filter(
          (d) => d.filePath === 'src/errors.ts'
        );
        expect(errorsDiags.length).toBeGreaterThan(0);
      }
    }, 60000);
  });

  describe('Error cases', () => {
    it('should return WORKSPACE_NOT_FOUND for invalid workspace', async () => {
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: '/nonexistent/workspace',
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKSPACE_NOT_FOUND');
      }
    }, 30000);

    it('should return FILE_NOT_FOUND for non-existent file', async () => {
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/nonexistent.ts',
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_NOT_FOUND');
      }
    }, 30000);
  });

  describe('Diagnostic details', () => {
    it('should include line and column positions', async () => {
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/errors.ts',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success && result.diagnostics.length > 0) {
        result.diagnostics.forEach((diag) => {
          expect(diag.line).toBeGreaterThan(0);
          expect(diag.column).toBeGreaterThan(0);
          expect(diag.endLine).toBeGreaterThanOrEqual(diag.line);
          expect(diag.endColumn).toBeGreaterThan(0);
        });
      }
    }, 30000);

    it('should include TypeScript error codes', async () => {
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/errors.ts',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success && result.diagnostics.length > 0) {
        result.diagnostics.forEach((diag) => {
          expect(diag.code).toMatch(/^TS\d+$/);
        });
      }
    }, 30000);
  });

  describe('Path handling', () => {
    it('should return relative paths', async () => {
      const result = await handleGetDiagnostics(
        {
          workspaceRoot: FIXTURE_PATH,
          filePath: 'src/errors.ts',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        result.diagnostics.forEach((diag) => {
          // Path should be relative, not absolute
          expect(diag.filePath).not.toMatch(/^\//);
        });
      }
    }, 30000);
  });
});
