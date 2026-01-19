# add(tools): DR-001.2 Add code snippet extraction for each reference

**Labels:** Technical Story, US-Find-References

## Context

**User Story:** US-005 Find References Tool

Each reference should include the line of code containing it. This provides context without requiring users to open each file.

## Impact
- add(tools): DR-001.2 Read file content for each reference
- add(tools): DR-001.2 Extract the line at reference location
- add(tools): DR-001.2 Cache file contents to avoid repeated reads

## Acceptance Tests
- DR-001.2: Each reference has codeSnippet field
- DR-001.2: Snippet is the complete line of code
- DR-001.2: Original indentation preserved
- DR-001.2: File caching reduces I/O for same-file references
- DR-001.2: Graceful handling of unreadable files
