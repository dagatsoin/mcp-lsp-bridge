# add(tools): AC-1.3.1 Apply text edits to files

**Labels:** Technical Story, US-Rename-Symbol

## Context

**User Story:** US-007 Rename Symbol Tool

This is where files are actually modified on disk. We need to apply text edits carefully, handling multiple edits per file.

## Impact
- add(tools): AC-1.3.1 Read file content
- add(tools): AC-1.3.1 Apply edits in reverse order (to preserve positions)
- add(tools): AC-1.3.1 Write modified content back to file
- add(tools): AC-1.3.1 Preserve file encoding (UTF-8)

## Acceptance Tests
- AC-1.3.1: Files are modified on disk
- AC-1.3.1: Multiple edits per file applied correctly
- AC-1.3.1: Edit positions remain valid (reverse order application)
- AC-1.3.1: File encoding preserved
- AC-1.3.1: Original line endings preserved
