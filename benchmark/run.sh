#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE="$PROJECT_ROOT/examples/todo-app"
RESULTS_DIR="$SCRIPT_DIR/results"
mkdir -p "$RESULTS_DIR"

# Timing helper (macOS compatible)
now_ms() {
  python3 -c 'import time; print(int(time.time()*1000))'
}

# Prompts
TASK_FIND="Find all references to the Todo interface in this TypeScript project. For each reference, tell me the file path, line number, and whether it is a declaration or a usage. The project root is: $WORKSPACE"
TASK_RENAME="Rename the Todo interface to TodoItem across the entire TypeScript project. Update every file that references it. The project root is: $WORKSPACE"

# MCP config pointing to local build
MCP_CONFIG_FILE="$RESULTS_DIR/_mcp_config.json"
node -e "
const config = {
  mcpServers: {
    'mcp-lsp-bridge': {
      command: 'node',
      args: ['$PROJECT_ROOT/dist/index.js']
    }
  }
};
require('fs').writeFileSync('$MCP_CONFIG_FILE', JSON.stringify(config, null, 2));
"

echo "MCP config written to $MCP_CONFIG_FILE"

# Build the project first
echo "Building mcp-lsp-bridge..."
(cd "$PROJECT_ROOT" && npm run build)
echo ""

# ──────────────────────────────────────────────
# run_benchmark <name> <extra_args...>
#   Reads prompt from stdin
# ──────────────────────────────────────────────
run_benchmark() {
  local name="$1"
  shift
  local task
  task=$(cat) # read from stdin

  echo "Running: $name"
  local start end elapsed
  start=$(now_ms)

  # Unset CLAUDECODE to allow nested Claude invocation
  env -u CLAUDECODE claude -p \
    --output-format json \
    --model opus \
    --verbose \
    "$@" \
    <<< "$task" \
    > "$RESULTS_DIR/$name.json" \
    2> "$RESULTS_DIR/$name.stderr" || true

  end=$(now_ms)
  elapsed=$(( end - start ))
  echo "$elapsed" > "$RESULTS_DIR/$name.time"
  echo "  Done in ${elapsed}ms"
}

# ──────────────────────────────────────────────
# extract_metrics <name>
# ──────────────────────────────────────────────
extract_metrics() {
  local name="$1"
  local time_ms
  time_ms=$(cat "$RESULTS_DIR/$name.time")

  node -e "
    const fs = require('fs');
    const raw = fs.readFileSync('$RESULTS_DIR/$name.json', 'utf-8').trim();
    let data;
    try {
      data = JSON.parse(raw);
      if (Array.isArray(data)) data = data[data.length - 1];
    } catch {
      const lines = raw.split('\n').filter(l => l.trim());
      data = JSON.parse(lines[lines.length - 1]);
    }

    const usage = data.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    const toolCalls = (data.tool_calls || []).length ||
      (Array.isArray(data) ? 0 : 0);

    // Count tool calls from the full conversation if verbose
    let tools = 0;
    if (Array.isArray(JSON.parse(raw))) {
      for (const msg of JSON.parse(raw)) {
        if (msg.role === 'assistant' && Array.isArray(msg.content)) {
          tools += msg.content.filter(c => c.type === 'tool_use').length;
        }
      }
    } else {
      tools = (data.tool_calls || []).length;
    }

    const timeSec = ($time_ms / 1000).toFixed(1);
    const cost = ((inputTokens * 15 + outputTokens * 75) / 1e6).toFixed(4);

    console.log('  Time: ' + timeSec + 's');
    console.log('  Tool calls: ' + tools);
    console.log('  Tokens: ' + totalTokens + ' (in: ' + inputTokens + ', out: ' + outputTokens + ')');
    console.log('  Est. cost: \$' + cost);
  "
}

# ═══════════════════════════════════════════════
# TEST 1: Find References
# ═══════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════"
echo " TEST 1: Find References (Todo interface)"
echo "═══════════════════════════════════════════"

echo ""
echo "--- Without MCP (Claude only) ---"
echo "$TASK_FIND" | run_benchmark "find-manual" \
  --allowedTools "Bash" "Glob" "Grep" "Read"

echo ""
echo "--- With MCP Bridge ---"
echo "$TASK_FIND" | run_benchmark "find-mcp" \
  --allowedTools "mcp__mcp-lsp-bridge__find_references" \
  --mcp-config "$MCP_CONFIG_FILE"

echo ""
echo "=== Find References Results ==="
echo ""
echo "Without MCP:"
extract_metrics "find-manual"
echo ""
echo "With MCP:"
extract_metrics "find-mcp"

# ═══════════════════════════════════════════════
# TEST 2: Rename Symbol
# ═══════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════"
echo " TEST 2: Rename Symbol (Todo → TodoItem)"
echo "═══════════════════════════════════════════"

echo ""
echo "--- Without MCP (Claude only) ---"
echo "$TASK_RENAME" | run_benchmark "rename-manual" \
  --allowedTools "Bash" "Glob" "Grep" "Read" "Edit" "Write"

# Reset workspace after manual rename
echo "  Resetting workspace..."
git -C "$PROJECT_ROOT" checkout -- "$WORKSPACE"

echo ""
echo "--- With MCP Bridge ---"
echo "$TASK_RENAME" | run_benchmark "rename-mcp" \
  --allowedTools "mcp__mcp-lsp-bridge__rename_symbol" \
  --mcp-config "$MCP_CONFIG_FILE"

# Reset workspace after MCP rename
echo "  Resetting workspace..."
git -C "$PROJECT_ROOT" checkout -- "$WORKSPACE"

echo ""
echo "=== Rename Symbol Results ==="
echo ""
echo "Without MCP:"
extract_metrics "rename-manual"
echo ""
echo "With MCP:"
extract_metrics "rename-mcp"

echo ""
echo "═══════════════════════════════════════════"
echo " Done! Results saved to $RESULTS_DIR"
echo "═══════════════════════════════════════════"
