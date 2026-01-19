# add(tools): AC-1.4.4 Extract diagnostic codes and messages

**Labels:** Technical Story, US-Get-Diagnostics

## Context

**User Story:** US-006 Get Diagnostics Tool

Each diagnostic has a code (like TS2304) and message. These enable programmatic handling and help users understand issues.

## Impact
- add(tools): AC-1.4.4 Extract diagnostic code from tsserver response
- add(tools): AC-1.4.4 Format code as "TS{number}"
- add(tools): AC-1.4.4 Include full message text

## Acceptance Tests
- AC-1.4.4: code field contains diagnostic code (e.g., "TS2304")
- AC-1.4.4: message field contains full diagnostic text
- AC-1.4.4: Position includes line, column, endLine, endColumn
- AC-1.4.4: All fields present for each diagnostic
