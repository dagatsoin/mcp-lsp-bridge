# MILESTONE - MCP-LSP Bridge v1.0

**Labels:** Milestone

## Spec References
- FS-001: MCP-LSP Bridge (complete specification)

## Description

Claude Code currently relies on text-based search tools (ripgrep) for code navigation, resulting in false positives, no semantic understanding, and imprecise results. The MCP-LSP Bridge delivers Language Server Protocol capabilities directly to Claude Code, enabling precise, semantically-aware code navigation and manipulation.

This milestone delivers a fully functional MCP server that bridges Claude Code to TypeScript's language server (tsserver), providing four core tools: go_to_definition, find_references, get_diagnostics, and rename_symbol.

**Target Users:** Claude Code users working with TypeScript/JavaScript projects who need accurate code navigation and refactoring capabilities.

**Key Value Proposition:** Transform Claude Code's code navigation from text-based guessing to semantic precision.

## Checklist
- [ ] EPIC-001: Project Foundation & TSServer Connection
- [ ] EPIC-002: Code Navigation Tools
- [ ] EPIC-003: Code Analysis Tools
- [ ] EPIC-004: Code Refactoring Tools
