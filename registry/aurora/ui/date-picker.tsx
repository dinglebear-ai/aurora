"use client"

import * as React from "react"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/registry/aurora/ui/button"

export interface DatePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Optional field label rendered above the trigger. */
  label?: string
  /** Controlled selected date. */
  value?: Date
  /** Uncontrolled initial selected date. */
  defaultValue?: Date
  /** Fired with the newly selected date. */
  onChange?: (date: Date) => void
  /** Open the popover by default (uncontrolled). */
  defaultOpen?: boolean
  /** Placeholder text shown in the trigger when no date is selected. */
  placeholder?: string
}

function sameDay(a?: Date, b?: Date) {
  return Boolean(a && b && a.toDateString() === b.toDateString())
}

/**
 * Build the visible month grid as weeks of 7 cells. Leading days before the 1st
 * and trailing days after the last day of the month are rendered as empty cells
 * (CD shows only the current month's dates — no greyed adjacent-month days).
 */
function buildCells(month: Date): (Date | null)[] {
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstWeekday = new Date(year, m, 1).getDay()
  const daysInMonth = new Date(year, m + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, m, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

  const triggerFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
})

/**
 * Aurora DatePicker — trigger + month-grid popover.
 *
 * Visual spec ported 1:1 from the Claude Design source: a lit-outline trigger
 * button (calendar icon + formatted date + chevron) over an Aurora panel popover
 * holding a self-contained month grid. The selected day is a cyan-filled, glowing
 * pill; "today" is a cyan-outlined cell. Reads only `--aurora-*` tokens.
 */
export function DatePicker(
  {
    ref,
    className,
    label,
    value,
    defaultValue,
    onChange,
    defaultOpen = false,
    placeholder = "Select date",
    ...props
  }: DatePickerProps & { ref?: React.Ref<HTMLDivElement> }
) {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState<Date | undefined>(defaultValue)
    const selected = isControlled ? value : internalValue

    const [open, setOpen] = React.useState(defaultOpen)
    const [visibleMonth, setVisibleMonth] = React.useState<Date>(
      selected ?? defaultValue ?? new Date()
    )
    const titleId = React.useId()

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      },
      [ref]
    )

    // Dismiss on outside click / Escape.
    React.useEffect(() => {
      if (!open) return
      const onPointerDown = (event: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false)
      }
      document.addEventListener("mousedown", onPointerDown)
      document.addEventListener("keydown", onKeyDown)
      return () => {
        document.removeEventListener("mousedown", onPointerDown)
        document.removeEventListener("keydown", onKeyDown)
      }
    }, [open])

    const handleSelect = (date: Date) => {
      if (!isControlled) setInternalValue(date)
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
      onChange?.(date)
      setOpen(false)
    }

    const cells = buildCells(visibleMonth)
    const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" })
    const today = new Date()

    return (
      <div
        ref={setRefs}
        className={["relative inline-grid gap-1.5", className].filter(Boolean).join(" ")}
        {...props}
      >
        {label ? (
          <span className="aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
            {label}
          </span>
        ) : null}

        {/* Trigger — lit-outline control surface */}
        <Button
          type="button"
          variant="neutral"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="w-full"
          onClick={() => {
            if (!open && selected) {
              setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
            }
            setOpen((prev) => !prev)
          }}
          style={{
            height: 44,
            padding: "0 16px",
            borderRadius: "var(--aurora-radius-1)",
            justifyContent: "flex-start",
            fontSize: "15px",
            fontWeight: "var(--aurora-weight-body, 500)",
          }}
        >
          <CalendarDays
            className="size-[18px] shrink-0"
            aria-hidden
            style={{ color: "var(--aurora-text-muted)" }}
          />
          <span
            className="flex-1 text-left"
            style={{ color: selected ? "var(--aurora-text-primary)" : "var(--aurora-text-muted)" }}
          >
            {selected ? triggerFormatter.format(selected) : placeholder}
          </span>
          <ChevronDown
            className="size-[18px] shrink-0"
            aria-hidden
            style={{ color: "var(--aurora-text-muted)" }}
          />
        </Button>

        {/* Popover — month grid */}
        {open ? (
          <div
            role="dialog"
            aria-labelledby={titleId}
            className="absolute left-0 top-full z-50 mt-2 grid gap-4 border p-4"
            style={{
              width: "320px",
              borderRadius: "var(--aurora-radius-2)",
              background: "var(--aurora-panel-strong)",
              borderColor: "var(--aurora-border-strong)",
              color: "var(--aurora-text-primary)",
              boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-medium)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="neutral"
                size="icon"
                aria-label="Previous month"
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                  )
                }
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <div
                id={titleId}
                style={{
                  fontFamily: "var(--aurora-font-display, var(--font-sans))",
                  fontSize: "17px",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  color: "var(--aurora-text-primary)",
                }}
              >
                {monthFormatter.format(visibleMonth)}
              </div>
              <Button
                type="button"
                variant="neutral"
                size="icon"
                aria-label="Next month"
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                  )
                }
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>

            <div className="grid gap-1" role="grid" aria-label={monthFormatter.format(visibleMonth)}>
              <div className="grid grid-cols-7 gap-1" role="row">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <div
                    key={index}
                    role="columnheader"
                    className="grid h-7 place-items-center"
                    style={{ fontSize: "13px", fontWeight: 700, color: "var(--aurora-text-muted)" }}
                  >
                    {day}
                  </div>
                ))}
              </div>
              {Array.from({ length: cells.length / 7 }, (_, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1" role="row">
                  {cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, dayIndex) => {
                    const cellIndex = weekIndex * 7 + dayIndex
                    if (!date) {
                      return <div key={`empty-${cellIndex}`} role="gridcell" aria-hidden className="h-10" />
                    }
                    const isSelected = sameDay(date, selected)
                    const isToday = !isSelected && sameDay(date, today)
                    return (
                      <Button
                        variant="plain"
                        size="unstyled"
                        key={date.toISOString()}
                        type="button"
                        role="gridcell"
                        aria-label={date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                        aria-selected={isSelected || undefined}
                        aria-current={isToday ? "date" : undefined}
                        className="grid h-10 place-items-center border transition-colors"
                        onClick={() => handleSelect(date)}
                        style={{
                          borderRadius: "12px",
                          fontSize: "16px",
                          fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? "var(--aurora-accent-primary)" : "transparent",
                          borderColor: isToday
                            ? "color-mix(in srgb, var(--aurora-accent-primary) 60%, transparent)"
                            : "transparent",
                          color: isSelected ? "var(--aurora-accent-foreground)" : "var(--aurora-text-primary)",
                          boxShadow: isSelected ? "var(--aurora-active-glow)" : "none",
                        }}
                      >
                        {date.getDate()}
                      </Button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
}

export default DatePicker
