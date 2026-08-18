"use client"

import * as React from "react"
import { ExternalLink, Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/aurora/ui/badge"
import { safeHttpUrl } from "@/registry/aurora/lib/safe-url"

// ---------------------------------------------------------------------------
// Types (architecture source of truth — preserve the existing registry API)
// ---------------------------------------------------------------------------

export interface SourceItem {
  title: string
  href?: string
  description?: string
  badge?: string
}

export interface SourceProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Source descriptor rendered in the citation row. */
  source: SourceItem
  /** Optional 1-based ordinal rendered in the rose numbered chip. */
  index?: number
  /** Compact density for references inside chat turns. */
  density?: "default" | "compact"
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hostname(href?: string): string | null {
  if (!href) return null
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return href.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null
  }
}

// ---------------------------------------------------------------------------
// Source — standalone citation row: rose index chip, domain, badge, hover lit.
// Visual spec ported 1:1 from the Claude Design dsCard (control-surface card,
// rose numbered chip, bold title, neutral uppercase badge, globe + host,
// external-link arrow). Hover lifts the surface and border.
// ---------------------------------------------------------------------------

const Source = ({ ref, className, source, index, density = "default", style, href, target, rel, tabIndex, ...props }: SourceProps & { ref?: React.Ref<HTMLAnchorElement> }) => {
    const compact = density === "compact"
    const safeHref = safeHttpUrl(href ?? source.href)
    const host = hostname(safeHref)
    const isLinked = Boolean(safeHref)

    return (
      <a
        ref={ref}
        {...props}
        href={safeHref}
        target={target ?? (isLinked ? "_blank" : undefined)}
        rel={rel ?? (isLinked ? "noreferrer noopener" : undefined)}
        tabIndex={tabIndex ?? (isLinked ? undefined : -1)}
        aria-disabled={isLinked ? undefined : true}
        aria-label={host ? `${source.title}, ${host}` : source.title}
        className={cn(
          compact ? "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 px-2 py-1.5 no-underline" : "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-3.5 no-underline",
          "transition-[background,border-color,box-shadow,transform] duration-150 ease-out",
          "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)] focus-visible:ring-offset-0",
          isLinked &&
            "hover:-translate-y-px hover:border-[color:var(--aurora-border-strong)] hover:bg-[var(--aurora-hover-bg)]",
          className
        )}
        style={{
          background: compact ? "color-mix(in srgb, var(--aurora-control-surface) 60%, transparent)" : "var(--aurora-control-surface)",
          border: `1px solid ${compact ? "color-mix(in srgb, var(--aurora-border-default) 72%, transparent)" : "var(--aurora-border-default)"}`,
          borderRadius: compact ? "8px" : "calc(var(--aurora-radius-1) - 4px)",
          color: "var(--aurora-text-primary)",
          boxShadow: compact ? "none" : "var(--aurora-highlight-medium)",
          ...style,
        }}
      >
        {index != null ? (
          <span
            className={compact ? "inline-flex size-[18px] shrink-0 items-center justify-center aurora-text-control" : "inline-flex size-7 shrink-0 items-center justify-center aurora-text-control"}
            aria-hidden
            style={{
              borderRadius: "calc(var(--aurora-radius-1) - 6px)",
              background: "var(--aurora-accent-pink-surface)",
              border: "1px solid var(--aurora-accent-pink-border)",
              color: "var(--aurora-accent-pink-strong)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {index}
          </span>
        ) : (
          <span className="shrink-0" aria-hidden style={{ width: 0 }} />
        )}

        <span className={compact ? "grid min-w-0 gap-0.5" : "grid min-w-0 gap-1.5"}>
          <span className={compact ? "flex min-w-0 items-center gap-1.5" : "flex min-w-0 items-center gap-2"}>
            <span
              className="truncate aurora-text-control"
              style={{ color: "var(--aurora-text-primary)", fontSize: compact ? 11.5 : 16, fontWeight: compact ? 650 : 700 }}
            >
              {source.title}
            </span>
            {source.badge ? (
              <Badge
                tone="neutral"
                fill="outline"
                className={compact ? "shrink-0 !px-1.5 text-[8px] tracking-[0.06em]" : "shrink-0"}
              >
                {source.badge}
              </Badge>
            ) : null}
          </span>
          {host ? (
            <span
              className={compact ? "flex min-w-0 items-center gap-1 aurora-text-meta text-[9.5px]" : "flex min-w-0 items-center gap-1.5 aurora-text-meta"}
              style={{ color: "var(--aurora-text-muted)" }}
            >
              <Globe className={compact ? "size-[10px] shrink-0" : "size-3.5 shrink-0"} aria-hidden />
              <span className="truncate">{host}</span>
            </span>
          ) : null}
          {source.description ? <span className="aurora-text-meta">{source.description}</span> : null}
        </span>

        {isLinked ? (
          <ExternalLink
            className={compact ? "size-3.5 shrink-0 self-center text-[var(--aurora-text-muted)] transition-colors group-hover:text-[var(--aurora-accent-primary)]" : "size-[18px] shrink-0 self-center text-[var(--aurora-text-muted)] transition-colors group-hover:text-[var(--aurora-accent-primary)]"}
            data-density={density}
            data-source-link="true"
            aria-hidden
          />
        ) : (
          <span aria-hidden className="size-[18px] shrink-0" />
        )}
      </a>
    )
  }
Source.displayName = "Source"

export { Source }
export default Source
