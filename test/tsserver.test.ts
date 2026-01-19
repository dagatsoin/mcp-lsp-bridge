import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TSServerWrapper } from '../src/tsserver.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'sample-project');

describe('TSServerWrapper', () => {
  describe('Initialization', () => {
    it('should create a wrapper instance', () => {
      const wrapper = new TSServerWrapper(FIXTURE_PATH);
      expect(wrapper).toBeDefined();
      expect(wrapper.isRunning()).toBe(false);
    });
  });

  describe('Process Management', () => {
    let wrapper: TSServerWrapper;

    beforeEach(() => {
      wrapper = new TSServerWrapper(FIXTURE_PATH);
    });

    afterAll(async () => {
      if (wrapper && wrapper.isRunning()) {
        wrapper.dispose();
      }
    });

    it('should start tsserver process', async () => {
      await wrapper.start();
      expect(wrapper.isRunning()).toBe(true);
      wrapper.dispose();
    }, 30000);

    it('should dispose and stop tsserver process', async () => {
      await wrapper.start();
      expect(wrapper.isRunning()).toBe(true);
      wrapper.dispose();
      expect(wrapper.isRunning()).toBe(false);
    }, 30000);
  });

  describe('File Operations', () => {
    let wrapper: TSServerWrapper;

    beforeAll(async () => {
      wrapper = new TSServerWrapper(FIXTURE_PATH);
      await wrapper.start();
    }, 30000);

    afterAll(() => {
      if (wrapper) {
        wrapper.dispose();
      }
    });

    it('should open a file', async () => {
      const response = await wrapper.openFile('src/utils.ts');
      expect(response.type).toBe('response');
      expect(response.command).toBe('open');
      expect(response.success).toBe(true);
    }, 30000);

    it('should get project info', async () => {
      // First open a file so tsserver knows about the project
      await wrapper.openFile('src/index.ts');

      const response = await wrapper.getProjectInfo('src/index.ts');
      expect(response.type).toBe('response');
      expect(response.command).toBe('projectInfo');
      expect(response.success).toBe(true);
      expect(response.body).toBeDefined();
    }, 30000);

    it('should close a file', async () => {
      await wrapper.openFile('src/utils.ts');
      const response = await wrapper.closeFile('src/utils.ts');
      expect(response.type).toBe('response');
      expect(response.command).toBe('close');
      expect(response.success).toBe(true);
    }, 30000);
  });

  describe('Request/Response Correlation', () => {
    let wrapper: TSServerWrapper;

    beforeAll(async () => {
      wrapper = new TSServerWrapper(FIXTURE_PATH);
      await wrapper.start();
    }, 30000);

    afterAll(() => {
      if (wrapper) {
        wrapper.dispose();
      }
    });

    it('should handle multiple concurrent requests', async () => {
      // Open multiple files concurrently
      const [response1, response2, response3] = await Promise.all([
        wrapper.openFile('src/utils.ts'),
        wrapper.openFile('src/index.ts'),
        wrapper.openFile('src/errors.ts'),
      ]);

      expect(response1.success).toBe(true);
      expect(response2.success).toBe(true);
      expect(response3.success).toBe(true);

      // Each response should have a different request_seq
      expect(response1.request_seq).not.toBe(response2.request_seq);
      expect(response2.request_seq).not.toBe(response3.request_seq);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should throw error when sending request without starting', async () => {
      const wrapper = new TSServerWrapper(FIXTURE_PATH);

      await expect(wrapper.openFile('src/utils.ts')).rejects.toThrow(
        'TSServer is not running'
      );
    });

    it('should throw error when starting twice', async () => {
      const wrapper = new TSServerWrapper(FIXTURE_PATH);
      await wrapper.start();

      await expect(wrapper.start()).rejects.toThrow('TSServer already started');

      wrapper.dispose();
    }, 30000);
  });
});
