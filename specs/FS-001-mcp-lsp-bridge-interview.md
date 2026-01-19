# Interview: MCP-LSP Bridge

**Status:** COMPLETE
**Started:** 2026-01-19
**Completed:** 2026-01-19
**Specification ID:** FS-001
**Final Spec:** [FS-001-mcp-lsp-bridge.md](./FS-001-mcp-lsp-bridge.md)

---

## Progress Tracker
- [x] 1. Big Picture & Context
- [x] 2. Core Tools & Operations
- [x] 3. Configuration & Project Setup
- [x] 4. Business Rules & Constraints
- [x] 5. User Interactions & Workflows
- [x] 6. Error Handling & Edge Cases
- [x] 7. Performance Considerations
- [x] 8. Dependencies & Future Scope

---

## 1. Big Picture & Context

### 1.1 Problem Validation
- [x] What problem are we solving?
  > Claude Code cannot directly use IntelliSense or TypeScript's LSP. Currently relies on ripgrep/text search which is slower and less precise. Text search has false positives (comments, strings) and can't understand type scope (imports, re-exports, generics).

- [x] Who are the primary users of this system?
  > Claude Code only - designed specifically for Claude Code's needs.

- [x] What does success look like? How will we measure it?
  > Claude Code can accurately find all references to a symbol without false positives, navigate to definitions, perform safe renames, and identify compilation issues.

### 1.2 Scope Boundaries
- [x] What TypeScript/JavaScript project types must be supported?
  > All of the following:
  > - Single tsconfig.json projects
  > - Monorepos with multiple tsconfig.json files (Nx, Turborepo)
  > - JavaScript-only projects
  > - Mixed TypeScript/JavaScript codebases

- [x] Are there any project types explicitly OUT of scope?
  > Non-TypeScript/JavaScript projects. Other language servers may be added in future versions.

---

## 2. Core Tools & Operations

### 2.1 find_references
- [x] What information should be returned for each reference found?
  > - File path (relative to project root)
  > - Line number
  > - Column number
  > - Code snippet (the line containing the reference)
  > - Reference type (declaration vs usage)

- [x] Should references include results from node_modules/dependencies?
  > Exclude by default, but allow option to include

- [x] Should there be any filtering or grouping of results?
  > Order: definition first, then usages sorted by file path

**Return data structure:** File path (relative), line, column, code snippet (1 line), reference type (declaration/usage)

**node_modules handling:** Exclude by default with option to include

**Result ordering:** Definition first, then usages by file

### 2.2 rename_symbol
- [x] Should the rename operation actually modify files, or return a preview of changes?
  > Modify files directly on disk (not preview/diff)

- [x] What should happen if the rename affects files outside the current project?
  > Do not modify files outside workspaceRoot

- [x] Should there be a "dry run" mode?
  > No, not for v1

**Result reporting:** List of files modified with line numbers and before/after text

**Conflict handling:** Return error if new name conflicts with existing symbol

### 2.3 get_diagnostics
- [x] What types of diagnostics should be reported?
  > All types: errors, warnings, info, hints

- [x] Should diagnostics be for a single file, or project-wide?
  > Both - single file when filePath provided, project-wide when omitted

- [x] How should diagnostic severity be communicated?
  > As part of each diagnostic: error, warning, info, hint

### 2.4 go_to_definition
- [x] What should happen when a symbol has multiple definitions (e.g., overloads, declaration merging)?
  > Return all definitions

- [x] Should this include type definitions from .d.ts files?
  > Yes, marked with isExternal flag

- [x] Should there be a separate "go to type definition" operation?
  > No, not for v1

### 2.5 Additional Tools
- [x] Are there other LSP capabilities you want to expose?
  > Keep to the initial four tools for now (find_references, rename_symbol, get_diagnostics, go_to_definition). Will add more later if necessary.

---

## 3. Configuration & Project Setup

### 3.1 Project Discovery
- [x] How should the system discover the TypeScript project configuration?
  > Pass workspace root with every tool call

- [x] What happens if no tsconfig.json exists?
  > Fall back to jsconfig.json, then use sensible defaults

**Project initialization:** Pass workspace root path with every tool call

**Monorepo handling:** Use the nearest tsconfig.json to the file being queried

**JavaScript-only projects:** Look for jsconfig.json, then use sensible defaults

### 3.2 Initialization
- [x] Does the MCP server need to be explicitly initialized with a project root?
  > No - workspace root is passed with every call

- [x] Should users be able to switch between different projects in one session?
  > Yes, by providing different workspaceRoot values

### 3.3 Configuration Options
- [x] What user-configurable options should be exposed?
  > For v1: only includeNodeModules option on find_references

---

## 4. Business Rules & Constraints

### 4.1 File Handling
- [x] What file extensions should be supported?
  > .ts, .tsx, .js, .jsx, .mts, .cts, .mjs, .cjs, .d.ts

- [x] Should the system handle unsaved/modified files (dirty buffers)?
  > No, out of scope for v1

### 4.2 Position Handling
- [x] How should positions be specified - 0-indexed or 1-indexed?
  > 1-indexed for both line and column (matches editor display)

- [x] What happens if a position is invalid (out of bounds)?
  > Return clear error with INVALID_POSITION code suggesting to check position

---

## 5. User Interactions & Workflows

### 5.1 Typical Workflows
- [x] Describe a typical workflow for finding all usages of a function.
  > 1. Claude Code identifies symbol of interest
  > 2. Calls find_references with file path and position
  > 3. Receives list of all references
  > 4. Can navigate or analyze each reference

- [x] Describe a typical workflow for safely renaming a symbol.
  > 1. Claude Code identifies symbol to rename
  > 2. Calls rename_symbol with file, position, and new name
  > 3. All files are modified on disk
  > 4. Receives report of all changes made

### 5.2 Session Management
- [x] Should the language server persist between tool calls?
  > Implementation detail - out of scope for functional spec

- [x] What happens if the underlying project files change while the server is running?
  > Implementation detail - out of scope for functional spec

---

## 6. Error Handling & Edge Cases

### 6.1 Error Scenarios
- [x] What should happen if the language server crashes or becomes unresponsive?
  > Return LANGUAGE_SERVER_ERROR with retry suggestion

- [x] What should happen if a file doesn't exist?
  > Return FILE_NOT_FOUND error

- [x] What should happen if the position points to whitespace or non-symbol content?
  > Return NO_SYMBOL_AT_POSITION error

**Error response format:** Structured errors with code + message + resolution suggestions

**Partial failure:** Return partial results + list of failures

### 6.2 Edge Cases
- [x] How should the system handle very large projects (thousands of files)?
  > Acceptable cold start, result limits (500 default)

- [x] How should the system handle syntax errors in the target file?
  > Continue with available information, diagnostics will report errors

- [x] What about files not part of the tsconfig include patterns?
  > Attempt to process, return error with resolution if unable

---

## 7. Performance Considerations

### 7.1 Response Time Expectations
- [x] What is an acceptable response time for typical operations?
  > Skip optimization considerations for now - focus on functionality first

- [x] Should there be timeout handling?
  > Implementation detail

**Cold start vs warm:** Cold start is acceptable, no specific target

**Result limits:** Reasonable default (500)

### 7.2 Resource Management
- [x] Are there memory constraints to consider?
  > Not for v1

- [x] Should there be limits on result set sizes?
  > 500 results default

---

## 8. Dependencies & Future Scope

### 8.1 Current Scope
- [x] Is TypeScript/JavaScript the only language for v1?
  > Yes

- [x] Any specific TypeScript/tsserver version requirements?
  > Not specified for v1

### 8.2 Future Considerations
- [x] Are there plans to support other language servers (e.g., Python, Go)?
  > Possible future enhancement, not v1

- [x] Any plans for project-wide refactoring operations beyond rename?
  > Possible future enhancement (extract function, move to file)

---

## Interview Progress

| Section | Status |
|---------|--------|
| 1. Big Picture & Context | Complete |
| 2. Core Tools & Operations | Complete |
| 3. Configuration & Project Setup | Complete |
| 4. Business Rules & Constraints | Complete |
| 5. User Interactions & Workflows | Complete |
| 6. Error Handling & Edge Cases | Complete |
| 7. Performance Considerations | Complete |
| 8. Dependencies & Future Scope | Complete |

**Completed Sections:** 8/8
**Current Section:** N/A - Interview Complete
**Overall Status:** COMPLETE - Specification Generated
