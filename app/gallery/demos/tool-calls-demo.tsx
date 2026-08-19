"use client"

import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { ToolCalls, type ToolCall } from "@/registry/aurora/blocks/ai/tool-calls/tool-calls"

// The ToolCalls block renders an agent action timeline. Consecutive calls to the
// SAME `tool` name collapse into one counted, expandable group; every row expands
// to structured `args` (input) and `result` (output). Status is one of
// "running" | "completed" | "error" — a group inherits error > running > completed.
// Duration only renders when both startedAt and completedAt are present.

const now = new Date()

// Helper: a completed call that ran between `start`ms and `end`ms ago.
const span = (start: number, end: number) => ({
  startedAt: new Date(now.getTime() - start),
  completedAt: new Date(now.getTime() - end),
})

// Helper: a still-running call started `start`ms ago (no completedAt → no duration).
const since = (start: number) => ({
  startedAt: new Date(now.getTime() - start),
})

const lbl: React.CSSProperties = {
  fontFamily: "var(--aurora-font-sans)",
  fontSize: 11,
  fontWeight: 650,
  letterSpacing: "var(--aurora-letter-eyebrow)",
  textTransform: "uppercase",
  color: "var(--aurora-text-muted)",
}

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: "26px 30px",
  borderRadius: "var(--aurora-radius-2)",
  border: "1px solid var(--aurora-border-strong)",
  background: "var(--aurora-page-bg)",
  boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)",
}

const captionStyle: React.CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.55,
  color: "var(--aurora-text-muted)",
  maxWidth: "62ch",
}

// ── An Axon RAG agent answering "how does hybrid search rank results?" ──
// Three consecutive axon.search calls collapse into one counted group, then a
// long-running crawl, a doc read, and an LLM synthesis close the turn.
const RAG_SESSION: ToolCall[] = [
  {
    id: "rag-1",
    tool: "axon.search",
    status: "completed",
    args: { query: "qdrant hybrid search dense sparse fusion", top_k: 8 },
    result: "8 hits · top score 0.86 · 3 new URLs auto-indexed",
    ...span(9200, 8100),
  },
  {
    id: "rag-2",
    tool: "axon.search",
    status: "completed",
    args: { query: "reciprocal rank fusion RRF weighting" },
    result: "6 hits · top score 0.79",
    ...span(8000, 7100),
  },
  {
    id: "rag-3",
    tool: "axon.search",
    status: "completed",
    args: { query: "BM25 sparse vector qdrant named vectors" },
    result: "5 hits · top score 0.74",
    ...span(7000, 6300),
  },
  {
    id: "rag-4",
    tool: "axon.crawl",
    status: "completed",
    args: {
      url: "https://qdrant.tech/documentation/concepts/hybrid-queries/",
      depth: 2,
      max_pages: 24,
    },
    result: "18 pages fetched · 214 chunks embedded via TEI (Qwen3-0.6B)",
    ...span(6200, 2400),
  },
  {
    id: "rag-5",
    tool: "axon.ask",
    status: "running",
    args: {
      question: "How does hybrid search rank results?",
      rerank: true,
      model: "gemini-cli",
    },
    ...since(1900),
  },
]

// ── A homelab troubleshooting agent (Labby gateway → shell + arr stack) ──
// Mixed tools, mixed outcomes: a shell probe, a repeated docker inspect group,
// a failing API fetch, and a recovery write.
const TROUBLESHOOT_SESSION: ToolCall[] = [
  {
    id: "ops-1",
    tool: "shell.exec",
    status: "completed",
    args: { host: "nashost", command: "docker ps --filter name=sonarr --format '{{.Status}}'" },
    result: "Up 3 hours (unhealthy)",
    ...span(14000, 13400),
  },
  {
    id: "ops-2",
    tool: "arcane.container.inspect",
    status: "completed",
    args: { host: "nashost", name: "sonarr" },
    result: "State.Health.FailingStreak = 6 · last probe: connection refused :8989",
    ...span(13300, 12600),
  },
  {
    id: "ops-3",
    tool: "arcane.container.inspect",
    status: "completed",
    args: { host: "nashost", name: "prowlarr" },
    result: "State.Health = healthy · 4 indexers online",
    ...span(12500, 11900),
  },
  {
    id: "ops-4",
    tool: "sonarr.api.get",
    status: "error",
    args: { endpoint: "/api/v3/health", host: "nashost", port: 8989 },
    result: "FetchError: ECONNREFUSED 198.51.100.2:8989 — API not accepting connections",
    ...span(11800, 11500),
  },
  {
    id: "ops-5",
    tool: "cortex.logs.search",
    status: "completed",
    args: { host: "nashost", container: "sonarr", query: "level:error", since: "15m" },
    result: "3 matches · 'System.Data.SQLite.SQLiteException: database is locked'",
    ...span(11400, 10200),
  },
  {
    id: "ops-6",
    tool: "arcane.container.restart",
    status: "running",
    args: { host: "nashost", name: "sonarr", timeout_s: 30 },
    ...since(2600),
  },
]

// ── A code-editing agent turn (read → grep → write → verify) ──
// Each tool distinct, so every row stands alone (no grouping) — shows the
// single-row shape and how a failing verification surfaces in rose.
const EDIT_SESSION: ToolCall[] = [
  {
    id: "edit-1",
    tool: "fs.read",
    status: "completed",
    args: { path: "registry/aurora/styles/aurora.css", range: "1-40" },
    result: "40 lines · :root token layer (--aurora-accent-primary …)",
    ...span(5400, 5000),
  },
  {
    id: "edit-2",
    tool: "grep.search",
    status: "completed",
    args: { pattern: "--aurora-accent-strong", glob: "registry/**/*.tsx" },
    result: "11 matches across 7 files",
    ...span(4900, 4300),
  },
  {
    id: "edit-3",
    tool: "fs.write",
    status: "completed",
    args: {
      path: "registry/aurora/styles/aurora.css",
      diff: "+  --aurora-accent-strong: var(--aurora-accent-primary);",
    },
    result: "1 insertion(+) · token added to :root",
    ...span(4200, 3900),
  },
  {
    id: "edit-4",
    tool: "shell.exec",
    status: "error",
    args: { command: "pnpm registry:build" },
    result: "Error: registry/aurora item 'aurora-tokens' failed schema validation — duplicate cssVars key",
    ...span(3800, 1200),
  },
]

export default function ToolCallsDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <GalleryPageIntro
        eyebrow="AI elements / tool-calls"
        heading="ToolCalls"
        description="A grouped agent action timeline. Consecutive calls to the same tool collapse into a single counted row; every row expands to its structured input and result, with a live spinner while running, a green dot on success, and rose on error."
      />

      <section style={sectionStyle}>
        <span style={lbl}>RAG agent · axon.search grouping + running synthesis</span>
        <p style={captionStyle}>
          An Axon turn answering a retrieval question. Three consecutive
          <code style={{ fontFamily: "var(--aurora-font-mono)" }}> axon.search</code> calls
          collapse into one counted group; a long crawl, then a still-running
          <code style={{ fontFamily: "var(--aurora-font-mono)" }}> axon.ask</code> synthesis
          spins at the tail. Expand any row for structured input and result.
        </p>
        <ToolCalls calls={RAG_SESSION} />
      </section>

      <section style={sectionStyle}>
        <span style={lbl}>Homelab ops · mixed tools, one failure, live recovery</span>
        <p style={captionStyle}>
          A gateway agent diagnosing an unhealthy Sonarr container on nashost: a
          shell probe, a repeated container inspect (grouped), a failed API fetch
          rendered in rose, a log search that finds the root cause, and a restart
          still in flight.
        </p>
        <ToolCalls calls={TROUBLESHOOT_SESSION} />
      </section>

      <section style={sectionStyle}>
        <span style={lbl}>Code edit · every tool distinct — single rows</span>
        <p style={captionStyle}>
          A file-editing turn where each tool differs, so nothing groups and each
          call is its own pill. The closing
          <code style={{ fontFamily: "var(--aurora-font-mono)" }}> pnpm registry:build</code> fails
          schema validation, showing how an error result reads in the expanded card.
        </p>
        <ToolCalls calls={EDIT_SESSION} />
      </section>

      <section style={sectionStyle}>
        <span style={lbl}>Empty state · no calls yet</span>
        <p style={captionStyle}>
          Before the agent acts, the block renders its quiet empty state.
        </p>
        <ToolCalls calls={[]} />
      </section>
    </div>
  )
}
