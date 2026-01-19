# add(server): FS-001.7 Implement MCP server with stdio transport

**Labels:** Technical Story, US-MCP-Server-Skeleton

## Context

**User Story:** US-002 MCP Server Skeleton

The MCP server uses stdio transport to communicate with Claude Code. This technical story implements the server initialization and transport setup.

## Impact
- add(server): FS-001.7 Create McpServer instance
- add(server): FS-001.7 Configure stdio transport (stdin/stdout)
- add(server): FS-001.7 Set up server metadata (name, version)
- add(server): FS-001.7 Implement graceful shutdown handlers

## Acceptance Tests
- FS-001.7: Server starts without errors when run via `npm start`
- FS-001.7: Server responds to MCP protocol handshake
- FS-001.7: Server shuts down cleanly on SIGINT
- FS-001.7: Server shuts down cleanly on SIGTERM
- FS-001.7: Malformed JSON input produces error response, not crash
