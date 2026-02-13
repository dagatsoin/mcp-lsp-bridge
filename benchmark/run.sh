#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Usage: ./benchmark/run.sh <project-path> <symbol> <new-name>
#
# Example:
#   ./benchmark/run.sh ~/dev/my-app Book.universeId contextId
#
# This will:
#   1. Find all references to "universeId" on the "Book" type
#   2. Rename "universeId" to "contextId" across the project
#   and compare Claude (grep/edit) vs MCP Bridge (tsserver)
# ──────────────────────────────────────────────

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <project-path> <symbol> <new-name>"
  echo ""
  echo "  project-path  Path to a TypeScript project (with tsconfig.json)"
  echo "  symbol        Type.property to find and rename (e.g. Book.universeId)"
  echo "  new-name      New property name (e.g. contextId)"
  echo ""
  echo "Example:"
  echo "  $0 ~/dev/my-app Book.universeId contextId"
  exit 1
fi

WORKSPACE="$(cd "$1" && pwd)"
SYMBOL="$2"
NEW_NAME="$3"

# Parse Type.property
TYPE="${SYMBOL%%.*}"
PROPERTY="${SYMBOL#*.}"

if [[ "$TYPE" == "$PROPERTY" ]]; then
  echo "Error: symbol must be Type.property (e.g. Book.universeId)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

now_ms() { python3 -c 'import time; print(int(time.time()*1000))'; }

# Prompts
TASK_FIND="Find all references to the $PROPERTY property of the $TYPE type in this TypeScript project. For each reference, tell me the file path, line number, and whether it is a declaration or a usage. The workspace root is: $WORKSPACE"
TASK_RENAME="Rename the $PROPERTY property of the $TYPE type to $NEW_NAME across this entire TypeScript project. Update every file that references it. The workspace root is: $WORKSPACE"

# MCP config
MCP_CONFIG="$TMPDIR/mcp.json"
node -e '
const [outFile, distPath] = process.argv.slice(1);
const c = { mcpServers: { "mcp-lsp-bridge": { command: "node", args: [distPath] } } };
require("fs").writeFileSync(outFile, JSON.stringify(c));
' "$MCP_CONFIG" "$PROJECT_ROOT/dist/index.js"

# Build
echo "Building mcp-lsp-bridge..."
(cd "$PROJECT_ROOT" && npm run build) > /dev/null 2>&1
echo ""

# ──────────────────────────────────────────────
run_benchmark() {
  local name="$1"; shift
  local task; task=$(cat)

  echo -n "  Running $name..."
  local start end
  start=$(now_ms)

  env -u CLAUDECODE claude -p \
    --output-format json \
    --model opus \
    --verbose \
    "$@" \
    <<< "$task" \
    > "$TMPDIR/$name.json" 2>/dev/null || true

  end=$(now_ms)
  echo "$(( end - start ))" > "$TMPDIR/$name.time"
  echo " done"
}

# ──────────────────────────────────────────────
extract_metrics() {
  local name="$1"
  local time_ms; time_ms=$(cat "$TMPDIR/$name.time")

  node -e '
    const fs = require("fs");
    const [jsonFile, timeMs] = process.argv.slice(1);
    const raw = fs.readFileSync(jsonFile, "utf-8").trim();
    let msgs;
    try { msgs = JSON.parse(raw); } catch { msgs = raw.split("\n").filter(l=>l.trim()).map(l=>JSON.parse(l)); }
    if (!Array.isArray(msgs)) msgs = [msgs];

    let tools = 0;
    const usageById = new Map();
    for (const m of msgs) {
      const msg = m.message || m;
      const content = msg.content;
      const usage = msg.usage;
      const isAssistant = m.type === "assistant" || msg.role === "assistant";

      if (isAssistant && Array.isArray(content)) {
        tools += content.filter(c => c.type === "tool_use").length;
        if (usage && msg.id) usageById.set(msg.id, usage);
      }
    }
    let inputTokens = 0, outputTokens = 0, cacheRead = 0, cacheCreate = 0;
    for (const usage of usageById.values()) {
      inputTokens += usage.input_tokens || 0;
      outputTokens += usage.output_tokens || 0;
      cacheRead += usage.cache_read_input_tokens || 0;
      cacheCreate += usage.cache_creation_input_tokens || 0;
    }

    const timeSec = (Number(timeMs) / 1000).toFixed(1);
    const tokens = inputTokens + outputTokens;
    const cost = ((inputTokens * 15 + cacheRead * 1.5 + cacheCreate * 18.75 + outputTokens * 75) / 1e6).toFixed(3);
    process.stdout.write(timeSec + "|" + tools + "|" + tokens + "|" + cost);
  ' "$TMPDIR/$name.json" "$time_ms"
}

# ──────────────────────────────────────────────
print_table() {
  local label="$1" manual="$2" mcp="$3"

  IFS='|' read -r m_time m_tools m_tokens m_cost <<< "$(extract_metrics "$manual")"
  IFS='|' read -r b_time b_tools b_tokens b_cost <<< "$(extract_metrics "$mcp")"

  echo ""
  echo "  $label"
  echo "  ┌──────────────┬──────────────┬──────────────┐"
  printf "  │ %-12s │ %12s │ %12s │\n" "Metric" "Claude" "MCP Bridge"
  echo "  ├──────────────┼──────────────┼──────────────┤"
  printf "  │ %-12s │ %11ss │ %11ss │\n" "Time" "$m_time" "$b_time"
  printf "  │ %-12s │ %12s │ %12s │\n" "Tool calls" "$m_tools" "$b_tools"
  printf "  │ %-12s │ %12s │ %12s │\n" "Tokens" "$m_tokens" "$b_tokens"
  printf "  │ %-12s │ %11s$ │ %11s$ │\n" "Est. cost" "$m_cost" "$b_cost"
  echo "  └──────────────┴──────────────┴──────────────┘"
}

# ═══════════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo " mcp-lsp-bridge benchmark"
echo " Project: $WORKSPACE"
echo " Symbol:  $TYPE.$PROPERTY → $NEW_NAME"
echo "═══════════════════════════════════════════"
echo ""

# TEST 1: Find References
echo "Test 1: Find References ($TYPE.$PROPERTY)"
echo "$TASK_FIND" | run_benchmark "find-manual" \
  --allowedTools "Bash" "Glob" "Grep" "Read"
echo "$TASK_FIND" | run_benchmark "find-mcp" \
  --allowedTools "mcp__mcp-lsp-bridge__find_references" \
  --mcp-config "$MCP_CONFIG"

# TEST 2: Rename Symbol
echo ""
echo "Test 2: Rename Symbol ($TYPE.$PROPERTY → $TYPE.$NEW_NAME)"
echo "$TASK_RENAME" | run_benchmark "rename-manual" \
  --allowedTools "Bash" "Glob" "Grep" "Read" "Edit" "Write"

echo "  Resetting workspace..."
git -C "$WORKSPACE" checkout -- . 2>/dev/null

echo "$TASK_RENAME" | run_benchmark "rename-mcp" \
  --allowedTools "mcp__mcp-lsp-bridge__rename_symbol" \
  --mcp-config "$MCP_CONFIG"

echo "  Resetting workspace..."
git -C "$WORKSPACE" checkout -- . 2>/dev/null

# ═══════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════"
echo " Results"
echo "═══════════════════════════════════════════"

print_table "Find References ($TYPE.$PROPERTY)" "find-manual" "find-mcp"
print_table "Rename ($TYPE.$PROPERTY → $TYPE.$NEW_NAME)" "rename-manual" "rename-mcp"

echo ""
