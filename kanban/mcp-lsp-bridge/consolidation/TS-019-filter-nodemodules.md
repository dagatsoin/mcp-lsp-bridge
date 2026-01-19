# add(tools): FS-001.1 Filter node_modules references

**Labels:** Technical Story, US-Find-References

## Context

**User Story:** US-005 Find References Tool

By default, references in node_modules should be excluded. The includeNodeModules parameter controls this behavior.

## Impact
- add(tools): FS-001.1 Check if reference path contains node_modules
- add(tools): FS-001.1 Filter based on includeNodeModules parameter
- add(tools): FS-001.1 Default to excluding node_modules

## Acceptance Tests
- AC-1.1.2: Default excludes node_modules references
- AC-1.1.3: includeNodeModules=true includes them
- FS-001.1: Filter applies after tsserver response
- FS-001.1: totalCount reflects filtered count
