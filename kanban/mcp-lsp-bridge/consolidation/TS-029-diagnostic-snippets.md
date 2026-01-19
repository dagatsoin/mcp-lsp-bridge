# add(tools): DR-001.2 Add code snippet extraction for diagnostics

**Labels:** Technical Story, US-Get-Diagnostics

## Context

**User Story:** US-006 Get Diagnostics Tool

Each diagnostic includes the line of code where the issue occurs, providing context without requiring file navigation.

## Impact
- add(tools): DR-001.2 Read file content at diagnostic location
- add(tools): DR-001.2 Extract the line with the diagnostic
- add(tools): DR-001.2 Cache file contents for efficiency

## Acceptance Tests
- DR-001.2: codeSnippet contains the diagnostic line
- DR-001.2: Original indentation preserved
- DR-001.2: File caching for multiple diagnostics in same file
- DR-001.2: Graceful handling of unreadable files
