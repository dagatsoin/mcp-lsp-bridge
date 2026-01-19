# EPIC - Project Foundation & TSServer Connection

**Labels:** Epic, Milestone-MCP-LSP-Bridge-v1

## Spec References
- FS-001.5: Project Configuration
- FS-001.6: Supported File Types
- FS-001.7: Error Response Format

## Context

**Milestone:** MCP-LSP Bridge v1.0

Before implementing any tools, we need a working foundation: a functional MCP server that can communicate with Claude Code, and a reliable connection to tsserver that can process TypeScript/JavaScript projects.

## Description

This epic establishes the technical foundation for all subsequent tools. It delivers:
1. A Node.js/TypeScript project with proper build configuration
2. An MCP server skeleton that Claude Code can connect to
3. A tsserver wrapper that handles stdin/stdout JSON communication
4. Shared utilities for error handling and response formatting

**Business Value:** Without this foundation, no tools can be delivered. This epic unblocks all subsequent work while delivering a testable connection to tsserver.

## Acceptance Criteria
- Project builds and runs without errors
- MCP server starts and responds to tool list requests
- TSServer process can be spawned and receives commands
- TSServer responds to basic commands (open file, get project info)
- Error handling follows FS-001.7 format

## Checklist
- [ ] US-001: Project Setup & Build Configuration
- [ ] US-002: MCP Server Skeleton
- [ ] US-003: TSServer Process Management
