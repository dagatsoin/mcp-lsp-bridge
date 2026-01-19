# Foundation-MCP - MCP Server Skeleton

**Labels:** User Story, Epic-Project-Foundation

**Status:** VALIDATED - Ready to move to todo

## Spec References
- FS-001.7: Error Response Format
- BS-001.1: File Path Convention

## Context

**Epic:** EPIC-001 Project Foundation & TSServer Connection

With the project structure in place (US-001), we need a basic MCP server that Claude Code can connect to. This server won't have working tools yet, but it will properly register the four tools and respond to requests.

## Description

As a Claude Code user, I can connect to the MCP-LSP Bridge server and see the four available tools listed.

## Impact
- Backend (MCP server implementation)
- MCP SDK dependency (@modelcontextprotocol/sdk)
- stdio transport for communication

## Business Rules
- BS-001.1: All file paths follow the relative/absolute convention
- Error responses follow FS-001.7 format

## Technical Details

**Dependencies:**
- `@modelcontextprotocol/sdk` - MCP server SDK
- `zod` - Peer dependency required by MCP SDK (schema validation)

**Required Imports:**
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

**Logging Policy:**
- All logging MUST go to stderr only
- stdout is reserved exclusively for MCP protocol communication
- Use `console.error()` or a stderr-based logger

**Stub Response Format (FS-001.7):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "This tool is not yet implemented"
  }
}
```

## Regressions
- N/A (new implementation)

## Acceptance Criteria
- MCP server starts and listens on stdio transport
- Server responds to `tools/list` with four tools defined
- Each tool has proper name, description, and input schema
- Tools return stub responses with code "NOT_IMPLEMENTED" per FS-001.7
- Server handles malformed requests gracefully
- Graceful shutdown on SIGINT/SIGTERM
- All logging goes to stderr (stdout reserved for MCP protocol)

## Test Infrastructure
- Manual testing: Run server and use MCP inspector or Claude Code to verify tool list
- Unit tests can mock the MCP SDK

## Checklist
- [ ] TS-004: Install and configure MCP SDK and zod
- [ ] TS-005: Implement MCP server with stdio transport
- [ ] TS-006: Define tool schemas for all four tools
- [ ] TS-007: Add stub handlers that return NOT_IMPLEMENTED responses
