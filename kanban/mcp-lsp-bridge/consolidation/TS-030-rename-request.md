# add(tools): FS-001.3 Implement rename request to tsserver

**Labels:** Technical Story, US-Rename-Symbol

## Context

**User Story:** US-007 Rename Symbol Tool

The tsserver "rename" command calculates all text edits needed to rename a symbol. We send the position and new name.

## Impact
- add(tools): FS-001.3 Create renameSymbol tool handler
- add(tools): FS-001.3 Send "rename" command to tsserver
- add(tools): FS-001.3 Parse rename locations from response

## Acceptance Tests
- FS-001.3: Rename command sent with file, line, offset
- FS-001.3: Response contains locations to modify
- FS-001.3: Handle "cannot rename" response (built-ins, etc.)
- FS-001.3: Handle symbol not found at position
