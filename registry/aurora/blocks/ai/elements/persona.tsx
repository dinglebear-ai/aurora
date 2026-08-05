"use client"

/**
 * Aurora Persona — identity card (avatar, role, presence, capability chips) + compact row.
 * CD-parity standalone implementation (self-contained; the canonical shadcn file).
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export type PersonaPresence = "online" | "busy" | "away" | "offline"

export interface PersonaProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  /** Role / one-line description under the name. */
  role?: string
  /** @deprecated alias for `role`. */
  description?: string
  presence?: PersonaPresence
  /** Capability chips (full variant only). */
  tags?: string[]
  /** Show the Axon orange "AI" badge next to the name (full variant). */
  badge?: boolean
  variant?: "default" | "compact"
  /** Compact: render as a selected (rose-outlined) row. */
  selected?: boolean
}

const PRESENCE: Record<PersonaPresence, string> = {
  online: "var(--aurora-success)",
  busy: "var(--aurora-accent-pink)",
  away: "var(--aurora-warn)",
  offline: "var(--aurora-neutral)",
}

const PRESENCE_LABEL: Record<PersonaPresence, string> = {
  online: "Online",
  busy: "Busy",
  away: "Away",
  offline: "Offline",
}

const AI_STYLE: React.CSSProperties = {
  color: "var(--axon-orange)",
  background: "var(--axon-orange-surface)",
  borderColor: "var(--axon-orange-border)",
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

const Persona = (
    { ref,
      name,
      role,
      description,
      presence,
      tags,
      badge = false,
      variant = "default",
      selected = false,
      className,
      style,
      tabIndex,
      onClick,
      onKeyDown,
      ...props
    }: PersonaProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const sub = role ?? description
    const dotColor = presence ? PRESENCE[presence] : null
    const isCompact = variant === "compact"
    const dotSize = isCompact ? 10 : 13
    const interactiveProps = onClick
      ? {
          role: "button",
          tabIndex: tabIndex ?? 0,
        }
      : {
          role: undefined,
          tabIndex,
        }

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || !onClick) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          event.currentTarget.click()
        }
      },
      [onClick, onKeyDown]
    )

    const avatar = (
      <span className="aurora-persona__av" aria-hidden="true" style={badge ? AI_STYLE : undefined}>
        {initials(name)}
        {dotColor ? (
          <span
            className="aurora-persona__dot"
            style={{ width: dotSize, height: dotSize, background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
          />
        ) : null}
      </span>
    )

    if (isCompact) {
      return (
        <div
          ref={ref}
          className={cn("aurora-persona aurora-persona--compact", selected && "aurora-persona--selected", onClick && "aurora-persona--clickable", className)}
          style={
            selected
              ? {
                  background: "var(--aurora-selected-bg)",
                  borderColor: "var(--aurora-border-strong)",
                  boxShadow: "var(--aurora-active-glow)",
                  ...style,
                }
              : style
          }
          onClick={onClick}
          onKeyDown={handleKeyDown}
          {...interactiveProps}
          {...props}
        >
          {avatar}
          <span className="min-w-0">
            <span className="aurora-persona__name" style={{ display: "block" }}>{name}</span>
            {sub ? <span className="aurora-persona__role" style={{ display: "block", fontSize: 12.5 }}>{sub}</span> : null}
          </span>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("aurora-persona aurora-persona--default", onClick && "aurora-persona--clickable", className)}
        style={style}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...interactiveProps}
        {...props}
      >
        <div className="aurora-persona__head">
          {avatar}
          <span className="min-w-0" style={{ flex: 1 }}>
            <span className="aurora-persona__titlerow">
              <span className="aurora-persona__name" style={{ fontSize: 19 }}>{name}</span>
              {badge ? <span className="aurora-persona__aibadge" style={AI_STYLE}>AI</span> : null}
            </span>
            {sub ? <span className="aurora-persona__role" style={{ display: "block", fontSize: 15 }}>{sub}</span> : null}
          </span>
          {presence ? (
            <span
              className="aurora-persona__status"
              style={{
                fontFamily: "var(--aurora-font-sans)",
                letterSpacing: "var(--aurora-letter-label)",
                textTransform: "none",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor ?? "transparent", boxShadow: dotColor ? `0 0 6px ${dotColor}` : undefined }} />
              {PRESENCE_LABEL[presence]}
            </span>
          ) : null}
        </div>
        {tags && tags.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {tags.map((t) => (
              <span
                key={t}
                className="aurora-persona__chip"
                style={{ fontFamily: "var(--aurora-font-sans)" }}
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }
Persona.displayName = "Persona"

const MemoPersona = React.memo(Persona)
MemoPersona.displayName = "Persona"

export { MemoPersona as Persona }
export default MemoPersona
