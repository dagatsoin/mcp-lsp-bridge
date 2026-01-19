# add(tools): AC-1.3.6 Detect and report naming conflicts

**Labels:** Technical Story, US-Rename-Symbol

## Context

**User Story:** US-007 Rename Symbol Tool

Before applying changes, we should detect if the new name would conflict with an existing symbol in the same scope.

## Impact
- add(tools): AC-1.3.6 Check tsserver rename response for conflicts
- add(tools): AC-1.3.6 Return RENAME_CONFLICT error if detected
- add(tools): AC-1.3.6 Include conflicting symbol info in error

## Acceptance Tests
- AC-1.3.6: Conflict with local variable detected
- AC-1.3.6: Conflict with imported symbol detected
- AC-1.3.6: RENAME_CONFLICT error returned with details
- AC-1.3.6: No files modified when conflict detected
- AC-1.3.6: Resolution suggests choosing different name
