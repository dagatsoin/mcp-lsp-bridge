# Foundation-TSServer - TSServer Process Management

**Labels:** User Story, Epic-Project-Foundation

**Status:** VALIDATED - Ready to move to todo

## Spec References
- FS-001.5: Project Configuration
- FS-001.7: Error Response Format
- EC-001.1: No Config File
- EC-001.4: Very Large Projects

## Context

**Epic:** EPIC-001 Project Foundation & TSServer Connection

With the MCP server running (US-002), we need to connect it to tsserver. This user story delivers the tsserver process wrapper that handles spawning, communication, and lifecycle management.

## Description

As a developer, I can use the TSServer wrapper to send commands and receive responses from the TypeScript language server.

## Impact
- Backend (tsserver wrapper module)
- Child process management (Node.js child_process)
- Newline-delimited JSON protocol over stdin/stdout

## Business Rules
- BS-001.2: Position indexing uses 1-based line/column (tsserver uses 1-based internally)
- tsserver commands use sequence numbers for request/response correlation

## Technical Details

### Protocol Format (UPDATED)
TSServer uses **newline-delimited JSON** (NOT Content-Length framing like LSP).

**Message Format:**
```
{"seq":1,"type":"request","command":"open","arguments":{...}}\n
```

Each message is:
1. A complete JSON object
2. Followed by a newline character (`\n`)

Note: This is different from the LSP protocol which uses Content-Length headers.

### Event Handling
TSServer emits asynchronous events (messages with `"type": "event"`) that must be handled separately from request/response correlation. Events include:
- Diagnostics updates
- Project loading progress
- Semantic diagnostics refresh

### TypeScript Resolution
1. First check: `<workspaceRoot>/node_modules/typescript/lib/tsserver.js`
2. Fallback: Bundled TypeScript (via `npx tsserver`)

### Timeouts and Reconnection
- **Default timeout:** 30 seconds per request
- **Reconnection policy:** 3 retries with exponential backoff (1s, 2s, 4s)
- After 3 failed retries, report error to caller

## Regressions
- N/A (new implementation)

## Acceptance Criteria
- TSServer process spawns successfully using workspace TypeScript or fallback
- Wrapper sends commands via stdin using Content-Length framed protocol
- Wrapper receives and parses responses from stdout (Content-Length framed)
- Request/response correlation works via sequence numbers
- Async events (type: "event") are handled and dispatched appropriately
- Wrapper handles tsserver crashes gracefully with reconnection (3 retries, exponential backoff)
- `open` command successfully opens a file in tsserver
- `projectInfo` command returns project configuration
- Process cleanup on wrapper disposal (no zombie processes)
- 30-second default timeout for requests

## Test Infrastructure
- Create a test fixture project at `test/fixtures/sample-project/`
- Test fixture must include:
  - `tsconfig.json` with basic configuration
  - At least 2-3 `.ts` files with known symbols (classes, functions, variables)
  - One file with intentional type errors (for testing diagnostics)
- Unit tests use the fixture to verify tsserver communication
- Tests must verify Content-Length framing works correctly

## Checklist
- [ ] TS-008: Implement tsserver process spawning with TypeScript resolution
- [ ] TS-009: Implement Content-Length framed stdin/stdout protocol
- [ ] TS-010: Add request/response correlation via sequence numbers
- [ ] TS-011: Implement async event handling
- [ ] TS-012: Implement file open command
- [ ] TS-013: Add error handling, timeout (30s), and reconnection (3 retries, exponential backoff)
- [ ] TS-014: Create test fixture project with tsconfig.json and sample .ts files
