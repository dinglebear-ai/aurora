"use client"

import * as React from "react"
import {
  SearchX,
  Search,
  RotateCcw,
  Inbox,
  Plus,
  CloudOff,
  RefreshCw,
  Rocket,
  BookOpen,
  FolderPlus,
  ShieldAlert,
  Filter,
} from "lucide-react"
import { EmptyState } from "@/registry/aurora/ui/empty-state"
import { Button } from "@/registry/aurora/ui/button"
import { Kbd } from "@/registry/aurora/ui/kbd"
import { GalleryPageIntro } from "@/components/gallery-page-intro"

const lbl: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--aurora-text-muted)",
  margin: "0 0 12px",
}

const stack: React.CSSProperties = { marginBottom: 26 }

// Two-column grid for showing several empty states side by side. Collapses to a
// single column on narrow viewports.
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 16,
  marginBottom: 26,
}

// A framed stage: dashed EmptyState sits inside a solid panel so it reads like a
// real empty region of an app, not a floating fragment.
const stage: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  padding: 20,
  borderRadius: "var(--aurora-radius-2)",
  border: "1px solid var(--aurora-border-strong)",
  background: "var(--aurora-page-bg)",
  boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)",
}

export default function EmptyStateDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <GalleryPageIntro
        eyebrow="Feedback"
        heading="Empty States"
        description="A missing thing paired with the next action — the placeholder for empty lists, no-result searches, failed loads, and first-run screens. Icon glyph, title, muted description, and one or two action buttons."
      />

      <div>
        {/* No search results — reset / adjust filter */}
        <div style={lbl}>No results · search</div>
        <div style={stack}>
          <div style={stage}>
            <EmptyState
              as="h2"
              icon={<SearchX size={24} aria-hidden />}
              title='No matches for "prowlarr timeout"'
              description="No log lines matched your query in the last 24h. Widen the range or clear the filter to see everything."
              action={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <Button variant="aurora" iconLeft={<Search size={14} aria-hidden />}>
                    Search All Time
                  </Button>
                  <Button variant="ghost" iconLeft={<RotateCcw size={14} aria-hidden />}>
                    Reset Filters
                  </Button>
                </div>
              }
            />
          </div>
        </div>

        {/* Empty list / inbox — primary create action */}
        <div style={lbl}>Empty list · primary create</div>
        <div style={stack}>
          <div style={stage}>
            <EmptyState
              as="h2"
              icon={<Inbox size={24} aria-hidden />}
              title="Your inbox is clear"
              description="No alerts are waiting. New notifications from your homelab hosts will land here."
              action={
                <Button variant="aurora" iconLeft={<Plus size={14} aria-hidden />}>
                  New Alert Rule
                  <Kbd variant="accent" style={{ marginLeft: 8 }}>
                    ⌘N
                  </Kbd>
                </Button>
              }
            />
          </div>
        </div>

        {/* Error / failed to load — retry */}
        <div style={lbl}>Failed to load · retry</div>
        <div style={stack}>
          <div style={stage}>
            <EmptyState
              as="h2"
              icon={<CloudOff size={24} aria-hidden />}
              title="Couldn’t reach the gateway"
              description="The request to lab.example.internal timed out. Check the connection and try again."
              action={
                <Button variant="warn" iconLeft={<RefreshCw size={14} aria-hidden />}>
                  Retry
                </Button>
              }
            />
          </div>
        </div>

        {/* First-run / onboarding — dual CTA */}
        <div style={lbl}>First run · onboarding</div>
        <div style={stack}>
          <div style={stage}>
            <EmptyState
              as="h2"
              icon={<Rocket size={24} aria-hidden />}
              title="Welcome to the console"
              description="Connect your first service to start crawling, searching, and asking. It takes about a minute."
              action={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <Button variant="aurora" filled iconLeft={<Plus size={14} aria-hidden />}>
                    Connect a Service
                  </Button>
                  <Button variant="ghost" iconLeft={<BookOpen size={14} aria-hidden />}>
                    Read the Docs
                  </Button>
                </div>
              }
            />
          </div>
        </div>

        {/* Compact grid — several tones packed together */}
        <div style={lbl}>Compact · side by side</div>
        <div style={grid}>
          <EmptyState
            as="h3"
            icon={<FolderPlus size={24} aria-hidden />}
            title="No projects yet"
            description="Create one to group related sessions and sources."
            action={
              <Button variant="aurora" size="sm" iconLeft={<Plus size={13} aria-hidden />}>
                New Project
              </Button>
            }
          />
          <EmptyState
            as="h3"
            icon={<Filter size={24} aria-hidden />}
            title="Nothing matches this filter"
            description="Every item was hidden. Loosen the filter to bring results back."
            action={
              <Button variant="ghost" size="sm" iconLeft={<RotateCcw size={13} aria-hidden />}>
                Clear Filter
              </Button>
            }
          />
        </div>

        {/* Minimal — title + description only, no icon, no action */}
        <div style={lbl}>Minimal · title only</div>
        <div style={{ ...stack, marginBottom: 0 }}>
          <div style={stage}>
            <EmptyState
              as="h2"
              icon={<ShieldAlert size={24} aria-hidden />}
              title="You don’t have access to this workspace"
              description="Ask an admin to invite you, or switch to a workspace you belong to."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
