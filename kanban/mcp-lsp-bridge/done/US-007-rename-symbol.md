# Refactoring-Rename - Rename Symbol Tool

**Labels:** User Story, Epic-Code-Refactoring

## Spec References
- FS-001.3: rename_symbol Tool
- BS-001.1: File Path Convention
- BS-001.2: Position Indexing
- BS-001.4: External Modification Boundary

## Context

**Epic:** EPIC-004 Code Refactoring Tools

With all read-only tools complete (EPIC-002, EPIC-003), we implement the most complex tool: rename_symbol. This tool modifies files directly, so it requires careful implementation.

## Description

As a Claude Code user, I can rename any symbol and have all its references updated automatically across my entire project, with a detailed report of all changes made.

## Impact
- Backend (rename_symbol tool handler)
- MCP tool response formatting
- tsserver `rename` command integration
- File system write operations
- Transaction-like behavior for multi-file changes

## Business Rules
- BS-001.1: Output paths are relative to workspaceRoot
- BS-001.2: Line/column use 1-based indexing
- BS-001.4: MUST NOT modify files outside workspaceRoot

## Regressions
- If rename_symbol fails mid-operation, consider partial state (future: add rollback)
- Verify file encoding is preserved (UTF-8)

## Acceptance Criteria
- AC-1.3.1: Modifies files directly on disk (not preview)
- AC-1.3.2: Updates all references within the project
- AC-1.3.3: Does NOT modify files outside workspaceRoot
- AC-1.3.4: Returns detailed list of files and lines modified
- AC-1.3.5: Reports totalChanges count
- AC-1.3.6: Fails with error if newName conflicts with existing symbol
- Response includes oldText and newText for each changed line
- Returns NO_SYMBOL_AT_POSITION for comments/strings
- Returns RENAME_CONFLICT for naming conflicts
- Handles special cases: renaming exports, imports, re-exports

## Test Infrastructure
- Extend test fixture with:
  - Function used in multiple files
  - Class with usages across modules
  - Exported/imported symbols
  - Symbol with same name in different scopes (should NOT be renamed)
- **IMPORTANT**: Tests should use a copy of the fixture to avoid polluting test data
- Manual browser testing not applicable (file-based operation)

## Checklist
- [ ] TS-030: Implement rename request to tsserver
- [ ] TS-031: Filter changes to workspaceRoot only
- [ ] TS-032: Apply text edits to files
- [ ] TS-033: Generate before/after change report
- [ ] TS-034: Detect and report naming conflicts
- [ ] TS-035: Handle multi-file atomic updates
