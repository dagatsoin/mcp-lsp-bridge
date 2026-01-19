# MCP-LSP Bridge

An MCP server that bridges Claude Code to TypeScript's Language Server (tsserver), enabling semantic code navigation, reference finding, and refactoring.

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the MCP server
npm start

# Run in development mode (watch)
npm run dev
```

## Services

| Service | Port | Start Command |
|---------|------|---------------|
| MCP Server | stdio | `npm start` |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
src/
  index.ts      - Entry point
  server.ts     - MCP server with tool definitions
  schemas.ts    - Zod schemas for tool input validation
  tsserver.ts   - TSServer process wrapper
  types.ts      - TypeScript type definitions

test/
  server.test.ts    - MCP server tests
  tsserver.test.ts  - TSServer wrapper tests
  fixtures/         - Test fixtures
    sample-project/ - Sample TypeScript project for testing
```

## Architecture

```
Claude Code  <-->  MCP Server  <-->  tsserver (stdin/stdout)
   (client)      (this project)     (TypeScript language server)
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `find_references` | Locate all references to a symbol |
| `go_to_definition` | Navigate to symbol definition |
| `rename_symbol` | Rename symbol across project |
| `get_diagnostics` | Get compilation errors/warnings |

## Specification

See `specs/FS-001-mcp-lsp-bridge.md` for the full functional specification.
