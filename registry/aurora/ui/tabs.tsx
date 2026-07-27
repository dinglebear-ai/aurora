"use client"

/**
 * Aurora Design System — Tabs & PillGroup
 * peer dep: @radix-ui/react-tabs
 */

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

// ─── Line Tabs ────────────────────────────────────────────────────────────────

const Tabs = TabsPrimitive.Root

function TabsList({ ref, className, style, ...props }: React.ComponentProps<typeof TabsPrimitive.List> & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.List>> }) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn("flex max-w-full items-end gap-1 overflow-x-auto overflow-y-hidden border-b", className)}
      style={{ borderColor: "var(--aurora-border-default)", ...style }}
      {...props}
    />
  )
}

function TabsTrigger({ ref, className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger> & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Trigger>> }) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        // layout (CD: symmetric 9px vertical, 12px horizontal)
        "relative inline-flex items-center gap-1.5 px-3 py-[9px]",
        "select-none cursor-pointer",
        "transition-colors duration-150 focus-visible:outline-none",
        // resting state
        "text-[var(--aurora-text-muted)] hover:text-[var(--aurora-text-primary)]",
        // glowing accent underline indicator (CD: inset 8px, sits on the border, soft glow)
        "after:absolute after:bottom-[-1px] after:left-2 after:right-2 after:h-[2px]",
        "after:rounded-full after:bg-transparent after:transition-colors after:duration-150",
        // active state (CD: text goes primary, indicator lights up cyan + glow)
        "data-[state=active]:text-[var(--aurora-text-primary)]",
        "data-[state=active]:after:bg-[var(--aurora-accent-primary)]",
        "data-[state=active]:after:[box-shadow:0_0_8px_var(--aurora-accent-primary)]",
        className
      )}
      style={{
        fontFamily: "var(--aurora-font-sans)",
        fontSize: "var(--aurora-type-body-sm)",
        fontWeight: "var(--aurora-weight-ui)",
        letterSpacing: "var(--aurora-letter-ui)",
        lineHeight: "var(--aurora-line-ui)",
      }}
      {...props}
    />
  )
}

function TabsContent({ ref, className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content> & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Content>> }) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  )
}

// ─── Pill Group ───────────────────────────────────────────────────────────────

/**
 * PillGroup — a pill-shaped segmented toggle that wraps Radix Tabs.
 *
 * Usage:
 *   <PillGroup
 *     defaultValue="a"
 *     panels={<TabsContent value="a">Option A panel</TabsContent>}
 *   >
 *     <PillTrigger value="a">Option A</PillTrigger>
 *   </PillGroup>
 *
 * PillGroup is a tablist, not a standalone toggle group. Requiring panels keeps
 * every trigger's aria-controls reference valid. Use ToggleGroup or Segmented
 * when no corresponding panels exist.
 */
export interface PillGroupProps
  extends Omit<React.ComponentProps<typeof TabsPrimitive.Root>, "children"> {
  children: React.ReactNode
  panels: React.ReactNode
}

function PillGroup({ ref, className, children, panels, style, ...props }: PillGroupProps & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Root>> }) {
  return (
    <TabsPrimitive.Root ref={ref} {...props}>
      <TabsPrimitive.List
        className={cn(
          "inline-flex max-w-full items-center gap-1 overflow-x-auto overflow-y-hidden rounded-full border p-1",
          className
        )}
        style={{
          backgroundColor: "var(--aurora-control-surface)",
          borderColor: "var(--aurora-border-default)",
          ...style,
        }}
      >
        {children}
      </TabsPrimitive.List>
      {panels}
    </TabsPrimitive.Root>
  )
}

function PillTrigger({ ref, className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger> & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Trigger>> }) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5",
        "select-none cursor-pointer",
        "transition-all duration-150 focus-visible:outline-none",
        // resting
        "text-[var(--aurora-text-muted)] hover:text-[var(--aurora-text-primary)]",
        // active — bg + accent text + active-glow
        "data-[state=active]:text-[var(--aurora-accent-primary)]",
        "[&[data-state=active]]:bg-[var(--aurora-panel-strong)]",
        "[&[data-state=active]]:[box-shadow:var(--aurora-active-glow)]",
        className
      )}
      style={{
        fontFamily: "var(--aurora-font-sans)",
        fontSize: "var(--aurora-type-body-sm)",
        fontWeight: "var(--aurora-weight-ui)",
        letterSpacing: "var(--aurora-letter-ui)",
        lineHeight: "var(--aurora-line-ui)",
      }}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  PillGroup,
  PillTrigger,
}
