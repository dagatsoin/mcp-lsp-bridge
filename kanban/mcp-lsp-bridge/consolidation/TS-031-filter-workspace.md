# add(tools): BS-001.4 Filter changes to workspaceRoot only

**Labels:** Technical Story, US-Rename-Symbol

## Context

**User Story:** US-007 Rename Symbol Tool

Critical safety feature: we must never modify files outside the workspaceRoot, even if tsserver reports changes there.

## Impact
- add(tools): BS-001.4 Check each file path against workspaceRoot
- add(tools): BS-001.4 Exclude changes to files outside workspace
- add(tools): BS-001.4 Log excluded changes for transparency

## Acceptance Tests
- BS-001.4: Changes in workspaceRoot are included
- BS-001.4: Changes outside workspaceRoot are excluded
- BS-001.4: node_modules changes are excluded
- BS-001.4: Excluded changes are logged/noted in response
- AC-1.3.3: Files outside workspace never modified
