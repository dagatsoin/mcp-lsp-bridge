# FS-001: MCP-LSP Bridge

**Version:** 1.0
**Status:** FINAL
**Created:** 2026-01-19
**Last Updated:** 2026-01-19

---

## Overview

### Problem Statement

Claude Code currently relies on text-based search tools (ripgrep) for code navigation and analysis. This approach has significant limitations:

- **False positives:** Text search matches symbols in comments, strings, and unrelated contexts
- **No semantic understanding:** Cannot distinguish between different symbols with the same name
- **Missing type awareness:** Cannot follow imports, re-exports, or understand generic type relationships
- **Imprecise results:** Cannot differentiate between declaration, definition, and usage

### Solution

The MCP-LSP Bridge exposes Language Server Protocol capabilities to Claude Code through a set of focused tools. This enables precise, semantically-aware code navigation and manipulation that understands the actual structure and relationships in the codebase.

### Scope

This specification covers:
- Four core tools: find_references, rename_symbol, get_diagnostics, go_to_definition
- TypeScript and JavaScript project support
- Error handling and edge case behavior

---

## Functional Requirements

### FS-001.1: find_references Tool

**Description:** Locates all references to a symbol at a specified position in the codebase.

**Input Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| workspaceRoot | Yes | Absolute path to the project root directory |
| filePath | Yes | Path to the file containing the symbol (relative to workspaceRoot) |
| line | Yes | Line number of the symbol position |
| column | Yes | Column number of the symbol position |
| includeNodeModules | No | Whether to include references from dependencies (default: false) |

**Output Structure:**
```
{
  success: boolean,
  references: [
    {
      filePath: string,        // Relative to workspaceRoot
      line: number,
      column: number,
      codeSnippet: string,     // The line of code containing the reference
      referenceType: "declaration" | "usage"
    }
  ],
  totalCount: number,
  truncated: boolean,          // True if results exceeded limit
  failures: [                  // Present only if partial failures occurred
    {
      filePath: string,
      reason: string
    }
  ]
}
```

**Acceptance Criteria:**
- AC-1.1.1: Returns all references within project source files
- AC-1.1.2: Excludes node_modules references by default
- AC-1.1.3: Includes node_modules references when includeNodeModules is true
- AC-1.1.4: Orders results with definition/declaration first, then usages sorted by file path
- AC-1.1.5: Returns maximum 500 results by default; sets truncated flag if more exist
- AC-1.1.6: Distinguishes between declaration and usage reference types
- AC-1.1.7: Returns partial results with failure list when some files cannot be processed

---

### FS-001.2: go_to_definition Tool

**Description:** Navigates to the definition of a symbol at a specified position.

**Input Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| workspaceRoot | Yes | Absolute path to the project root directory |
| filePath | Yes | Path to the file containing the symbol (relative to workspaceRoot) |
| line | Yes | Line number of the symbol position |
| column | Yes | Column number of the symbol position |

**Output Structure:**
```
{
  success: boolean,
  definitions: [
    {
      filePath: string,        // Relative to workspaceRoot (or absolute for external)
      line: number,
      column: number,
      codeSnippet: string,     // The line of code containing the definition
      isExternal: boolean      // True if definition is in node_modules or .d.ts
    }
  ]
}
```

**Acceptance Criteria:**
- AC-1.2.1: Returns the definition location for the symbol at the specified position
- AC-1.2.2: Returns multiple definitions when applicable (overloads, declaration merging)
- AC-1.2.3: Includes type definitions from .d.ts files, marked with isExternal flag
- AC-1.2.4: Returns empty definitions array with success=true when no definition exists
- AC-1.2.5: Supports navigation to definitions in node_modules (marked as isExternal)

---

### FS-001.3: rename_symbol Tool

**Description:** Renames a symbol and updates all references across the project.

**Input Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| workspaceRoot | Yes | Absolute path to the project root directory |
| filePath | Yes | Path to the file containing the symbol (relative to workspaceRoot) |
| line | Yes | Line number of the symbol position |
| column | Yes | Column number of the symbol position |
| newName | Yes | The new name for the symbol |

**Output Structure:**
```
{
  success: boolean,
  filesModified: [
    {
      filePath: string,        // Relative to workspaceRoot
      changeCount: number,     // Number of replacements in this file
      changes: [
        {
          line: number,
          oldText: string,     // The line before change
          newText: string      // The line after change
        }
      ]
    }
  ],
  totalChanges: number
}
```

**Acceptance Criteria:**
- AC-1.3.1: Modifies files directly on disk (not preview mode)
- AC-1.3.2: Updates all references to the symbol within the project
- AC-1.3.3: Does not modify files outside the workspaceRoot
- AC-1.3.4: Returns detailed list of all files and lines modified
- AC-1.3.5: Reports the total number of changes made
- AC-1.3.6: Fails with descriptive error if newName conflicts with existing symbol in scope

---

### FS-001.4: get_diagnostics Tool

**Description:** Retrieves compilation errors, warnings, and other diagnostics for a file or project.

**Input Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| workspaceRoot | Yes | Absolute path to the project root directory |
| filePath | No | Path to specific file (relative to workspaceRoot). If omitted, returns project-wide diagnostics |

**Output Structure:**
```
{
  success: boolean,
  diagnostics: [
    {
      filePath: string,        // Relative to workspaceRoot
      line: number,
      column: number,
      endLine: number,
      endColumn: number,
      severity: "error" | "warning" | "info" | "hint",
      code: string,            // Diagnostic code (e.g., "TS2304")
      message: string,
      codeSnippet: string      // The line of code with the diagnostic
    }
  ],
  errorCount: number,
  warningCount: number,
  infoCount: number,
  hintCount: number
}
```

**Acceptance Criteria:**
- AC-1.4.1: Returns all diagnostic types (errors, warnings, info, hints)
- AC-1.4.2: Supports single-file diagnostics when filePath is provided
- AC-1.4.3: Supports project-wide diagnostics when filePath is omitted
- AC-1.4.4: Includes diagnostic code for programmatic handling
- AC-1.4.5: Provides summary counts by severity level

---

## Configuration Requirements

### FS-001.5: Project Configuration

**Description:** The system must support various TypeScript and JavaScript project configurations.

**Supported Project Types:**
| Project Type | Support Level |
|--------------|---------------|
| Single tsconfig.json projects | Full support |
| Monorepos with multiple tsconfig.json (Nx, Turborepo) | Full support |
| JavaScript-only projects (jsconfig.json) | Full support |
| Mixed TypeScript/JavaScript codebases | Full support |

**Acceptance Criteria:**
- AC-1.5.1: Workspace root is provided with every tool call (no initialization step required)
- AC-1.5.2: For monorepos, uses the nearest tsconfig.json to the file being queried
- AC-1.5.3: Falls back to jsconfig.json when no tsconfig.json exists
- AC-1.5.4: Uses sensible defaults when no config file exists (ES modules, include all .js/.jsx/.ts/.tsx)

### FS-001.6: Supported File Types

**Description:** The system must handle standard TypeScript and JavaScript file extensions.

**Supported Extensions:**
- `.ts` - TypeScript
- `.tsx` - TypeScript with JSX
- `.js` - JavaScript
- `.jsx` - JavaScript with JSX
- `.mts` - TypeScript ES module
- `.cts` - TypeScript CommonJS module
- `.mjs` - JavaScript ES module
- `.cjs` - JavaScript CommonJS module
- `.d.ts` - TypeScript declaration files

**Acceptance Criteria:**
- AC-1.6.1: All listed file extensions are processed by all tools
- AC-1.6.2: File paths in output are relative to workspaceRoot unless external to the project

---

## Error Handling

### FS-001.7: Error Response Format

**Description:** All errors must follow a structured format that enables programmatic handling and provides actionable guidance.

**Error Response Structure:**
```
{
  success: false,
  error: {
    code: string,              // Machine-readable error code
    message: string,           // Human-readable description
    resolution: string         // Suggested action to resolve
  }
}
```

**Standard Error Codes:**
| Code | Condition | Resolution Suggestion |
|------|-----------|----------------------|
| WORKSPACE_NOT_FOUND | workspaceRoot directory does not exist | "Verify the workspace path exists and is accessible" |
| FILE_NOT_FOUND | Specified file does not exist | "Check that the file path is correct and the file exists" |
| INVALID_POSITION | Line/column is out of bounds | "Verify the position is within the file bounds" |
| NO_SYMBOL_AT_POSITION | Position does not contain a symbol | "Position the cursor on a symbol (identifier, type name, etc.)" |
| RENAME_CONFLICT | New name conflicts with existing symbol | "Choose a different name that doesn't conflict with existing symbols in scope" |
| CONFIG_NOT_FOUND | No tsconfig.json or jsconfig.json found | "Create a tsconfig.json or jsconfig.json in your project root" |
| LANGUAGE_SERVER_ERROR | Internal language server failure | "Retry the operation. If persistent, check project configuration" |

**Acceptance Criteria:**
- AC-1.7.1: All error responses include code, message, and resolution fields
- AC-1.7.2: Error codes are consistent and documented
- AC-1.7.3: Resolution suggestions are actionable and specific to the error

### FS-001.8: Partial Failure Handling

**Description:** Operations that can partially succeed must return available results along with failure information.

**Acceptance Criteria:**
- AC-1.8.1: find_references returns partial results when some files cannot be processed
- AC-1.8.2: get_diagnostics (project-wide) returns partial results when some files fail
- AC-1.8.3: Failures are reported with file path and reason
- AC-1.8.4: Success flag is true if any results were obtained

---

## Business Rules

### BS-001.1: File Path Convention

**Rule:** All file paths in inputs and outputs are relative to the workspaceRoot, except for external definitions (node_modules, .d.ts from dependencies).

**Rationale:** Relative paths make responses portable and easier for Claude Code to work with across different environments.

**Examples:**
- Input: `filePath: "src/utils/helpers.ts"`
- Output: `filePath: "src/utils/helpers.ts"` (project file)
- Output: `filePath: "/absolute/path/to/node_modules/@types/node/index.d.ts"` (external, marked isExternal: true)

### BS-001.2: Position Indexing

**Rule:** Line and column numbers use 1-based indexing.

**Rationale:** Matches human-readable line numbers displayed in editors and terminal output.

**Examples:**
- First character of first line: `{ line: 1, column: 1 }`
- Third character of second line: `{ line: 2, column: 3 }`

### BS-001.3: Result Ordering for References

**Rule:** References are returned with definition/declaration first, followed by usages sorted alphabetically by file path.

**Rationale:** Definition is typically the most important result; alphabetical ordering provides predictable, reproducible results.

### BS-001.4: External Modification Boundary

**Rule:** rename_symbol must not modify any files outside the workspaceRoot directory.

**Rationale:** Prevents unintended modifications to dependencies or unrelated projects.

### BS-001.5: Result Limits

**Rule:** find_references returns a maximum of 500 results by default, with truncated flag indicating if more exist.

**Rationale:** Prevents overwhelming responses while providing useful information about result completeness.

---

## Data Requirements

### DR-001.1: Position Data

Every tool that operates on a specific code location requires:
- **line:** Integer (1-indexed), the line number in the file
- **column:** Integer (1-indexed), the column position on the line

### DR-001.2: Code Snippet Data

When code snippets are returned, they include:
- The single line of code containing the symbol or diagnostic
- Original indentation preserved

### DR-001.3: Workspace Configuration

The workspaceRoot must point to a directory that:
- Exists and is readable
- Contains the project source files
- Contains (or has parent containing) tsconfig.json or jsconfig.json, or defaults will be used

---

## Edge Cases

### EC-001.1: No Config File

**Scenario:** Project has no tsconfig.json or jsconfig.json.

**Behavior:** System uses default configuration:
- Treat files as ES modules
- Include all supported file extensions in the workspace
- Use permissive type checking

### EC-001.2: Syntax Errors in File

**Scenario:** Target file contains syntax errors.

**Behavior:** Tools continue to function with available information. Results may be incomplete. get_diagnostics will report the syntax errors.

### EC-001.3: Symbol in Comment or String

**Scenario:** Position points to a symbol name that appears inside a comment or string literal.

**Behavior:** Return NO_SYMBOL_AT_POSITION error, as these are not actual symbol references.

### EC-001.4: Very Large Projects

**Scenario:** Project contains thousands of files.

**Behavior:**
- Cold start time is acceptable (no specific target)
- Subsequent operations use cached project state
- Result limits prevent overwhelming responses

### EC-001.5: Files Outside tsconfig Include

**Scenario:** Requested file is not included in tsconfig.json include patterns.

**Behavior:** System attempts to process the file anyway. If unable, returns appropriate error with resolution suggesting tsconfig configuration update.

---

## Dependencies

### Internal Dependencies
- None (this is a foundational specification)

### External Dependencies
- Language Server Protocol support for TypeScript/JavaScript
- Access to file system for reading source files and writing modifications

---

## Future Considerations

The following items are explicitly out of scope for v1 but may be considered for future versions:

- Support for additional language servers (Python, Go, etc.)
- Advanced refactoring operations (extract function, move to file)
- Real-time file watching and automatic refresh
- Dirty buffer support (unsaved file modifications)
- Configurable result limits
- Pagination for large result sets

---

## Appendix: Tool Summary

| Tool | Purpose | Modifies Files |
|------|---------|----------------|
| find_references | Locate all references to a symbol | No |
| go_to_definition | Navigate to symbol definition | No |
| rename_symbol | Rename symbol across project | Yes |
| get_diagnostics | Get compilation errors/warnings | No |
