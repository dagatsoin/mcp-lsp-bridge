# Todo App - MCP-LSP Bridge Test Project

A simple TypeScript project for testing MCP-LSP Bridge tools.

## Rename Comparison: Manual vs MCP-LSP Bridge

Task: Rename `Todo.completed` to `Todo.done` across 4 files (14 occurrences)

### Results

| Metric | Manual (Grep + Read + Edit) | MCP-LSP Bridge (rename_symbol) | Improvement |
|--------|----------------------------|-------------------------------|-------------|
| **Time** | 34.9 seconds | 10.6 seconds | **3.3x faster** |
| **Tool calls** | 16 | 1 | **16x fewer** |
| **Context tokens** | ~4,500 | ~200 | **22x fewer** |
| **Files read** | 4 | 0 | - |
| **Edit operations** | 11 | 0 (internal) | - |
| **Type-aware** | No (regex) | Yes (semantic) | - |
| **Error risk** | Higher | Lower | - |

### Timing Breakdown

#### Manual Approach: 34.9 seconds

| Step | Tool Calls | Time Component |
|------|------------|----------------|
| Grep (find occurrences) | 1 | Search + LLM analysis |
| Read (4 files) | 4 | File I/O + context loading |
| Edit (11 changes) | 11 | 11 round trips + LLM reasoning |
| **Total** | **16** | **~35 sec** |

#### MCP-LSP Bridge: 10.6 seconds

| Step | Tool Calls | Time Component |
|------|------------|----------------|
| rename_symbol | 1 | tsserver analysis + file writes |
| **Total** | **1** | **~10.6 sec** |

### Key Benefits of MCP-LSP Bridge

1. **3.3x faster** - Single round-trip vs 16 sequential operations
2. **22x fewer tokens** - Dramatically reduces context window usage
3. **16x fewer tool calls** - Less latency overhead
4. **Type-aware renaming** - Only renames the exact symbol, not string matches
5. **No false positives** - Correctly preserved `TodoFilter.completed` (different type)
6. **Atomic operation** - All changes applied together or none

### Semantic Accuracy

The manual approach required careful analysis to avoid renaming `TodoFilter.completed`
(a different property that happens to share the same name). The MCP-LSP Bridge
automatically handles this through TypeScript's type system.

### Cost Implications

With typical LLM pricing (~$15/million input tokens, ~$60/million output tokens):

| Approach | Est. Token Cost | Time Cost |
|----------|-----------------|-----------|
| Manual | ~$0.07 | 35 sec |
| MCP-LSP | ~$0.003 | 10.6 sec |
| **Savings** | **~96%** | **~70%** |

*Note: Actual costs vary by model and provider. Time includes LLM inference + tool execution.*
