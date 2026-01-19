# add(tools): AC-1.4.3 Implement project-wide diagnostics enumeration

**Labels:** Technical Story, US-Get-Diagnostics

## Context

**User Story:** US-006 Get Diagnostics Tool

When filePath is omitted, get_diagnostics returns diagnostics for all files in the project. This requires enumerating project files.

## Impact
- add(tools): AC-1.4.3 Get project file list from tsserver
- add(tools): AC-1.4.3 Iterate files and collect diagnostics
- add(tools): AC-1.4.3 Handle partial failures per FS-001.8

## Acceptance Tests
- AC-1.4.3: Project-wide diagnostics when filePath omitted
- AC-1.4.3: All project files checked
- FS-001.8: Partial results returned if some files fail
- FS-001.8: Failures array includes file path and reason
