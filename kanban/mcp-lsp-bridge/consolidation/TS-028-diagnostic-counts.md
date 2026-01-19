# add(tools): AC-1.4.5 Calculate summary counts

**Labels:** Technical Story, US-Get-Diagnostics

## Context

**User Story:** US-006 Get Diagnostics Tool

The response includes summary counts for each severity level, making it easy to assess overall code health at a glance.

## Impact
- add(tools): AC-1.4.5 Count errors
- add(tools): AC-1.4.5 Count warnings
- add(tools): AC-1.4.5 Count info items
- add(tools): AC-1.4.5 Count hints

## Acceptance Tests
- AC-1.4.5: errorCount equals number of error diagnostics
- AC-1.4.5: warningCount equals number of warning diagnostics
- AC-1.4.5: infoCount equals number of info diagnostics
- AC-1.4.5: hintCount equals number of hint diagnostics
- AC-1.4.5: Counts are 0 when no diagnostics of that type
