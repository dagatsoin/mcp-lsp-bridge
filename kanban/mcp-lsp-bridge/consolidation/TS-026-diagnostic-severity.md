# add(tools): AC-1.4.1 Map tsserver diagnostic categories to severity levels

**Labels:** Technical Story, US-Get-Diagnostics

## Context

**User Story:** US-006 Get Diagnostics Tool

tsserver uses numeric diagnostic categories. We map these to human-readable severity levels: error, warning, info, hint.

## Impact
- add(tools): AC-1.4.1 Map category 1 to "error"
- add(tools): AC-1.4.1 Map category 2 to "warning"
- add(tools): AC-1.4.1 Map category 3 to "info"
- add(tools): AC-1.4.1 Map category 4 to "hint"

## Acceptance Tests
- AC-1.4.1: Error diagnostics have severity "error"
- AC-1.4.1: Warning diagnostics have severity "warning"
- AC-1.4.1: Suggestion diagnostics have severity "info" or "hint"
- AC-1.4.1: Unknown categories default to "info"
