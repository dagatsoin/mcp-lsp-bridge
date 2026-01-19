# add(tools): AC-1.4.2 Implement single-file diagnostics request

**Labels:** Technical Story, US-Get-Diagnostics

## Context

**User Story:** US-006 Get Diagnostics Tool

When filePath is provided, get_diagnostics returns errors/warnings for just that file using tsserver's semantic and syntactic diagnostics commands.

## Impact
- add(tools): AC-1.4.2 Create getDiagnostics tool handler
- add(tools): AC-1.4.2 Send "semanticDiagnosticsSync" command
- add(tools): AC-1.4.2 Send "syntacticDiagnosticsSync" command
- add(tools): AC-1.4.2 Merge results from both commands

## Acceptance Tests
- AC-1.4.2: Single file diagnostics returned when filePath provided
- AC-1.4.2: Both semantic and syntactic diagnostics included
- AC-1.4.2: Results merged without duplicates
- AC-1.4.2: FILE_NOT_FOUND for non-existent file
