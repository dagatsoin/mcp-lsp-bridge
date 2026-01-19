# add(tsserver): FS-001.7 Add error handling and process recovery

**Labels:** Technical Story, US-TSServer-Process

## Context

**User Story:** US-003 TSServer Process Management

tsserver might crash or become unresponsive. We need robust error handling and the ability to restart the process when needed.

## Impact
- add(tsserver): FS-001.7 Handle tsserver process exit
- add(tsserver): FS-001.7 Implement process restart capability
- add(tsserver): FS-001.7 Add dispose() method for cleanup

## Acceptance Tests
- FS-001.7: Process exit is detected and logged
- FS-001.7: Pending requests are rejected when process exits
- FS-001.7: dispose() kills the process and cleans up resources
- FS-001.7: No zombie processes after disposal
- FS-001.7: Automatic restart option available (opt-in)
- FS-001.7: Errors are formatted per FS-001.7 (LANGUAGE_SERVER_ERROR)
