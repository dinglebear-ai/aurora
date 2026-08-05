"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface RatingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Current rating value (controlled). */
  value?: number
  /** Initial rating value (uncontrolled). */
  defaultValue?: number
  /** Called with the new value when a star is selected. */
  onChange?: (value: number) => void
  /** Number of stars. */
  max?: number
  /** Pixel size of each star. */
  size?: number
  /** Render as a non-interactive display. */
  readOnly?: boolean
  /** Disable interaction without the read-only display semantics. */
  disabled?: boolean
  /** Accessible label for the group. */
  "aria-label"?: string
}

const STAR_PATH =
  "M12 2.25l2.955 5.988 6.608.96-4.781 4.661 1.128 6.582L12 17.347l-5.91 3.094 1.128-6.582L2.437 9.198l6.608-.96L12 2.25z"

function StarIcon({ size, fill }: { size: number; fill: number }) {
  // fill: 0..1 fraction of the star that is filled
  const id = React.useId()
  const clamped = Math.max(0, Math.min(1, fill))
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      // overflow visible so the glow halo can bleed past the 24×24 box
      style={{ display: "block", flexShrink: 0, overflow: "visible" }}
    >
      <defs>
        {/* rose → cyan diagonal sweep across the filled star */}
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--aurora-rating-from)" />
          <stop offset="100%" stopColor="var(--aurora-rating-to)" />
        </linearGradient>
        {/* clip the filled portion to the value fraction (left-to-right) */}
        <clipPath id={`c${id}`}>
          <rect x="0" y="0" width={clamped * 24} height="24" />
        </clipPath>
      </defs>
      {/* empty base */}
      <path
        d={STAR_PATH}
        fill="var(--aurora-rating-empty)"
        stroke="var(--aurora-rating-empty-stroke)"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      {/* filled portion: rose→cyan gradient + soft glow halo */}
      {clamped > 0 ? (
        <g clipPath={`url(#c${id})`} style={{ filter: "var(--aurora-rating-glow)" }}>
          <path
            d={STAR_PATH}
            fill={`url(#g${id})`}
            stroke="var(--aurora-rating-stroke)"
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
        </g>
      ) : null}
    </svg>
  )
}

const Rating = (
    { ref,
      value,
      defaultValue = 0,
      onChange,
      max = 5,
      size = 24,
      readOnly = false,
      disabled = false,
      className,
      style,
      "aria-label": ariaLabel,
      ...props
    }: RatingProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const isControlled = value !== undefined
    const [internal, setInternal] = React.useState(defaultValue)
    const current = isControlled ? (value as number) : internal
    const [hover, setHover] = React.useState<number | null>(null)
    const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([])

    const interactive = !readOnly && !disabled
    const display = hover ?? current

    const commit = React.useCallback(
      (next: number) => {
        if (!interactive) return
        if (!isControlled) setInternal(next)
        onChange?.(next)
      },
      [interactive, isControlled, onChange]
    )

    const label = ariaLabel ?? `Rating: ${current} out of ${max}`
    const focusValue = current > 0 ? Math.min(max, Math.max(1, Math.round(current))) : 1

    const moveFocus = React.useCallback(
      (next: number) => {
        const clamped = Math.max(1, Math.min(max, next))
        commit(clamped)
        requestAnimationFrame(() => itemRefs.current[clamped - 1]?.focus())
      },
      [commit, max]
    )

    return (
      <div
        ref={ref}
        role={interactive ? "radiogroup" : "img"}
        aria-label={label}
        data-readonly={readOnly || undefined}
        data-disabled={disabled || undefined}
        onMouseLeave={interactive ? () => setHover(null) : undefined}
        className={cn(
          "inline-flex items-center",
          className
        )}
        style={
          {
            gap: Math.max(2, Math.round(size * 0.12)),
            cursor: interactive ? "pointer" : "default",
            opacity: disabled ? 0.5 : 1,
            // Filled stars: rose → cyan gradient sweep with a soft pink+cyan halo.
            "--aurora-rating-from": "var(--aurora-accent-pink)",
            "--aurora-rating-to": "var(--aurora-accent-primary)",
            "--aurora-rating-empty":
              "color-mix(in srgb, var(--aurora-text-muted) 18%, transparent)",
            "--aurora-rating-empty-stroke":
              "color-mix(in srgb, var(--aurora-text-muted) 32%, transparent)",
            "--aurora-rating-stroke":
              "color-mix(in srgb, var(--aurora-accent-primary) 45%, transparent)",
            "--aurora-rating-glow":
              "drop-shadow(0 0 3px color-mix(in srgb, var(--aurora-accent-pink) 55%, transparent)) drop-shadow(0 0 6px color-mix(in srgb, var(--aurora-accent-primary) 42%, transparent))",
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {Array.from({ length: max }, (_, i) => {
          const index = i + 1
          const fill = Math.max(0, Math.min(1, display - i))
          if (!interactive) {
            return <StarIcon key={index} size={size} fill={fill} />
          }
          return (
            <Button
              key={index}
              type="button"
              variant="plain"
              size="unstyled"
              role="radio"
              aria-checked={current === index}
              aria-label={`${index} Star${index === 1 ? "" : "s"}`}
              tabIndex={index === focusValue ? 0 : -1}
              ref={(node) => {
                itemRefs.current[i] = node
              }}
              onMouseEnter={() => setHover(index)}
              onFocus={() => setHover(index)}
              onBlur={() => setHover(null)}
              onClick={() => commit(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                  event.preventDefault()
                  moveFocus(index + 1)
                } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                  event.preventDefault()
                  moveFocus(index - 1)
                } else if (event.key === "Home") {
                  event.preventDefault()
                  moveFocus(1)
                } else if (event.key === "End") {
                  event.preventDefault()
                  moveFocus(max)
                }
              }}
              className="inline-flex rounded-[6px] border-0 bg-transparent p-0 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring,var(--aurora-accent-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--aurora-page-bg)]"
              style={{
                lineHeight: 0,
                cursor: "pointer",
                transitionTimingFunction:
                  "var(--motion-ease, cubic-bezier(0.22, 1, 0.36, 1))",
              }}
            >
              <StarIcon size={size} fill={fill} />
            </Button>
          )
        })}
      </div>
    )
  }
Rating.displayName = "Rating"

export { Rating }
export default Rating
