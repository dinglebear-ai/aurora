"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/registry/aurora/ui/button"

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  month?: Date
  selected?: Date
  onSelect?: (date: Date) => void
  onMonthChange?: (month: Date) => void
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

export function Calendar({ month, selected, onSelect, onMonthChange, className, style, ...props }: CalendarProps) {
  const [internalVisibleMonth, setInternalVisibleMonth] = React.useState(month ?? new Date())
  const visibleMonth = month ?? internalVisibleMonth
  const cells = buildCells(visibleMonth)
  const formatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" })
  const today = new Date()

  const handleMonthChange = React.useCallback(
    (nextMonth: Date) => {
      if (month === undefined) {
        setInternalVisibleMonth(nextMonth)
      }
      onMonthChange?.(nextMonth)
    },
    [month, onMonthChange]
  )

  return (
    <div
      className={["grid gap-4 border p-4", className].filter(Boolean).join(" ")}
      style={{
        width: "320px",
        borderRadius: "16px",
        background: "var(--aurora-panel-medium)",
        borderColor: "var(--aurora-border-default)",
        color: "var(--aurora-text-primary)",
        boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
        ...style,
      }}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="neutral"
          size="icon"
          aria-label="Previous month"
          onClick={() => handleMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <div
          style={{
            fontFamily: "var(--aurora-font-display, var(--font-sans))",
            fontSize: "17px",
            fontWeight: 700,
            letterSpacing: "0.01em",
            color: "var(--aurora-text-primary)",
          }}
        >
          {formatter.format(visibleMonth)}
        </div>
        <Button
          type="button"
          variant="neutral"
          size="icon"
          aria-label="Next month"
          onClick={() => handleMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="grid gap-1" role="grid" aria-label={formatter.format(visibleMonth)}>
        <div className="grid grid-cols-7 gap-1" role="row">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={index}
              role="columnheader"
              className="grid h-7 place-items-center"
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--aurora-text-muted)",
              }}
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
                  onClick={() => onSelect?.(date)}
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
  )
}

export default Calendar
