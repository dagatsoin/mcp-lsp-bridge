# add(tools): FS-001.1 Implement references request to tsserver

**Labels:** Technical Story, US-Find-References

## Context

**User Story:** US-005 Find References Tool

The tsserver "references" command returns all locations where a symbol is referenced. We send this command with the symbol's position.

## Impact
- add(tools): FS-001.1 Create findReferences tool handler
- add(tools): FS-001.1 Send "references" command to tsserver
- add(tools): FS-001.1 Convert positions correctly

## Acceptance Tests
- FS-001.1: References command is sent with correct file, line, offset
- FS-001.1: Response contains list of reference locations
- FS-001.1: All reference types are returned (definition, usage)
- FS-001.1: Empty response handled (no references found)
