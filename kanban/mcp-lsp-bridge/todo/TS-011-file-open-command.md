# add(tsserver): FS-001.5 Implement file open command

**Labels:** Technical Story, US-TSServer-Process

## Context

**User Story:** US-003 TSServer Process Management

Before querying information about a file, tsserver needs to know about it via the "open" command. This tells tsserver to load the file into its project.

## Impact
- add(tsserver): FS-001.5 Implement openFile() method
- add(tsserver): FS-001.5 Send "open" command with file path
- add(tsserver): FS-001.5 Track which files are open

## Acceptance Tests
- FS-001.5: openFile(path) sends "open" command to tsserver
- FS-001.5: File path is absolute in the command
- FS-001.5: tsserver acknowledges the file (no error response)
- FS-001.5: Repeated opens of same file are idempotent
- FS-001.5: Opening non-existent file produces clear error
