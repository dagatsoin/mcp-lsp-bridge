#!/usr/bin/env node

/**
 * MCP-LSP Bridge
 *
 * An MCP server that bridges Claude Code to TypeScript's Language Server (tsserver),
 * enabling semantic code navigation, reference finding, and refactoring.
 *
 * @implements FS-001
 */

import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('[mcp-lsp-bridge] Fatal error:', error);
  process.exit(1);
});
