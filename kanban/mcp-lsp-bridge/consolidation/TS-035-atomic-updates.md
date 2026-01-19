# add(tools): AC-1.3.2 Handle multi-file atomic updates

**Labels:** Technical Story, US-Rename-Symbol

## Context

**User Story:** US-007 Rename Symbol Tool

Renames often span multiple files. While true atomicity is complex, we should minimize partial failure risk and report clearly.

## Impact
- add(tools): AC-1.3.2 Validate all files are writable before starting
- add(tools): AC-1.3.2 Apply changes in deterministic order
- add(tools): AC-1.3.2 Report any failures with context

## Acceptance Tests
- AC-1.3.2: All affected files are modified
- AC-1.3.2: Read-only files detected before changes start
- AC-1.3.2: Failure in one file reported clearly
- AC-1.3.5: totalChanges reflects actual changes made
- AC-1.3.2: Files are processed in consistent order
