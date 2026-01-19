import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { handleRenameSymbol } from '../src/handlers/rename-symbol.js';
import { TSServerWrapper } from '../src/tsserver.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'sample-project');
const RENAME_FIXTURE_PATH = path.join(__dirname, 'fixtures', 'rename-test-project');

describe('rename_symbol handler', () => {
  let tsserver: TSServerWrapper;

  // Store original file contents for restoration
  const originalFiles: Map<string, string> = new Map();

  beforeAll(async () => {
    // Create a copy of the fixture for rename tests
    if (!fs.existsSync(RENAME_FIXTURE_PATH)) {
      fs.mkdirSync(RENAME_FIXTURE_PATH, { recursive: true });
      fs.mkdirSync(path.join(RENAME_FIXTURE_PATH, 'src'), { recursive: true });
    }

    // Copy files
    const srcDir = path.join(FIXTURE_PATH, 'src');
    const destDir = path.join(RENAME_FIXTURE_PATH, 'src');

    // Copy tsconfig.json
    fs.copyFileSync(
      path.join(FIXTURE_PATH, 'tsconfig.json'),
      path.join(RENAME_FIXTURE_PATH, 'tsconfig.json')
    );

    // Copy source files
    for (const file of fs.readdirSync(srcDir)) {
      if (file.endsWith('.ts')) {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        const content = fs.readFileSync(srcPath, 'utf-8');
        fs.writeFileSync(destPath, content);
        originalFiles.set(destPath, content);
      }
    }

    tsserver = new TSServerWrapper(RENAME_FIXTURE_PATH);
    await tsserver.start();
  }, 30000);

  afterAll(() => {
    if (tsserver) {
      tsserver.dispose();
    }

    // Clean up the rename fixture directory
    if (fs.existsSync(RENAME_FIXTURE_PATH)) {
      fs.rmSync(RENAME_FIXTURE_PATH, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Restore original file contents before each test
    for (const [filePath, content] of originalFiles) {
      fs.writeFileSync(filePath, content);
    }
  });

  describe('Success cases', () => {
    it('should rename a local variable', async () => {
      // In index.ts, rename 'greeting' variable
      const result = await handleRenameSymbol(
        {
          workspaceRoot: RENAME_FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 8,
          column: 7, // Position on 'greeting' in const greeting = greet('World');
          newName: 'welcomeMessage',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesModified.length).toBeGreaterThan(0);
        expect(result.totalChanges).toBeGreaterThan(0);

        // Verify file was actually modified
        const indexContent = fs.readFileSync(
          path.join(RENAME_FIXTURE_PATH, 'src/index.ts'),
          'utf-8'
        );
        expect(indexContent).toContain('welcomeMessage');
        expect(indexContent).not.toContain('greeting =');
      }
    }, 30000);

    it('should return detailed change information', async () => {
      const result = await handleRenameSymbol(
        {
          workspaceRoot: RENAME_FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 8,
          column: 7,
          newName: 'myGreeting',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Check file modification structure
        const fileMod = result.filesModified[0];
        expect(fileMod.filePath).toBeDefined();
        expect(fileMod.changeCount).toBeGreaterThan(0);
        expect(fileMod.changes).toBeDefined();

        // Check change structure
        const change = fileMod.changes[0];
        expect(change.line).toBeGreaterThan(0);
        expect(change.oldText).toBeDefined();
        expect(change.newText).toBeDefined();
        expect(change.newText).toContain('myGreeting');
      }
    }, 30000);
  });

  describe('Error cases', () => {
    it('should return WORKSPACE_NOT_FOUND for invalid workspace', async () => {
      const result = await handleRenameSymbol(
        {
          workspaceRoot: '/nonexistent/workspace',
          filePath: 'src/index.ts',
          line: 1,
          column: 1,
          newName: 'newName',
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKSPACE_NOT_FOUND');
      }
    }, 30000);

    it('should return FILE_NOT_FOUND for non-existent file', async () => {
      const result = await handleRenameSymbol(
        {
          workspaceRoot: RENAME_FIXTURE_PATH,
          filePath: 'src/nonexistent.ts',
          line: 1,
          column: 1,
          newName: 'newName',
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_NOT_FOUND');
      }
    }, 30000);

    it('should return INVALID_POSITION for out-of-bounds line', async () => {
      const result = await handleRenameSymbol(
        {
          workspaceRoot: RENAME_FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 9999,
          column: 1,
          newName: 'newName',
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_POSITION');
      }
    }, 30000);

    it('should return RENAME_CONFLICT for invalid identifier', async () => {
      const result = await handleRenameSymbol(
        {
          workspaceRoot: RENAME_FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 8,
          column: 7,
          newName: '123invalid', // Invalid: starts with number
        },
        tsserver
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RENAME_CONFLICT');
      }
    }, 30000);
  });

  describe('Path handling', () => {
    it('should return relative paths in modifications', async () => {
      const result = await handleRenameSymbol(
        {
          workspaceRoot: RENAME_FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 8,
          column: 7,
          newName: 'renamedVar',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        result.filesModified.forEach((mod) => {
          // Path should be relative, not absolute
          expect(mod.filePath).not.toMatch(/^\//);
        });
      }
    }, 30000);
  });

  describe('Safety checks', () => {
    it('should not modify files outside workspace', async () => {
      // Rename a local symbol - should only affect files in workspace
      const result = await handleRenameSymbol(
        {
          workspaceRoot: RENAME_FIXTURE_PATH,
          filePath: 'src/index.ts',
          line: 8,
          column: 7,
          newName: 'safeRename',
        },
        tsserver
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // All modified files should be within workspace
        result.filesModified.forEach((mod) => {
          const absolutePath = path.join(RENAME_FIXTURE_PATH, mod.filePath);
          expect(absolutePath.startsWith(RENAME_FIXTURE_PATH)).toBe(true);
        });
      }
    }, 30000);
  });
});
