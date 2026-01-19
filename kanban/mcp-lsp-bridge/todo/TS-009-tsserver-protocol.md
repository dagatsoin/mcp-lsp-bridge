# add(tsserver): FS-001.5 Implement stdin/stdout JSON protocol

**Labels:** Technical Story, US-TSServer-Process

## Context

**User Story:** US-003 TSServer Process Management

tsserver uses a specific JSON protocol over stdin/stdout. Each request/response is a JSON object followed by a newline. We need to handle message framing and parsing.

## Impact
- add(tsserver): FS-001.5 Implement message serialization (JSON + newline)
- add(tsserver): FS-001.5 Implement message parsing from stdout stream
- add(tsserver): FS-001.5 Handle partial messages and buffering

## Acceptance Tests
- FS-001.5: Messages are sent as JSON followed by newline
- FS-001.5: Incoming messages are parsed correctly
- FS-001.5: Partial message buffers are handled (data split across chunks)
- FS-001.5: Invalid JSON from tsserver is logged and handled gracefully
- FS-001.5: Multiple messages in single chunk are parsed separately
