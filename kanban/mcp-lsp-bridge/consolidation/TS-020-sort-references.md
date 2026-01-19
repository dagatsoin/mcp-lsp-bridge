# add(tools): BS-001.3 Sort results per ordering specification

**Labels:** Technical Story, US-Find-References

## Context

**User Story:** US-005 Find References Tool

References must be sorted with definition/declaration first, then usages sorted alphabetically by file path.

## Impact
- add(tools): BS-001.3 Identify declaration vs usage references
- add(tools): BS-001.3 Sort declarations first
- add(tools): BS-001.3 Sort usages by file path alphabetically

## Acceptance Tests
- BS-001.3: Declaration/definition appears first in results
- BS-001.3: Usages follow, sorted by file path A-Z
- BS-001.3: Within same file, sorted by line number
- BS-001.3: Sorting is stable and reproducible
