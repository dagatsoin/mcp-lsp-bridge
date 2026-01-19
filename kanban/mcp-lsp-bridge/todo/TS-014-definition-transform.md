# add(tools): FS-001.2 Transform tsserver response to MCP format

**Labels:** Technical Story, US-Go-To-Definition

## Context

**User Story:** US-004 Go To Definition Tool

tsserver returns definitions in its own format. We need to transform this to match the MCP tool output specification.

## Impact
- add(tools): FS-001.2 Map tsserver response to output schema
- add(tools): FS-001.2 Convert absolute paths to relative (for project files)
- add(tools): BS-001.2 Convert positions to 1-based indexing

## Acceptance Tests
- FS-001.2: Output matches { success, definitions: [...] } format
- BS-001.1: Project file paths are relative to workspaceRoot
- BS-001.2: Line and column are 1-based in output
- FS-001.2: Multiple definitions are included (overloads)
