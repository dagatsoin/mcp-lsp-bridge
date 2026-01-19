# add(project): BS-001.1 Initialize npm project with TypeScript

**Labels:** Technical Story, US-Project-Setup

## Context

**User Story:** US-001 Project Setup & Build Configuration

We need to initialize a Node.js project with TypeScript as the foundation for the MCP-LSP Bridge. This includes package.json configuration, dependencies, and npm scripts.

## Impact
- add(project): BS-001.1 Initialize package.json with ES module type
- add(project): BS-001.1 Add TypeScript and essential dev dependencies
- add(project): BS-001.1 Configure npm scripts for build/dev/test

## Acceptance Tests
- BS-001.1: package.json exists with "type": "module"
- BS-001.1: TypeScript is listed as devDependency
- BS-001.1: `npm run build` script is defined
- BS-001.1: `npm run dev` script is defined (with watch mode)
- BS-001.1: `npm test` script is defined
- BS-001.1: Main entry point is set to compiled output
