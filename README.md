# mcp-lsp-bridge

> It is like "Rename/go to reference" for Claude Code.

An MCP server that bridges AI coding assistants to TypeScript's Language Server (tsserver), enabling semantic code navigation, reference finding, and refactoring.

Unlike text-based search (ripgrep), this server provides **semantically-aware** results — no false positives from comments or strings, proper import resolution, and accurate type-aware symbol tracking.

## Benchmark

Tested on a real TypeScript monorepo (423 files, 4 packages). Task: rename a type property referenced across 118 files with 1,000+ occurrences.

| Metric | Claude | MCP-LSP Bridge | Improvement |
|--------|--------|----------------|-------------|
| **Time** | 160 sec | 22 sec | 7x faster |
| **Tool calls** | 41 | 4 | 10x fewer |
| **Tokens** | ~6,300 | ~12 | 500x fewer |
| **Cost** | ~$2.20 | ~$0.15 | 93% savings |

One MCP tool call replaces an entire chain of grep/read/edit steps — faster, cheaper, and more accurate.

## How It Works

This project is a **bridge**, not a language server itself. It wraps TypeScript's own language server (`tsserver`) and exposes its capabilities as MCP tools. The bridge manages `tsserver` processes automatically — you don't need to start or configure anything yourself.

```
┌─────────────────────────────────────────────────────┐
│  VS Code                                            │
│  ┌───────────────┐    ┌────────────────────────────┐│
│  │  Editor       │    │  Claude Code (terminal)    ││
│  │               │    │                            ││
│  │  Built-in     │    │  Uses MCP tools instead of ││
│  │  IntelliSense │    │  grep/read for navigation  ││
│  └──────┬────────┘    └────────────┬───────────────┘│
│         │                          │                │
│         ▼                          ▼                │
│    VS Code's                 mcp-lsp-bridge         │
│    tsserver                  (this project)         │
│    (built-in)                      │                │
│                                    ▼                │
│                              Its own tsserver       │
│                              (spawned on demand)    │
└─────────────────────────────────────────────────────┘
```

VS Code already gives **you** IntelliSense through its built-in `tsserver`. This project gives **Claude** the same semantic understanding through its own `tsserver` instance, so it can navigate your code as precisely as your IDE does.

### Example: VS Code + Claude Code

1. You're editing a TypeScript monorepo in VS Code
2. You open the integrated terminal and run Claude Code
3. You ask Claude to rename a type property used across 118 files
4. **Without mcp-lsp-bridge:** Claude uses `grep` to find the symbol, reads each file, edits them one by one — 41 tool calls, ~160 seconds, $2.20
5. **With mcp-lsp-bridge:** Claude calls `rename_symbol` once and updates every reference instantly — 4 tool calls, ~22 seconds, $0.15

## Tools

| Tool | Description | Modifies Files |
|------|-------------|----------------|
| `find_references` | Locate all references to a symbol | No |
| `go_to_definition` | Navigate to symbol definition | No |
| `rename_symbol` | Rename symbol across project | Yes |
| `get_diagnostics` | Get compilation errors/warnings | No |

## Installation

```bash
npm install -g mcp-lsp-bridge
```

Or use directly with `npx`:

```bash
npx mcp-lsp-bridge
```

## Configuration

### Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "mcp-lsp-bridge": {
      "command": "npx",
      "args": ["mcp-lsp-bridge"]
    }
  }
}
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-lsp-bridge": {
      "command": "npx",
      "args": ["mcp-lsp-bridge"]
    }
  }
}
```

## Usage

All tools accept a `workspaceRoot` (absolute path to your project) and file positions use **1-based** line and column numbers.

### find_references

Find all usages of a symbol across the project.

```json
{
  "workspaceRoot": "/path/to/project",
  "filePath": "src/utils.ts",
  "line": 5,
  "column": 17
}
```

Returns references with file paths, positions, code snippets, and whether each is a declaration or usage.

### go_to_definition

Jump to where a symbol is defined.

```json
{
  "workspaceRoot": "/path/to/project",
  "filePath": "src/app.ts",
  "line": 10,
  "column": 3
}
```

Returns definition location(s), including external definitions in `node_modules` or `.d.ts` files.

### rename_symbol

Rename a symbol and update all references across the project.

```json
{
  "workspaceRoot": "/path/to/project",
  "filePath": "src/models.ts",
  "line": 8,
  "column": 14,
  "newName": "updatedName"
}
```

Modifies files on disk and returns a report of all changes made.

### get_diagnostics

Get TypeScript compilation errors and warnings.

```json
{
  "workspaceRoot": "/path/to/project",
  "filePath": "src/index.ts"
}
```

Omit `filePath` for project-wide diagnostics. Returns severity, diagnostic codes, and code snippets.

## Supported Projects

- TypeScript projects (`tsconfig.json`)
- JavaScript projects (`jsconfig.json`)
- Monorepos (Nx, Turborepo) with multiple tsconfig files
- Mixed TypeScript/JavaScript codebases
- All standard file extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`, `.mjs`, `.cjs`, `.d.ts`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Development mode (watch)
npm run dev
```

## Architecture

```
AI Client  <-->  MCP Server  <-->  tsserver (stdin/stdout)
              (this project)     (TypeScript language server)
```

The server manages tsserver instances per workspace, caching them for subsequent requests.

## License

MIT
