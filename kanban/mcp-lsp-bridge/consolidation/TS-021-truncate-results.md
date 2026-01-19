# add(tools): BS-001.5 Implement result truncation at 500

**Labels:** Technical Story, US-Find-References

## Context

**User Story:** US-005 Find References Tool

Large symbols (like common utility functions) may have thousands of references. We limit results to 500 and indicate if more exist.

## Impact
- add(tools): BS-001.5 Count total references before truncation
- add(tools): BS-001.5 Limit returned array to 500 items
- add(tools): BS-001.5 Set truncated flag if limit exceeded

## Acceptance Tests
- BS-001.5: No more than 500 references returned
- BS-001.5: truncated=true when original count > 500
- BS-001.5: truncated=false when original count <= 500
- BS-001.5: totalCount reflects count before truncation
