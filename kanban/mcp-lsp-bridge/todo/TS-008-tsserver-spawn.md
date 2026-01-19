# add(tsserver): FS-001.5 Implement tsserver process spawning

**Labels:** Technical Story, US-TSServer-Process

## Context

**User Story:** US-003 TSServer Process Management

tsserver is the TypeScript language server. We need to spawn it as a child process and establish communication channels via stdin/stdout.

## Impact
- add(tsserver): FS-001.5 Create TSServerClient class
- add(tsserver): FS-001.5 Spawn tsserver using child_process
- add(tsserver): FS-001.5 Configure stdio pipes for communication

## Acceptance Tests
- FS-001.5: TSServerClient can be instantiated
- FS-001.5: Calling start() spawns a tsserver process
- FS-001.5: Process uses project's TypeScript or falls back to npx tsserver
- FS-001.5: stdin/stdout are connected for communication
- FS-001.5: Process PID is tracked for cleanup
