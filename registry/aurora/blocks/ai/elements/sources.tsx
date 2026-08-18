"use client"

import * as React from "react"
import { ChevronDown, FileText } from "lucide-react"
import { Badge } from "@/registry/aurora/ui/badge"
import { Button } from "@/registry/aurora/ui/button"
import { Source, type SourceItem, type SourceProps } from "@/registry/aurora/blocks/ai/elements/source"

// ---------------------------------------------------------------------------
// Types (architecture source of truth — keep the existing registry API)
// ---------------------------------------------------------------------------

export interface SourcesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
  /** Compact density for citations embedded inside chat turns. */
  density?: "default" | "compact"
  /** Render the count badge + chevron and allow the body to collapse. */
  collapsible?: boolean
  /** Control the collapsed state (uncontrolled defaults to expanded). */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export type { SourceItem, SourceProps }

// ---------------------------------------------------------------------------
// Shared surface helpers (ported from CD injected CSS)
// ---------------------------------------------------------------------------

function panelStyle(style?: React.CSSProperties): React.CSSProperties {
  return {
    background: "var(--aurora-surface-raised)",
    border: "1px solid var(--aurora-border-strong)",
    borderRadius: "var(--aurora-radius-1)",
    boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
    ...style,
  }
}


// ---------------------------------------------------------------------------
// Count badge — small neutral pill next to the title
// ---------------------------------------------------------------------------

function CountBadge({ count }: { count: number }) {
  return (
    <Badge
      tone="neutral"
      fill="outline"
      className="min-w-[22px] justify-center px-1.5 tabular-nums"
    >
      {count}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Sources — bordered panel with file icon, title, count badge, collapsible body
// ---------------------------------------------------------------------------

const Sources = (
    { ref,
      className,
      title = "Sources",
      density = "default",
      collapsible = false,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      style,
      children,
      ...props
    }: SourcesProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const compact = density === "compact"
    const isControlled = openProp !== undefined
    const [openState, setOpenState] = React.useState(defaultOpen)
    const open = isControlled ? openProp : openState

    const count = React.Children.toArray(children).filter(React.isValidElement).length

    const toggle = React.useCallback(() => {
      const next = !open
      if (!isControlled) setOpenState(next)
      onOpenChange?.(next)
    }, [open, isControlled, onOpenChange])

    const headerInner = (
      <>
        <FileText className={compact ? "size-3.5 shrink-0" : "size-[18px] shrink-0"} aria-hidden style={{ color: "var(--aurora-accent-pink)" }} />
        <span
          className="aurora-text-label"
          style={{ color: "var(--aurora-text-primary)", fontSize: compact ? 12 : 16, fontWeight: 700 }}
        >
          {title}
        </span>
        {collapsible ? <CountBadge count={count} /> : null}
        {collapsible ? (
          <ChevronDown
            className={compact ? "ml-auto size-3.5 shrink-0 transition-transform" : "ml-auto size-[18px] shrink-0 transition-transform"}
            aria-hidden
            style={{
              color: "var(--aurora-text-muted)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        ) : null}
      </>
    )

    return (
      <div
        ref={ref}
        className={[compact ? "grid gap-1.5 p-2" : "grid gap-3 p-4", className].filter(Boolean).join(" ")}
        style={panelStyle(compact ? {
          background: "color-mix(in srgb, var(--aurora-panel-medium) 38%, transparent)",
          border: "1px solid color-mix(in srgb, var(--aurora-border-default) 78%, transparent)",
          borderRadius: "10px",
          boxShadow: "var(--aurora-highlight-medium)",
          ...style,
        } : style)}
        {...props}
      >
        {collapsible ? (
          <Button
            type="button"
            variant="plain"
            size="unstyled"
            onClick={toggle}
            aria-expanded={open}
            className={compact ? "flex items-center gap-1.5 bg-transparent p-0 text-left outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)] focus-visible:ring-offset-0" : "flex items-center gap-2.5 bg-transparent p-0 text-left outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)] focus-visible:ring-offset-0"}
            data-density={density}
            style={{ borderRadius: "var(--aurora-radius-1)", cursor: "pointer", color: "inherit" }}
          >
            {headerInner}
          </Button>
        ) : (
          <div className={compact ? "flex items-center gap-1.5" : "flex items-center gap-2.5"}>{headerInner}</div>
        )}
        {!collapsible || open ? <div className={compact ? "grid gap-1.5" : "grid gap-2.5"}>{children}</div> : null}
      </div>
    )
  }
Sources.displayName = "Sources"

export { Source, Sources }
