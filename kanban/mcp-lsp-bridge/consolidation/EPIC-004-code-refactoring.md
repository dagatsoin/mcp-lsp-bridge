# EPIC - Code Refactoring Tools

**Labels:** Epic, Milestone-MCP-LSP-Bridge-v1

## Spec References
- FS-001.3: rename_symbol Tool

## Context

**Milestone:** MCP-LSP Bridge v1.0

After navigation (EPIC-002) and analysis (EPIC-003) tools are working, we add the most complex capability: file modification through rename_symbol.

## Description

This epic delivers code refactoring capabilities:
1. **rename_symbol** - Rename a symbol and update all references across the project

This is the only tool that modifies files, making it the most powerful but also most risky tool. It requires careful implementation to ensure correctness and safety.

**Business Value:** Users can safely rename variables, functions, classes, and types across entire projects without manual find-replace errors.

## Acceptance Criteria
- rename_symbol updates all references to a symbol
- Files are modified directly on disk
- Changes are reported with before/after context
- Files outside workspaceRoot are never modified (BS-001.4)
- Conflicts with existing symbols are detected and reported

## Checklist
- [ ] US-007: Rename Symbol Tool
