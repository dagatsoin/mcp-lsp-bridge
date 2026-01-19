# add(tools): AC-1.1.6 Detect declaration vs usage reference type

**Labels:** Technical Story, US-Find-References

## Context

**User Story:** US-005 Find References Tool

Each reference should indicate whether it's a declaration or a usage. This helps users understand the nature of each reference.

## Impact
- add(tools): AC-1.1.6 Analyze tsserver reference metadata
- add(tools): AC-1.1.6 Set referenceType to "declaration" or "usage"
- add(tools): AC-1.1.6 Handle edge cases (re-exports, etc.)

## Acceptance Tests
- AC-1.1.6: Variable/function definitions marked as "declaration"
- AC-1.1.6: Import statements marked appropriately
- AC-1.1.6: Call sites marked as "usage"
- AC-1.1.6: Assignment targets marked as "usage"
- AC-1.1.6: Re-exports handled correctly
