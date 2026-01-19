# EPIC - Code Analysis Tools

**Labels:** Epic, Milestone-MCP-LSP-Bridge-v1

## Spec References
- FS-001.4: get_diagnostics Tool

## Context

**Milestone:** MCP-LSP Bridge v1.0

After navigation tools (EPIC-002), we add analysis capabilities. The get_diagnostics tool lets users understand compilation issues without running the TypeScript compiler manually.

## Description

This epic delivers code analysis capabilities:
1. **get_diagnostics** - Retrieve compilation errors, warnings, and hints

This tool helps Claude Code understand code health and identify issues that need fixing. It supports both single-file and project-wide diagnostics.

**Business Value:** Users can quickly identify TypeScript errors and warnings without leaving Claude Code, enabling faster debugging and code quality assessment.

## Acceptance Criteria
- get_diagnostics returns errors, warnings, info, and hints
- Single-file mode returns diagnostics for one file
- Project-wide mode returns diagnostics across all files
- Diagnostic codes (e.g., TS2304) are included
- Summary counts by severity are provided

## Checklist
- [ ] US-006: Get Diagnostics Tool
