# add(tools): FS-001.7 Add stub handlers that return placeholder responses

**Labels:** Technical Story, US-MCP-Server-Skeleton

## Context

**User Story:** US-002 MCP Server Skeleton

Before implementing real functionality, we need stub handlers that return valid responses. This allows testing the MCP server integration while tools are under development.

## Impact
- add(tools): FS-001.7 Create stub handler for go_to_definition
- add(tools): FS-001.7 Create stub handler for find_references
- add(tools): FS-001.7 Create stub handler for get_diagnostics
- add(tools): FS-001.7 Create stub handler for rename_symbol

## Acceptance Tests
- FS-001.7: Each tool returns { success: false, error: { code: "NOT_IMPLEMENTED", message: "...", resolution: "..." } }
- FS-001.7: Error format matches FS-001.7 specification
- FS-001.7: Input validation runs before stub response (invalid inputs get validation errors)
- FS-001.7: `tools/list` shows all four tools with correct schemas
