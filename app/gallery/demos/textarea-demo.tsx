"use client"

import * as React from "react"
import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { Textarea } from "@/registry/aurora/ui/textarea"

const lbl: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--aurora-text-muted)",
  margin: "0 0 12px",
}

const stack: React.CSSProperties = { marginBottom: 26 }

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 20,
}

/** Field label + optional hint — the standard form-row chrome. */
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          margin: "0 0 8px",
          fontSize: 12,
          fontWeight: 560,
          color: "var(--aurora-text-primary)",
        }}
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--aurora-text-muted)",
          }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default function TextareaDemo() {
  // Auto-resize field, controlled so it grows as you type.
  const [prompt, setPrompt] = React.useState(
    "Crawl docs.rs/serde, embed the pages, and summarize how the derive macro expands.\n\nThen open a PR against the axon index config."
  )

  // Character-count field, controlled so the counter tracks live edits.
  const [summary, setSummary] = React.useState(
    "Restart the qdrant container on devhost and re-run the health check."
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <GalleryPageIntro
        eyebrow="Forms"
        heading="Textarea"
        description="Multi-line input that can auto-grow to fit its content, with an optional live character counter pinned to the corner. Focus lifts a cyan glow ring; validation states recolor the border and ring."
      />

      <div>
        <div style={lbl}>Default</div>
        <div style={stack}>
          <Textarea placeholder="Describe the task…" rows={3} />
        </div>

        <div style={lbl}>With label + hint</div>
        <div style={stack}>
          <Field
            label="Release Notes"
            hint="Markdown supported. Drag the bottom edge to resize."
          >
            <Textarea
              placeholder="What changed in this release?"
              defaultValue={
                "- Badge demo now covers the full API\n- Catalog tiles are no longer buttons"
              }
            />
          </Field>
        </div>

        <div style={lbl}>Auto-resize · grows as you type</div>
        <div style={stack}>
          <Field
            label="Task for the Agent"
            hint="autoResize — the field re-measures on every keystroke and never scrolls."
          >
            <Textarea
              autoResize
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the task…"
            />
          </Field>
        </div>

        <div style={lbl}>Character count</div>
        <div style={stack}>
          <div style={grid}>
            <Field label="Controlled · Live Counter">
              <Textarea
                showCount
                maxLength={140}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One-line summary…"
              />
            </Field>
            <Field label="Auto-Resize + Count">
              <Textarea
                autoGrow
                showCount
                maxLength={280}
                defaultValue="Embed the whole docs site and answer questions with citations."
                placeholder="Describe the task…"
              />
            </Field>
          </div>
        </div>

        <div style={lbl}>Validation states</div>
        <div style={stack}>
          <div style={grid}>
            <Field label="Success" hint="state=&quot;success&quot; — teal ring">
              <Textarea
                state="success"
                rows={3}
                defaultValue="All checks passed. Ready to merge."
              />
            </Field>
            <Field label="Warning" hint="state=&quot;warn&quot; — sand ring">
              <Textarea
                state="warn"
                rows={3}
                defaultValue="This will overwrite the existing index config."
              />
            </Field>
            <Field label="Error" hint="state=&quot;error&quot; — rose ring">
              <Textarea
                state="error"
                rows={3}
                defaultValue="Prompt exceeds the model context window."
              />
            </Field>
          </div>
        </div>

        <div style={lbl}>Error alias · count</div>
        <div style={stack}>
          <Field
            label="Commit Message"
            hint="The error boolean is a shorthand for state=&quot;error&quot;."
          >
            <Textarea
              error
              showCount
              maxLength={72}
              defaultValue="fix: the qdrant container on devhost kept dropping its collection after a restart because the volume mount drifted"
            />
          </Field>
        </div>

        <div style={lbl}>Read-only &amp; disabled</div>
        <div style={{ ...stack, marginBottom: 0 }}>
          <div style={grid}>
            <Field label="Read-only" hint="Value is selectable but not editable.">
              <Textarea
                readOnly
                rows={4}
                defaultValue={
                  "$ npx shadcn@latest add \\\n  https://aurora.tootie.tv/r/textarea.json"
                }
              />
            </Field>
            <Field label="Disabled" hint="Dimmed and non-interactive.">
              <Textarea
                disabled
                rows={4}
                defaultValue="Locked while the agent is running…"
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  )
}
