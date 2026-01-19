# EPIC - Code Navigation Tools

**Labels:** Epic, Milestone-MCP-LSP-Bridge-v1

## Spec References
- FS-001.1: find_references Tool
- FS-001.2: go_to_definition Tool

## Context

**Milestone:** MCP-LSP Bridge v1.0

With the foundation in place (EPIC-001), we can implement the read-only code navigation tools. These tools let users navigate codebases semantically without modifying any files.

## Description

This epic delivers the core code navigation experience:
1. **go_to_definition** - Jump to where a symbol is defined
2. **find_references** - Find all usages of a symbol across the project

These are the most frequently used LSP features and provide immediate value to Claude Code users who currently rely on text search.

**Business Value:** Users can navigate code with precision instead of grep-based guessing. This dramatically improves code exploration accuracy.

## Acceptance Criteria
- go_to_definition returns accurate definition locations
- go_to_definition handles external definitions (node_modules, .d.ts)
- find_references locates all usages of a symbol
- find_references distinguishes between declarations and usages
- Both tools follow the error format from FS-001.7
- Both tools use 1-based line/column indexing (BS-001.2)

## Checklist
- [ ] US-004: Go To Definition Tool
- [ ] US-005: Find References Tool
