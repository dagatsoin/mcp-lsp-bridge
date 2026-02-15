#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Benchmark: Claude (grep/edit) vs MCP-LSP Bridge (tsserver)
#
# Compares execution time when the symbol location is already known.
# Supports two calling modes:
#
#   Automatic (discovers coordinates from Type.property):
#     ./benchmark/run.sh ~/dev/my-app Book.universeId contextId
#
#   Explicit (provide exact coordinates):
#     ./benchmark/run.sh ~/dev/my-app packages/shared/src/index.ts 63 5 contextId
# ──────────────────────────────────────────────

print_usage() {
  echo "Usage:"
  echo "  $0 <project-path> <Type.property> <new-name>"
  echo "  $0 <project-path> <file-path> <line> <column> <new-name>"
  echo ""
  echo "Examples:"
  echo "  $0 ~/dev/my-app Book.universeId contextId"
  echo "  $0 ~/dev/my-app packages/shared/src/index.ts 63 5 contextId"
  exit 1
}

if [[ $# -lt 3 ]]; then
  print_usage
fi

WORKSPACE="$(cd "$1" && pwd)"

# ──────────────────────────────────────────────
# Detect calling mode: Type.property (3 args) or explicit (5 args)
# ──────────────────────────────────────────────
if [[ $# -eq 3 ]]; then
  # Auto-discovery mode: <project> <Type.property> <new-name>
  SYMBOL="$2"
  NEW_NAME="$3"

  TYPE="${SYMBOL%%.*}"
  PROPERTY="${SYMBOL#*.}"

  if [[ "$TYPE" == "$PROPERTY" ]]; then
    echo "Error: symbol must be Type.property (e.g. Book.universeId)"
    exit 1
  fi

  echo "Discovering coordinates for $TYPE.$PROPERTY..."

  # Find the type/interface definition
  DEFINITION=$(grep -rn --include='*.ts' --include='*.tsx' \
    -E "(type|interface)\s+$TYPE\s*(\{|=)" "$WORKSPACE" \
    --exclude-dir=node_modules --exclude-dir=.yalc --exclude-dir=dist \
    | head -1)

  if [[ -z "$DEFINITION" ]]; then
    echo "Error: could not find type/interface '$TYPE'"
    exit 1
  fi

  DEF_FILE=$(echo "$DEFINITION" | cut -d: -f1)
  DEF_LINE=$(echo "$DEFINITION" | cut -d: -f2)

  # Search for the property within the next 50 lines of the type definition
  PROP_MATCH=$(sed -n "$((DEF_LINE)),$(( DEF_LINE + 50 ))p" "$DEF_FILE" \
    | grep -n -m1 "[[:space:]]${PROPERTY}[?:;]")

  if [[ -z "$PROP_MATCH" ]]; then
    echo "Error: could not find property '$PROPERTY' in $TYPE definition"
    exit 1
  fi

  PROP_OFFSET=$(echo "$PROP_MATCH" | cut -d: -f1)
  LINE=$(( DEF_LINE + PROP_OFFSET - 1 ))

  # Get the file-relative path and column
  FILE_PATH="${DEF_FILE#"$WORKSPACE/"}"
  LINE_CONTENT=$(sed -n "${LINE}p" "$DEF_FILE")
  # Find column where the property name starts (1-based)
  COLUMN=$(echo "$LINE_CONTENT" | grep -ob "$PROPERTY" | head -1 | cut -d: -f1)
  COLUMN=$(( COLUMN + 1 ))  # grep -ob is 0-based, we need 1-based

  echo "  Found: $FILE_PATH:$LINE:$COLUMN"
  echo ""

elif [[ $# -eq 5 ]]; then
  # Explicit mode: <project> <file> <line> <column> <new-name>
  FILE_PATH="$2"
  LINE="$3"
  COLUMN="$4"
  NEW_NAME="$5"
else
  print_usage
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

now_ms() { python3 -c 'import time; print(int(time.time()*1000))'; }

# Read the symbol name from the file for display
SYMBOL_NAME=$(sed -n "${LINE}p" "$WORKSPACE/$FILE_PATH" | awk -v col="$COLUMN" '{print substr($0, col)}' | grep -oE '^[a-zA-Z_][a-zA-Z0-9_]*')

# Prompts — coordinates are given, no search needed
TASK_FIND_MANUAL="Find all references to the symbol \"$SYMBOL_NAME\" defined at $FILE_PATH line $LINE in this TypeScript project. For each reference, tell me the file path, line number, and whether it is a declaration or a usage. The workspace root is: $WORKSPACE"
TASK_FIND_MCP="Call the find_references tool with workspaceRoot \"$WORKSPACE\", filePath \"$FILE_PATH\", line $LINE, column $COLUMN."

TASK_RENAME_MANUAL="Rename the symbol \"$SYMBOL_NAME\" defined at $FILE_PATH line $LINE to \"$NEW_NAME\" across this entire TypeScript project. Update every file that references it. The workspace root is: $WORKSPACE"
TASK_RENAME_MCP="Call the rename_symbol tool with workspaceRoot \"$WORKSPACE\", filePath \"$FILE_PATH\", line $LINE, column $COLUMN, newName \"$NEW_NAME\"."

# MCP config
MCP_CONFIG="$TMPDIR/mcp.json"
node -e '
const [outFile, distPath, workspace] = process.argv.slice(1);
const c = { mcpServers: { "mcp-lsp-bridge": { command: "node", args: [distPath, "--workspace", workspace] } } };
require("fs").writeFileSync(outFile, JSON.stringify(c));
' "$MCP_CONFIG" "$PROJECT_ROOT/dist/index.js" "$WORKSPACE"

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
    // Real-session cost: cache reads instead of cache creation (one-time per session)
    const costSession = ((inputTokens * 15 + cacheRead * 1.875 + outputTokens * 75) / 1e6).toFixed(3);
    // Benchmark cost: includes one-time cache creation overhead
    const costBench = ((inputTokens * 15 + cacheRead * 1.5 + cacheCreate * 18.75 + outputTokens * 75) / 1e6).toFixed(3);
    process.stdout.write(timeSec + "|" + tools + "|" + tokens + "|" + costSession + "|" + costBench);
  ' "$TMPDIR/$name.json" "$time_ms"
}

# ──────────────────────────────────────────────
print_table() {
  local label="$1" manual="$2" mcp="$3"

  IFS='|' read -r m_time m_tools m_tokens m_cost m_costB <<< "$(extract_metrics "$manual")"
  IFS='|' read -r b_time b_tools b_tokens b_cost b_costB <<< "$(extract_metrics "$mcp")"

  echo ""
  echo "  $label"
  echo "  ┌──────────────┬──────────────┬──────────────┐"
  printf "  │ %-12s │ %12s │ %12s │\n" "Metric" "Claude" "MCP Bridge"
  echo "  ├──────────────┼──────────────┼──────────────┤"
  printf "  │ %-12s │ %11ss │ %11ss │\n" "Time" "$m_time" "$b_time"
  printf "  │ %-12s │ %12s │ %12s │\n" "Tool calls" "$m_tools" "$b_tools"
  printf "  │ %-12s │ %12s │ %12s │\n" "Tokens" "$m_tokens" "$b_tokens"
  printf "  │ %-12s │ %11s$ │ %11s$ │\n" "Est. cost*" "$m_cost" "$b_cost"
  echo "  └──────────────┴──────────────┴──────────────┘"
}

# ═══════════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo " mcp-lsp-bridge benchmark"
echo " Project:  $WORKSPACE"
echo " Symbol:   $SYMBOL_NAME at $FILE_PATH:$LINE:$COLUMN"
echo " Rename:   $SYMBOL_NAME → $NEW_NAME"
echo "═══════════════════════════════════════════"
echo ""
echo " Methodology:"
echo "   Both approaches start with known symbol coordinates."
echo "   - Claude: uses grep to find references, then reads/edits each file"
echo "   - MCP Bridge: one semantic tsserver call handles everything"
echo "   Each test runs 'claude -p' (isolated session, Opus model)."
echo "   Cost shown is per-call in a warm session (cached context)."
echo ""

# TEST 1: Find References
echo "Test 1: Find References ($SYMBOL_NAME)"
echo "$TASK_FIND_MANUAL" | run_benchmark "find-manual" \
  --allowedTools "Bash" "Glob" "Grep" "Read"
echo "$TASK_FIND_MCP" | run_benchmark "find-mcp" \
  --allowedTools "mcp__mcp-lsp-bridge__find_references" \
  --mcp-config "$MCP_CONFIG"

# TEST 2: Rename Symbol
echo ""
echo "Test 2: Rename Symbol ($SYMBOL_NAME → $NEW_NAME)"
echo "$TASK_RENAME_MANUAL" | run_benchmark "rename-manual" \
  --allowedTools "Bash" "Glob" "Grep" "Read" "Edit" "Write"

echo "  Resetting workspace..."
git -C "$WORKSPACE" checkout -- . 2>/dev/null

echo "$TASK_RENAME_MCP" | run_benchmark "rename-mcp" \
  --allowedTools "mcp__mcp-lsp-bridge__rename_symbol" \
  --mcp-config "$MCP_CONFIG"

echo "  Resetting workspace..."
git -C "$WORKSPACE" checkout -- . 2>/dev/null

# ═══════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════"
echo " Results"
echo "═══════════════════════════════════════════"

print_table "Find References ($SYMBOL_NAME)" "find-manual" "find-mcp"
print_table "Rename ($SYMBOL_NAME → $NEW_NAME)" "rename-manual" "rename-mcp"

echo ""
echo "  * Cost estimates assume a warm session (cache reads, not creation)."
echo "    Each claude -p run pays a one-time cache creation overhead (~\$1-2)"
echo "    that does not apply in real Claude Code sessions where context is cached."
echo ""
