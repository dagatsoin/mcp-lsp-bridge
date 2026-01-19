# Analysis-Diagnostics - Get Diagnostics Tool

**Labels:** User Story, Epic-Code-Analysis

## Spec References
- FS-001.4: get_diagnostics Tool
- FS-001.8: Partial Failure Handling
- BS-001.1: File Path Convention
- BS-001.2: Position Indexing

## Context

**Epic:** EPIC-003 Code Analysis Tools

With navigation tools complete (EPIC-002), we add code analysis. get_diagnostics retrieves TypeScript compilation errors and warnings.

## Description

As a Claude Code user, I can check a file or entire project for TypeScript errors, warnings, and hints without running the compiler manually.

## Impact
- Backend (get_diagnostics tool handler)
- MCP tool response formatting
- tsserver `semanticDiagnosticsSync` and `syntacticDiagnosticsSync` commands
- Optional project-wide diagnostics via file enumeration

## Business Rules
- BS-001.1: Output paths are relative to workspaceRoot
- BS-001.2: Line/column use 1-based indexing
- Diagnostics include both syntactic and semantic issues

## Regressions
- N/A (new implementation)

## Acceptance Criteria
- AC-1.4.1: Returns all diagnostic types (error, warning, info, hint)
- AC-1.4.2: Single-file mode when filePath is provided
- AC-1.4.3: Project-wide mode when filePath is omitted
- AC-1.4.4: Includes diagnostic code (e.g., "TS2304")
- AC-1.4.5: Provides summary counts by severity level
- Response includes codeSnippet for each diagnostic
- Returns errorCount, warningCount, infoCount, hintCount
- Handles partial failures for project-wide mode (AC-1.8.2)
- Returns FILE_NOT_FOUND for non-existent single file

## Test Infrastructure
- Extend test fixture with:
  - File with intentional type errors
  - File with warnings (e.g., unused variables with strict settings)
  - Clean file with no diagnostics
- Project-wide test needs multiple files with varying diagnostic states

## Checklist
- [ ] TS-024: Implement single-file diagnostics request
- [ ] TS-025: Implement project-wide diagnostics enumeration
- [ ] TS-026: Map tsserver diagnostic categories to severity levels
- [ ] TS-027: Extract diagnostic codes and messages
- [ ] TS-028: Calculate summary counts
- [ ] TS-029: Add code snippet extraction for diagnostics
