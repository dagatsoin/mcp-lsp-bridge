# Foundation-Setup - Project Setup & Build Configuration

**Labels:** User Story, Epic-Project-Foundation

**Status:** VALIDATED - Ready to move to todo

## Spec References
- FS-001.5: Project Configuration
- FS-001.6: Supported File Types
- BS-001.1: File Path Convention

## Context

**Epic:** EPIC-001 Project Foundation & TSServer Connection

This is the first ticket in the project. We need a properly configured TypeScript project that can be built, tested, and run as an MCP server.

**Project Location:** Repository root (`/Users/warfog/dev/mcp-lsp/`)

## Description

As a developer, I can clone the repository and run a single command to build and start the MCP server.

## Impact
- Project root (package.json, tsconfig.json, build scripts)
- Source directory structure
- Node.js 18+ runtime

## Business Rules
- BS-001.1: Project uses TypeScript with ES modules
- Dependencies should be minimal and well-maintained

## Technical Details

**Test Framework:** Vitest

**package.json requirements:**
- `"type": "module"` for ES modules
- `"engines": { "node": ">=18.0.0" }` for Node.js version enforcement

**Out of Scope (MVP):**
- Linting configuration (ESLint)
- Code formatting (Prettier)

## Regressions
- N/A (new project)

## Acceptance Criteria
- `npm install` installs all dependencies without errors
- `npm run build` compiles TypeScript to JavaScript
- `npm run dev` starts the server in development mode with watch
- `npm test` runs the test suite (can be empty initially)
- Project uses ES modules (type: "module" in package.json)
- TypeScript strict mode is enabled
- Source maps are generated for debugging
- Vitest configured for unit testing

## Test Infrastructure
- No special test infrastructure needed for this ticket

## Checklist
- [ ] TS-001: Initialize npm project with TypeScript
- [ ] TS-002: Configure tsconfig.json for ES modules
- [ ] TS-003: Set up project directory structure
