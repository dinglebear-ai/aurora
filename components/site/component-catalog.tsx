"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, ArrowUpRight, LayoutGrid, Monitor, Search, SearchX, Smartphone, X } from "lucide-react"
import catalog from "@/lib/client-catalog.json"
import { DEMOS } from "@/app/gallery/demo-map"
import { PortalContainerContext } from "@/registry/aurora/lib/portal-container"
import { PreviewPosterContext } from "@/lib/preview-poster"
import { fuzzy } from "@/lib/fuzzy"
import { CopyLine } from "@/components/site/site-ui"
import { tint } from "@/components/site/style-tokens"
import { EmptyState } from "@/registry/aurora/ui/empty-state"
import { Button } from "@/registry/aurora/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/registry/aurora/ui/dialog"

/**
 * ComponentCatalog — the CD `aurora-site` LiveCatalog, wired to OUR gallery so
 * it can never drift: every tile is a Gallery catalog entry rendering its real
 * gallery demo as a scaled live preview (lazy-mounted on scroll), and opening
 * a tile shows the interactive demo in a drawer with its install line.
 */

type Flavor = "shadcn" | "android"

interface CatalogItem {
  slug: string
  label: string
  group: string
  desc: string
  /** registry item name (e.g. "aurora-button") — join key for the Kotlin map */
  registry: string | null
  installUrl: string | null
}

const ITEMS: CatalogItem[] = catalog.items.map((item) => ({ ...item, desc: item.description }))
const GROUPS = catalog.groups

const GRADLE_LINE = 'implementation("tv.tootie.aurora:aurora")'

/* ── Lazy live preview — CD LazyFrame, sans iframe ─────────────────────────
 * The demo renders at full width inside a scaled, non-interactive wrapper.
 * The scale transform also acts as a containing block, so demos that use
 * position:fixed (dialogs, drawers, palettes) stay inside their tile. */
const PREVIEW_W = 760
const PREVIEW_SCALE = 0.31
const PREVIEW_H = 470

const LazyPreview = React.memo(function LazyPreview({ slug }: { slug: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)
  // Scoped portal target so overlay demos (Sheet/Drawer, which portal to body
  // and can auto-open) stay contained in the tile instead of covering the page.
  const [portalHost, setPortalHost] = React.useState<HTMLElement | null>(null)
  // Guarded callback ref: a bare `setState` ref loops here, because React
  // detaches (null) then reattaches (node) during search show/hide, and each
  // call re-renders. Ignore detach, and bail when the node is unchanged.
  const attachHost = React.useCallback((node: HTMLDivElement | null) => {
    if (node) setPortalHost((prev) => (prev === node ? prev : node))
  }, [])
  const Demo = DEMOS[slug]

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        setVisible(true)
      },
      { rootMargin: "300px" },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      // inert completes what aria-hidden + pointer-events already imply: this is
      // a poster, not a control. Without it, demos that auto-open focus their
      // content on mount (Combobox and Command focus an input), and focusing
      // anything inside the scale(0.31) wrapper makes the browser scroll it into
      // view — so scrolling the catalog yanked the page back toward the top.
      // inert makes focus() a no-op for every demo, not just today's offenders.
      inert
      style={{
        width: PREVIEW_W * PREVIEW_SCALE,
        height: PREVIEW_H * PREVIEW_SCALE,
        overflow: "hidden",
        pointerEvents: "none",
        flexShrink: 0,
      }}
    >
      {visible && Demo ? (
        <div
          ref={attachHost}
          aria-label={`${slug} preview`}
          style={{
            position: "relative",
            width: PREVIEW_W,
            height: PREVIEW_H,
            overflow: "hidden",
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "top left",
            padding: 16,
          }}
        >
          {portalHost ? (
            // Per-tile Suspense boundary. Every demo is next/dynamic (React.lazy),
            // so mounting one suspends until its chunk arrives. Without a boundary
            // here that suspension bubbles to the catalog-wide one below (added for
            // useSearchParams), whose fallback={null} hides the ENTIRE grid: the
            // page collapses to viewport height, the browser clamps scroll to 0,
            // and the reader is thrown back to the top mid-scroll. Containing it
            // per tile means a loading demo costs only its own thumbnail.
            <React.Suspense fallback={null}>
              <PreviewPosterContext.Provider value={true}>
                <PortalContainerContext.Provider value={portalHost}>
                  <Demo />
                </PortalContainerContext.Provider>
              </PreviewPosterContext.Provider>
            </React.Suspense>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--aurora-accent-primary) 5%, transparent), transparent 60%)",
          }}
        />
      )}
    </div>
  )
})

/* ── Catalog tile — memoized. The catalog renders 162 of these, each mounting
 * a full live demo; wrapping in React.memo means parent state changes (search
 * text, category/flavor toggle, drawer open/close) no longer re-render every
 * tile and its mounted demo — they only re-render when their own props change.
 * `item` is referentially stable (same object across list re-derivations) and
 * `onPick` is a stable useCallback, so the shallow comparison holds. */
const CatalogTile = React.memo(function CatalogTile({
  item,
  delayMs,
  android,
  kotlin,
  onPick,
}: {
  item: CatalogItem
  /** staggered rise-in delay (capped upstream) */
  delayMs: number
  android: boolean
  /** resolved Kotlin counterpart file, Android flavor only */
  kotlin?: string
  onPick: (item: CatalogItem) => void
}) {
  return (
    <div
      className="aurora-card aurora-catalog-tile aurora-catalog-rise"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        textAlign: "left",
        padding: 0,
        borderRadius: "var(--aurora-radius-2)",
        border: "1px solid var(--aurora-border-default)",
        background: "var(--aurora-panel-medium)",
        boxShadow: "var(--aurora-shadow-subtle), var(--aurora-highlight-medium)",
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          overflow: "hidden",
          background:
            "radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--aurora-accent-primary) 6%, transparent), transparent 60%), var(--aurora-control-surface)",
          borderBottom: "1px solid var(--aurora-border-default)",
        }}
      >
        <LazyPreview slug={item.slug} />
      </div>
      <button
        type="button"
        data-catalog-open
        aria-label={`Open ${item.label}`}
        onClick={() => onPick(item)}
        style={{
          padding: "11px 13px 13px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: "100%",
          border: 0,
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--aurora-font-display)",
              fontWeight: 800,
              fontSize: 14.5,
              letterSpacing: "-0.01em",
              color: "var(--aurora-text-primary)",
            }}
          >
            {item.label}
          </span>
          <ArrowUpRight className="aurora-catalog-arrow" size={14} style={{ color: "var(--aurora-text-muted)", flexShrink: 0 }} />
        </div>
        <span
          style={{
            marginTop: 2,
            fontSize: 11,
            // Category is UI copy → sans. The Kotlin file name (Android
            // flavor) is a code reference → mono.
            fontFamily:
              android && item.registry
                ? "var(--aurora-font-mono)"
                : "var(--aurora-font-sans)",
            color: "var(--aurora-text-muted)",
          }}
        >
          {android && item.registry ? (
            <span style={{ color: "var(--aurora-accent-strong)" }}>{kotlin}</span>
          ) : (
            item.group
          )}
        </span>
      </button>
    </div>
  )
})

function DrawerArrow({
  dir,
  target,
  onPick,
  compact = false,
}: {
  dir: "left" | "right"
  target: CatalogItem | null
  onPick: (item: CatalogItem) => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      disabled={!target}
      onClick={(e) => {
        e.stopPropagation()
        if (target) onPick(target)
      }}
      aria-label={target ? `${dir === "left" ? "Previous" : "Next"}: ${target.label}` : `${dir === "left" ? "Previous" : "Next"} Component`}
      title={target ? `${dir === "left" ? "Previous" : "Next"}: ${target.label}` : undefined}
      className={`${compact ? "grid size-[30px] rounded-[8px]" : "aurora-catalog-drawer-arrow grid size-[46px] self-center rounded-[12px]"} flex-none place-items-center`}
      style={{
        background: "var(--aurora-control-surface)",
        border: "1px solid var(--aurora-border-strong)",
        color: "var(--aurora-text-primary)",
        boxShadow: "var(--aurora-highlight-medium)",
        opacity: target ? 1 : 0.4,
        cursor: target ? "pointer" : "default",
      }}
    >
      {dir === "left" ? <ArrowLeft size={compact ? 14 : 18} strokeWidth={1.75} /> : <ArrowRight size={compact ? 14 : 18} strokeWidth={1.75} />}
    </button>
  )
}

/* ── Detail drawer — CD LiveDrawer, with prev/next arrows (CD
 * HeroComponentView parity): ←/→ keys and flanking arrow buttons cycle
 * through the currently filtered list. ─────────────────────────────────── */
function LiveDrawer({
  item,
  list,
  kotlin,
  onPick,
  onClose,
  onRestoreFocus,
}: {
  item: CatalogItem
  list: CatalogItem[]
  /** Kotlin counterpart file when viewing the Android flavor */
  kotlin?: string
  onPick: (item: CatalogItem) => void
  onClose: () => void
  onRestoreFocus: () => void
}) {
  const Demo = DEMOS[item.slug]
  // Overlay demos (Select, DropdownMenu, Popover, …) portal their content, and
  // the registry styles it z-50 — below this drawer's z-index, so a body-level
  // portal renders *behind* the drawer. Host them on the panel instead: it is
  // inside the drawer's stacking context, and its onClick stops propagation, so
  // clicking a menu item can't bubble to the backdrop and close the drawer.
  const [drawerHost, setDrawerHost] = React.useState<HTMLElement | null>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)
  const attachDrawerHost = React.useCallback((node: HTMLElement | null) => {
    if (node) setDrawerHost((prev) => (prev === node ? prev : node))
  }, [])

  const idx = list.findIndex((c) => c.slug === item.slug)
  const has = idx >= 0 && list.length > 1
  const prev = has ? list[(idx - 1 + list.length) % list.length] : null
  const next = has ? list[(idx + 1) % list.length] : null

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.target !== titleRef.current) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag && /INPUT|TEXTAREA|SELECT/.test(tag)) return
      if (e.key === "ArrowLeft" && prev) onPick(prev)
      else if (e.key === "ArrowRight" && next) onPick(next)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onPick, prev, next])

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent
        hideClose
        size="xl"
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          titleRef.current?.focus()
        }}
        onCloseAutoFocus={(event) => {
          // Restore after the focus trap unmounts, not on a competing animation frame.
          event.preventDefault()
          onRestoreFocus()
        }}
        className="aurora-catalog-drawer-backdrop !max-w-[min(880px,calc(100vw-24px))] flex-row items-stretch justify-center border-0 bg-transparent p-0"
        style={{
          width: "min(880px, calc(100vw - 24px))",
          height: "90vh",
          gap: 12,
          background: "transparent",
          boxShadow: "none",
        }}
      >
        <DrawerArrow dir="left" target={prev} onPick={onPick} />
        <aside
        ref={attachDrawerHost}
        className="aurora-catalog-drawer"
        style={{
          width: "min(760px, 92vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "var(--aurora-radius-3)",
          background: "var(--aurora-panel-strong)",
          border: "1px solid var(--aurora-border-strong)",
          boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)",
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--aurora-border-default)" }}
        >
          <div className="min-w-0 flex-1">
            <DialogTitle
              ref={titleRef}
              tabIndex={-1}
              style={{
                fontFamily: "var(--aurora-font-display)",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.02em",
                color: "var(--aurora-text-primary)",
              }}
            >
              {item.label}
            </DialogTitle>
            <div style={{ fontSize: 11.5, fontFamily: "var(--aurora-font-sans)", color: "var(--aurora-text-muted)" }}>
              aurora · {item.group.toLowerCase()}
              {kotlin ? (
                <>
                  {" · "}
                  <span style={{ color: "var(--aurora-accent-strong)" }}>{kotlin}</span>
                </>
              ) : null}
              {has ? ` · ${idx + 1} / ${list.length}` : null}
            </div>
          </div>
          <div className="aurora-catalog-drawer-mobile-nav" role="group" aria-label="Browse components">
            <DrawerArrow compact dir="left" target={prev} onPick={onPick} />
            <DrawerArrow compact dir="right" target={next} onPick={onPick} />
          </div>
          <Link
            href={`/gallery/${item.slug}`}
            className="aurora-text-control flex items-center gap-1.5 rounded-[9px] border px-3 py-[7px]"
            style={{
              color: "var(--aurora-accent-strong)",
              borderColor: tint("--aurora-accent-primary", 34),
              background: tint("--aurora-accent-primary", 10),
            }}
          >
            Full Page <ArrowUpRight size={13} strokeWidth={2} />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-[32px] place-items-center rounded-[9px]"
            style={{ color: "var(--aurora-text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {item.label}, item {idx + 1} of {list.length}
        </p>

        <div className="aurora-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <div className="aurora-text-eyebrow mb-2.5" style={{ fontSize: 10 }}>
            {kotlin ? "Live Preview · Web Parity Render" : "Live Preview · Interactive"}
          </div>
          <div
            className="mb-5 overflow-hidden rounded-[var(--aurora-radius-2)] p-4"
            style={{
              background:
                "radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--aurora-accent-primary) 6%, transparent), transparent 60%), var(--aurora-control-surface)",
              border: "1px solid var(--aurora-border-default)",
            }}
          >
            {Demo ? (
              // Same reason as the tile preview: contain this demo's suspension so
              // opening the drawer cannot blank the catalog behind it.
              <React.Suspense fallback={null}>
                <PortalContainerContext.Provider value={drawerHost}>
                  <Demo />
                </PortalContainerContext.Provider>
              </React.Suspense>
            ) : null}
          </div>

          {kotlin ? (
            <>
              <div className="aurora-text-eyebrow mb-2.5" style={{ fontSize: 10 }}>
                Install · Android
              </div>
              <div className="flex flex-col gap-2">
                <CopyLine cmd={GRADLE_LINE} />
                <div style={{ fontSize: 11.5, fontFamily: "var(--aurora-font-sans)", color: "var(--aurora-text-muted)" }}>
                  android/aurora · components/{kotlin} — theme via AuroraTheme, tokens via AxonTheme.colors
                </div>
              </div>
            </>
          ) : item.installUrl ? (
            <>
              <div className="aurora-text-eyebrow mb-2.5" style={{ fontSize: 10 }}>
                Install
              </div>
              <CopyLine cmd={`npx shadcn@latest add ${item.installUrl}`} />
            </>
          ) : null}
        </div>
        </aside>
        <DrawerArrow dir="right" target={next} onPick={onPick} />
      </DialogContent>
    </Dialog>
  )
}

function CatalogLoadMore({ remaining, onLoadMore }: { remaining: number; onLoadMore: () => void }) {
  if (remaining <= 0) return null
  const batch = Math.min(48, remaining)

  return (
    <div data-catalog-load-more className="aurora-catalog-load-more">
      <Button type="button" variant="neutral" size="sm" onClick={onLoadMore}>
        Show {batch} More
        <span aria-hidden style={{ opacity: 0.58 }}>
          {remaining} Remaining
        </span>
      </Button>
    </div>
  )
}

interface CatalogProps {
  heading?: string
  headingLevel?: 1 | 2
  /**
   * Registry item name → Kotlin counterpart file (from lib/kotlin-map.ts).
   * When provided, the catalog shows the shadcn/Android flavor toggle; the
   * Android flavor filters to ported components and swaps install lines.
   */
  kotlinMap?: Record<string, string>
  /**
   * Mirror catalog state into the URL (?flavor, ?q, ?c) so views are
   * shareable and ⌘K can deep-link a component drawer. Enabled on
   * /gallery; the landing-page catalog stays state-only.
   */
  syncUrl?: boolean
}

function CatalogInner({ heading = "The Catalog", headingLevel = 2, kotlinMap, syncUrl }: CatalogProps) {
  const searchParams = useSearchParams()
  const sectionRef = React.useRef<HTMLElement>(null)
  const pendingFocusIndexRef = React.useRef<number | null>(null)
  const drawerReturnFocusRef = React.useRef<HTMLElement | null>(null)
  const [q, setQ] = React.useState("")
  const [cat, setCat] = React.useState<string>("all")
  const [flavor, setFlavor] = React.useState<Flavor>("shadcn")
  const [open, setOpen] = React.useState<CatalogItem | null>(null)
  const [visibleLimit, setVisibleLimit] = React.useState(48)
  const [loadAnnouncement, setLoadAnnouncement] = React.useState("")

  // URL → state. Runs on mount and whenever navigation (⌘K, back/forward)
  // changes the params. setState-in-effect is the correct tool: the URL is
  // external state that isn't known during SSG prerender.
  React.useEffect(() => {
    if (!syncUrl) return
    /* eslint-disable react-hooks/set-state-in-effect */
    const uq = searchParams.get("q") ?? ""
    const uf: Flavor = searchParams.get("flavor") === "android" && kotlinMap ? "android" : "shadcn"
    const uc = searchParams.get("c")
    setQ((cur) => (cur === uq ? cur : uq))
    setFlavor((cur) => (cur === uf ? cur : uf))
    setVisibleLimit(48)
    setOpen((cur) => {
      const target = uc ? (ITEMS.find((i) => i.slug === uc) ?? null) : null
      return (cur?.slug ?? null) === (target?.slug ?? null) ? cur : target
    })
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [syncUrl, searchParams, kotlinMap])

  // State → URL (replaceState keeps history clean while typing; Next syncs
  // the native history API back into useSearchParams).
  const updateUrl = React.useCallback(
    (patch: Record<string, string | null>) => {
      if (!syncUrl) return
      const params = new URLSearchParams(window.location.search)
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") params.delete(k)
        else params.set(k, v)
      }
      const qs = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""))
    },
    [syncUrl],
  )

  const pick = React.useCallback(
    (item: CatalogItem | null) => {
      if (item && !open) drawerReturnFocusRef.current = document.activeElement as HTMLElement | null
      setOpen(item)
      updateUrl({ c: item?.slug ?? null })
    },
    [open, updateUrl],
  )

  const android = !!kotlinMap && flavor === "android"
  const flavorItems = React.useMemo(
    () => (android ? ITEMS.filter((i) => i.registry && kotlinMap[i.registry]) : ITEMS),
    [android, kotlinMap],
  )

  const list = React.useMemo(() => {
    let l = flavorItems
    if (cat !== "all") l = l.filter((i) => i.group === cat)
    if (q) {
      l = l
        .map((i) => ({
          i,
          s: Math.max(fuzzy(q, i.label), fuzzy(q, i.desc) * 0.7, fuzzy(q, i.group) * 0.6),
        }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.i)
    }
    return l
  }, [flavorItems, q, cat])

  const visibleItems = list.slice(0, visibleLimit)
  const loadMore = React.useCallback(
    () => {
      const start = Math.min(visibleLimit, list.length)
      const nextLimit = Math.min(start + 48, list.length)
      const added = nextLimit - start
      if (added <= 0) return
      pendingFocusIndexRef.current = start
      setVisibleLimit(nextLimit)
      setLoadAnnouncement(`${added} components added, ${list.length - nextLimit} remaining`)
    },
    [list.length, visibleLimit],
  )

  React.useEffect(() => {
    const index = pendingFocusIndexRef.current
    if (index === null) return
    const tile = sectionRef.current?.querySelectorAll<HTMLElement>(".aurora-catalog-tile")[index]
    const openButton = tile?.querySelector<HTMLElement>("[data-catalog-open]")
    if (!openButton) return
    pendingFocusIndexRef.current = null
    openButton.focus()
  }, [visibleItems.length])

  // Per-category counts for the filter pills.
  const counts = React.useMemo(() => {
    const m: Record<string, number> = { all: flavorItems.length }
    for (const it of flavorItems) m[it.group] = (m[it.group] ?? 0) + 1
    return m
  }, [flavorItems])

  const filtering = q.trim().length > 0 || cat !== "all"

  const HeadingTag = headingLevel === 1 ? "h1" : "h2"

  return (
    <section ref={sectionRef} style={{ marginTop: "clamp(28px, 4vw, 52px)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <span className="aurora-text-eyebrow" style={{ color: "var(--aurora-text-muted)" }}>
            {heading}
          </span>
          <HeadingTag className="aurora-text-display-1" style={{ margin: "8px 0 0" }}>
            {android ? "Android · Compose" : "Components"}{" "}
            <span
              style={{
                fontFamily: "var(--aurora-font-sans)",
                fontWeight: 500,
                fontSize: "0.55em",
                letterSpacing: "0.01em",
                color: "var(--aurora-text-muted)",
              }}
            >
              {flavorItems.length}{" "}
              {!android ? <span className="aurora-live-dot" style={{ margin: "0 4px 1px 0", verticalAlign: "middle" }} /> : null}
              {android ? "ported" : "live"}
            </span>
          </HeadingTag>
        </div>
        {kotlinMap ? (
          <div style={{ display: "inline-flex" }}>
            {(
              [
                ["shadcn", <Monitor key="i" size={15} strokeWidth={1.6} />, "shadcn · React"],
                ["android", <Smartphone key="i" size={15} strokeWidth={1.6} />, "Android · Compose"],
              ] as [Flavor, React.ReactNode, string][]
            ).map(([id, icon, label], i) => {
              const on = flavor === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setFlavor(id)
                    setVisibleLimit(48)
                    updateUrl({ flavor: id === "android" ? "android" : null })
                  }}
                  aria-pressed={on}
                  className="aurora-text-control flex items-center gap-2 px-3.5"
                  style={{
                    height: 34,
                    cursor: "pointer",
                    borderRadius: i === 0 ? "9px 0 0 9px" : "0 9px 9px 0",
                    marginLeft: i ? -1 : 0,
                    zIndex: on ? 1 : 0,
                    position: "relative",
                    border: `1px solid ${on ? tint("--aurora-accent-primary", 42) : "var(--aurora-border-strong)"}`,
                    background: on
                      ? tint("--aurora-accent-primary", 14)
                      : "var(--aurora-control-surface)",
                    color: on ? "var(--aurora-accent-strong)" : "var(--aurora-text-muted)",
                    boxShadow: on ? "var(--aurora-active-glow)" : "var(--aurora-highlight-medium)",
                  }}
                >
                  {icon}
                  {label}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* search + category chips — sticky filter bar. The tinted, blurred
          backdrop lives on a masked ::before (see .aurora-catalog-filterbar in
          site-chrome.css) so it feathers out at the bottom instead of ending on
          a hard border/box edge, and stays near-invisible at rest. */}
      <div
        className="aurora-catalog-filterbar"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 16,
          padding: "12px 0 18px",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 460,
            height: 42,
            padding: "0 12px",
            borderRadius: "var(--aurora-radius-1)",
            border: "1px solid var(--aurora-border-strong)",
            background: "var(--aurora-control-surface)",
          }}
        >
          <Search size={16} style={{ color: "var(--aurora-text-muted)", flexShrink: 0 }} />
          <input
            aria-label="Search Components"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setVisibleLimit(48)
              updateUrl({ q: e.target.value })
            }}
            placeholder="Fuzzy-search components…"
            className="aurora-text-control"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--aurora-text-primary)",
            }}
          />
          {q ? (
            <button
              type="button"
              onClick={() => {
                setQ("")
                setVisibleLimit(48)
                updateUrl({ q: null })
              }}
              aria-label="Clear search"
              style={{ display: "flex", color: "var(--aurora-text-muted)" }}
            >
              <X size={14} />
            </button>
          ) : null}
        </label>

        <div className="aurora-catalog-chips" role="group" aria-label="Component Categories">
          {["all", ...GROUPS].map((g) => {
            const on = cat === g
            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setCat(g)
                  setVisibleLimit(48)
                }}
                data-on={on ? "true" : "false"}
                aria-pressed={on}
                className="aurora-text-control aurora-cat-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 11px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: on
                    ? `1px solid ${tint("--aurora-accent-primary", 45)}`
                    : "1px solid var(--aurora-border-default)",
                  background: on ? tint("--aurora-accent-primary", 12) : "transparent",
                  color: on ? "var(--aurora-accent-strong)" : "var(--aurora-text-muted)",
                }}
              >
                {g === "all" ? <LayoutGrid size={13} /> : null}
                {g === "all" ? "All" : g}
                <span
                  aria-hidden
                  style={{
                    fontSize: "0.82em",
                    fontVariantNumeric: "tabular-nums",
                    opacity: 0.7,
                    color: on ? "var(--aurora-accent-strong)" : "var(--aurora-text-muted)",
                  }}
                >
                  {counts[g] ?? 0}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* result count + keyboard hint */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          minHeight: 18,
          marginBottom: 12,
          fontFamily: "var(--aurora-font-sans)",
        }}
      >
        <span className="sr-only" role="status" aria-live="polite">
          {loadAnnouncement}
        </span>
        <span data-catalog-result-count style={{ fontSize: 11.5, color: "var(--aurora-text-muted)" }}>
          {filtering
            ? `${list.length} ${list.length === 1 ? "result" : "results"}`
            : ""}
        </span>
        <span style={{ fontSize: 11, color: "var(--aurora-text-muted)", opacity: 0.7 }}>
          Tab to focus · Enter to open
        </span>
      </div>

      {/* grid */}
      {list.length === 0 ? (
        <div style={{ padding: "clamp(32px, 8vh, 72px) 0", display: "flex", justifyContent: "center" }}>
          <EmptyState
            icon={<SearchX size={24} aria-hidden />}
            title={q ? `No matches for “${q}”` : "Nothing in this category"}
            description={
              q
                ? `No components match your search. Try a shorter query, or clear the filters to see all ${catalog.counts.catalogItems}.`
                : "This category is empty in the current flavor. Clear the filters to browse everything."
            }
            action={
              <Button
                variant="aurora"
                size="sm"
                onClick={() => {
                  setQ("")
                  setCat("all")
                  setVisibleLimit(48)
                  updateUrl({ q: null })
                }}
              >
                Clear Filters
              </Button>
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(236px, 1fr))",
            gap: 16,
          }}
        >
          {visibleItems.map((c, i) => (
            <CatalogTile
              key={c.slug}
              item={c}
              delayMs={Math.min(i, 11) * 32}
              android={android}
              kotlin={android && c.registry ? kotlinMap?.[c.registry] : undefined}
              onPick={pick}
            />
          ))}
          <CatalogLoadMore remaining={Math.max(list.length - visibleLimit, 0)} onLoadMore={loadMore} />
        </div>
      )}

      {open ? (
        <LiveDrawer
          item={open}
          list={list.length > 0 ? list : flavorItems}
          kotlin={android && open.registry ? kotlinMap?.[open.registry] : undefined}
          onPick={pick}
          onClose={() => pick(null)}
          onRestoreFocus={() => drawerReturnFocusRef.current?.focus()}
        />
      ) : null}
    </section>
  )
}

/**
 * useSearchParams requires a Suspense boundary under static prerendering, so
 * the exported catalog wraps the stateful inner component.
 */
export function ComponentCatalog(props: CatalogProps) {
  return (
    <React.Suspense fallback={null}>
      <CatalogInner {...props} />
    </React.Suspense>
  )
}

export default ComponentCatalog
