# add(tools): FS-001 Define tool schemas for all four tools

**Labels:** Technical Story, US-MCP-Server-Skeleton

## Context

**User Story:** US-002 MCP Server Skeleton

Each MCP tool needs a JSON schema defining its inputs. These schemas enable Claude Code to understand what parameters each tool accepts and provide validation.

## Impact
- add(tools): FS-001.1 Define find_references input schema
- add(tools): FS-001.2 Define go_to_definition input schema
- add(tools): FS-001.3 Define rename_symbol input schema
- add(tools): FS-001.4 Define get_diagnostics input schema

## Acceptance Tests
- FS-001.2: go_to_definition schema has workspaceRoot, filePath, line, column (all required)
- FS-001.1: find_references schema has workspaceRoot, filePath, line, column (required), includeNodeModules (optional)
- FS-001.4: get_diagnostics schema has workspaceRoot (required), filePath (optional)
- FS-001.3: rename_symbol schema has workspaceRoot, filePath, line, column, newName (all required)
- All schemas use zod for validation
- Tool descriptions clearly explain purpose
