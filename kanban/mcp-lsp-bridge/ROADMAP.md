# MCP-LSP Bridge Development Roadmap

## Project Vision

Transform Claude Code's code navigation from text-based search to semantically-aware LSP operations. This MCP server bridges Claude Code to TypeScript's language server (tsserver), enabling precise symbol navigation, reference finding, diagnostics, and refactoring.

## Architecture

```
Claude Code  <-->  MCP Server  <-->  TypeScript Language Server (tsserver)
   (client)       (this project)         (stdin/stdout JSON protocol)
```

---

## Iteration Plan

### Iteration 1: Foundation (Project Setup + MCP Server + TSServer Connection)

**Goal:** Establish a working MCP server that connects to tsserver

**User Value:** Claude Code can connect to the server and see the four tools available (even though they return "not implemented" initially).

**Tickets:**
| ID | Title | Type | Status |
|----|-------|------|--------|
| US-001 | Project Setup & Build Configuration | User Story | todo |
| US-002 | MCP Server Skeleton | User Story | todo |
| US-003 | TSServer Process Management | User Story | todo |

**Dependencies:** None (foundational work)

**Deliverable:** Running MCP server with tsserver communication verified

---

### Iteration 2: First Tool (go_to_definition)

**Goal:** Deliver the simplest, most valuable navigation tool

**User Value:** Claude Code users can jump directly to where any symbol is defined, eliminating guesswork from code navigation.

**Tickets:**
| ID | Title | Type | Status |
|----|-------|------|--------|
| US-004 | Go To Definition Tool | User Story | consolidation |

**Dependencies:** Iteration 1 complete (MCP server + tsserver working)

**Deliverable:** Working go_to_definition tool with proper error handling

---

### Iteration 3: find_references Tool

**Goal:** Add the ability to find all usages of a symbol

**User Value:** Claude Code users can see everywhere a symbol is used, understand impact of changes, and navigate complex codebases.

**Tickets:**
| ID | Title | Type | Status |
|----|-------|------|--------|
| US-005 | Find References Tool | User Story | consolidation |

**Dependencies:** Iteration 2 complete (shared infrastructure reused)

**Deliverable:** Working find_references tool with filtering and pagination

---

### Iteration 4: get_diagnostics Tool

**Goal:** Add code analysis capabilities

**User Value:** Claude Code users can quickly check files or projects for TypeScript errors without running the compiler manually.

**Tickets:**
| ID | Title | Type | Status |
|----|-------|------|--------|
| US-006 | Get Diagnostics Tool | User Story | consolidation |

**Dependencies:** Iteration 2 complete (tsserver communication)

**Deliverable:** Working get_diagnostics tool for single files and project-wide analysis

---

### Iteration 5: rename_symbol Tool

**Goal:** Add safe, project-wide symbol renaming

**User Value:** Claude Code users can rename variables, functions, classes, and types across entire projects without manual find-replace errors.

**Tickets:**
| ID | Title | Type | Status |
|----|-------|------|--------|
| US-007 | Rename Symbol Tool | User Story | consolidation |

**Dependencies:** Iteration 3 complete (find_references provides similar pattern)

**Deliverable:** Working rename_symbol tool with safety checks and detailed reporting

---

## Kanban Board Summary

### Backlog
- MILESTONE-001: MCP-LSP Bridge v1.0

### Consolidation (Ready for Developer Review)
**Epics:**
- EPIC-001: Project Foundation & TSServer Connection
- EPIC-002: Code Navigation Tools
- EPIC-003: Code Analysis Tools
- EPIC-004: Code Refactoring Tools

**User Stories:**
- US-004: Go To Definition Tool
- US-005: Find References Tool
- US-006: Get Diagnostics Tool
- US-007: Rename Symbol Tool

**Technical Stories:**
- TS-015 through TS-035 (see individual files)

### Todo (Ready for Development)
**User Stories (Iteration 1):**
- US-001: Project Setup & Build Configuration
- US-002: MCP Server Skeleton
- US-003: TSServer Process Management

**Technical Stories (Iteration 1):**
- TS-001: Initialize npm project
- TS-002: Configure tsconfig.json
- TS-003: Create project structure
- TS-004: Install MCP SDK
- TS-005: MCP server stdio transport
- TS-006: Define tool schemas
- TS-007: Stub tool handlers
- TS-008: Spawn tsserver process
- TS-009: TSServer protocol implementation
- TS-010: Request/response correlation
- TS-011: File open command
- TS-012: Error recovery
- TS-013: Definition request
- TS-014: Definition transform

### In Progress
(Empty - work begins after consolidation approval)

### Review
(Empty)

### Done
(Empty)

---

## Dependency Graph

```
MILESTONE-001: MCP-LSP Bridge v1.0
|
+-- EPIC-001: Project Foundation
|   +-- US-001: Project Setup
|   +-- US-002: MCP Server Skeleton (depends on US-001)
|   +-- US-003: TSServer Process (depends on US-001)
|
+-- EPIC-002: Code Navigation
|   +-- US-004: go_to_definition (depends on EPIC-001)
|   +-- US-005: find_references (depends on US-004, reuses patterns)
|
+-- EPIC-003: Code Analysis
|   +-- US-006: get_diagnostics (depends on EPIC-001)
|
+-- EPIC-004: Code Refactoring
    +-- US-007: rename_symbol (depends on EPIC-002, most complex)
```

---

## Technical Story Distribution

| User Story | Technical Stories | Scope |
|------------|-------------------|-------|
| US-001 Project Setup | TS-001, TS-002, TS-003 | Small |
| US-002 MCP Server | TS-004, TS-005, TS-006, TS-007 | Small |
| US-003 TSServer | TS-008, TS-009, TS-010, TS-011, TS-012, TS-013, TS-014 | Medium |
| US-004 go_to_definition | TS-013, TS-014, TS-015, TS-016, TS-017 | Small |
| US-005 find_references | TS-018, TS-019, TS-020, TS-021, TS-022, TS-023 | Medium |
| US-006 get_diagnostics | TS-024, TS-025, TS-026, TS-027, TS-028, TS-029 | Medium |
| US-007 rename_symbol | TS-030, TS-031, TS-032, TS-033, TS-034, TS-035 | Medium |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| tsserver protocol complexity | Use well-documented TypeScript wiki; start with simple commands |
| Multi-file rename safety | Filter to workspaceRoot; validate before writing; detailed reporting |
| Large project performance | Use tsserver caching; result limits; lazy file loading |
| Cross-platform compatibility | Use Node.js built-ins; test on macOS/Linux/Windows |

---

## Success Criteria

1. All four tools pass acceptance criteria from FS-001
2. Error handling follows FS-001.7 format consistently
3. tsserver communication is reliable and handles edge cases
4. rename_symbol never modifies files outside workspaceRoot
5. Claude Code can use all tools in real TypeScript projects

---

## Next Steps

1. **Begin Development:** Start with US-001 (Project Setup) - pick up TS-001 first
2. **Sequential Flow:** US-001 -> US-002 -> US-003 (dependencies require order)
3. **Parallel Work:** TS-001, TS-002, TS-003 can be done in parallel within US-001
4. **After Iteration 1:** Review and validate Iteration 2 tickets (US-004)
