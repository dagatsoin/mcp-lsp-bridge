# add(tools): DR-001.2 Add code snippet extraction for definitions

**Labels:** Technical Story, US-Go-To-Definition

## Context

**User Story:** US-004 Go To Definition Tool

Each definition should include a code snippet showing the actual line of code. This helps users understand what they're navigating to.

## Impact
- add(tools): DR-001.2 Read file content at definition location
- add(tools): DR-001.2 Extract the line containing the definition
- add(tools): DR-001.2 Preserve original indentation

## Acceptance Tests
- DR-001.2: codeSnippet contains the definition line
- DR-001.2: Original indentation is preserved
- DR-001.2: Line is not truncated (full line included)
- DR-001.2: File read errors are handled gracefully
