# Navigation-Definition - Go To Definition Tool

**Labels:** User Story, Epic-Code-Navigation

## Spec References
- FS-001.2: go_to_definition Tool
- BS-001.1: File Path Convention
- BS-001.2: Position Indexing
- EC-001.3: Symbol in Comment or String

## Context

**Epic:** EPIC-002 Code Navigation Tools

With tsserver communication working (US-003), we implement the first actual tool. go_to_definition is the simplest tool because it typically returns a single result and uses a straightforward tsserver command.

## Description

As a Claude Code user, I can navigate to the definition of any symbol by providing its file location, and I receive the precise location where that symbol is defined.

## Impact
- Backend (go_to_definition tool handler)
- MCP tool response formatting
- tsserver `definition` command integration

## Business Rules
- BS-001.1: Output paths are relative to workspaceRoot (except external)
- BS-001.2: Line/column use 1-based indexing
- External definitions (node_modules, .d.ts) marked with isExternal flag

## Regressions
- N/A (new implementation)

## Acceptance Criteria
- AC-1.2.1: Returns definition location for symbol at specified position
- AC-1.2.2: Returns multiple definitions for overloads/declaration merging
- AC-1.2.3: Includes type definitions from .d.ts files with isExternal=true
- AC-1.2.4: Returns empty definitions array when no definition exists
- AC-1.2.5: Supports navigation to node_modules definitions (isExternal=true)
- Returns NO_SYMBOL_AT_POSITION error for comments/strings (EC-001.3)
- Returns FILE_NOT_FOUND error for non-existent files
- Returns INVALID_POSITION error for out-of-bounds positions
- Response includes codeSnippet showing the definition line

## Test Infrastructure
- Extend test fixture with:
  - Function definition and call sites
  - Class with methods
  - Import from node_modules (e.g., a simple dependency)
  - Type definition reference
- Dev endpoint: None needed (tool works via MCP protocol)

## Checklist
- [ ] TS-013: Implement definition request to tsserver
- [ ] TS-014: Transform tsserver response to MCP format
- [ ] TS-015: Handle external definition detection
- [ ] TS-016: Add code snippet extraction
- [ ] TS-017: Implement error handling for edge cases
