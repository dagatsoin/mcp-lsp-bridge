# add(tools): FS-001.2 Implement definition request to tsserver

**Labels:** Technical Story, US-Go-To-Definition

## Context

**User Story:** US-004 Go To Definition Tool

The tsserver "definition" command returns the location(s) where a symbol is defined. We need to send this command with proper parameters.

## Impact
- add(tools): FS-001.2 Create goToDefinition tool handler
- add(tools): FS-001.2 Send "definition" command to tsserver
- add(tools): FS-001.2 Convert 1-based input to tsserver format

## Acceptance Tests
- FS-001.2: Definition command is sent with correct file, line, offset
- FS-001.2: Position conversion handles 1-based indexing correctly
- FS-001.2: Response contains definition location(s)
- FS-001.2: Empty response is handled (no definition found)
