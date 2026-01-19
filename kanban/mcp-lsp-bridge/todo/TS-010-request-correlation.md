# add(tsserver): FS-001.5 Add request/response correlation

**Labels:** Technical Story, US-TSServer-Process

## Context

**User Story:** US-003 TSServer Process Management

tsserver uses sequence numbers (seq) to correlate requests with responses. We need to track pending requests and resolve them when responses arrive.

## Impact
- add(tsserver): FS-001.5 Implement sequence number generation
- add(tsserver): FS-001.5 Track pending requests with Promise resolvers
- add(tsserver): FS-001.5 Match responses to requests via request_seq

## Acceptance Tests
- FS-001.5: Each request gets a unique, incrementing sequence number
- FS-001.5: sendRequest() returns a Promise that resolves with response
- FS-001.5: Response is matched to request via request_seq field
- FS-001.5: Timeout handling for requests that never get responses
- FS-001.5: Multiple concurrent requests are handled correctly
