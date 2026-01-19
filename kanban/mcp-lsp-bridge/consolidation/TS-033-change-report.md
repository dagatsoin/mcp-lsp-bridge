# add(tools): AC-1.3.4 Generate before/after change report

**Labels:** Technical Story, US-Rename-Symbol

## Context

**User Story:** US-007 Rename Symbol Tool

Users need to see exactly what changed. The response includes the old and new text for each modified line.

## Impact
- add(tools): AC-1.3.4 Capture line content before modification
- add(tools): AC-1.3.4 Capture line content after modification
- add(tools): AC-1.3.4 Structure report by file with change details

## Acceptance Tests
- AC-1.3.4: filesModified array contains all changed files
- AC-1.3.4: Each file entry has changeCount
- AC-1.3.4: Each change has line, oldText, newText
- AC-1.3.4: oldText shows line before rename
- AC-1.3.4: newText shows line after rename
