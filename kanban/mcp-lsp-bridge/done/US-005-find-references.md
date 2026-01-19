# Navigation-References - Find References Tool

**Labels:** User Story, Epic-Code-Navigation

## Spec References
- FS-001.1: find_references Tool
- BS-001.1: File Path Convention
- BS-001.2: Position Indexing
- BS-001.3: Result Ordering for References
- BS-001.5: Result Limits

## Context

**Epic:** EPIC-002 Code Navigation Tools

With go_to_definition working (US-004), we implement find_references. This is more complex because it can return many results and needs to handle filtering, ordering, and truncation.

## Description

As a Claude Code user, I can find all references to a symbol across my project, seeing where it's declared and every place it's used.

## Impact
- Backend (find_references tool handler)
- MCP tool response formatting
- tsserver `references` command integration
- Result filtering and ordering logic

## Business Rules
- BS-001.1: Output paths are relative to workspaceRoot
- BS-001.2: Line/column use 1-based indexing
- BS-001.3: Definition/declaration first, then usages sorted by file path
- BS-001.5: Maximum 500 results, truncated flag if more exist

## Regressions
- N/A (new implementation)

## Acceptance Criteria
- AC-1.1.1: Returns all references within project source files
- AC-1.1.2: Excludes node_modules references by default
- AC-1.1.3: Includes node_modules when includeNodeModules=true
- AC-1.1.4: Orders with definition first, then usages by file path
- AC-1.1.5: Returns max 500 results; truncated=true if more exist
- AC-1.1.6: Distinguishes declaration vs usage reference types
- AC-1.1.7: Returns partial results with failures list when some files fail
- Response includes codeSnippet for each reference
- Returns NO_SYMBOL_AT_POSITION for comments/strings
- Returns totalCount in response

## Test Infrastructure
- Extend test fixture with:
  - A function called from multiple files
  - A class used in several places
  - An exported symbol used by other modules
- Consider a larger fixture to test truncation (500+ references)

## Checklist
- [ ] TS-018: Implement references request to tsserver
- [ ] TS-019: Filter node_modules references
- [ ] TS-020: Sort results per BS-001.3
- [ ] TS-021: Implement result truncation at 500
- [ ] TS-022: Detect declaration vs usage reference type
- [ ] TS-023: Add code snippet extraction for each reference
