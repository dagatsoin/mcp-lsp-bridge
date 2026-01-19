# add(deps): BS-001.1 Install and configure MCP SDK

**Labels:** Technical Story, US-MCP-Server-Skeleton

## Context

**User Story:** US-002 MCP Server Skeleton

The MCP SDK provides the protocol implementation for communicating with Claude Code. We need to install it and understand its API for server creation.

## Impact
- add(deps): BS-001.1 Install @modelcontextprotocol/sdk
- add(deps): BS-001.1 Install zod for schema validation (MCP SDK peer dep)

## Acceptance Tests
- BS-001.1: @modelcontextprotocol/sdk is in dependencies
- BS-001.1: zod is in dependencies
- BS-001.1: Package versions are compatible and recent
- BS-001.1: Import { McpServer } from SDK works without errors
