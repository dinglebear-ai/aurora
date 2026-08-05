"use client"

import * as React from "react"
import { Menu, X } from "lucide-react"

export interface GalleryShellItem {
  id: string
  label: React.ReactNode
  searchText?: string
}

export interface GalleryShellGroup {
  id: string
  label: React.ReactNode
  items: readonly GalleryShellItem[]
}

export interface GalleryShellProps {
  brand: React.ReactNode
  actions?: React.ReactNode
  groups: readonly GalleryShellGroup[]
  activeId?: string
  activeLabel?: React.ReactNode
  navigationKey?: React.Key
  navLead?: React.ReactNode
  navEmpty?: React.ReactNode
  navAriaLabel?: string
  mainId?: string
  layout?: "document" | "viewport"
  className?: string
  mainClassName?: string
  renderItem: (
    item: GalleryShellItem,
    active: boolean,
    closeNavigation: () => void,
  ) => React.ReactNode
  children: React.ReactNode
}

export function GalleryShell({
  brand,
  actions,
  groups,
  activeId,
  activeLabel,
  navigationKey,
  navLead,
  navEmpty,
  navAriaLabel = "Component gallery",
  mainId = "gallery-main",
  layout = "document",
  className,
  mainClassName,
  renderItem,
  children,
}: GalleryShellProps) {
  const [navOpen, setNavOpen] = React.useState(false)
  const mainRef = React.useRef<HTMLElement>(null)
  const closeNavigation = React.useCallback(() => setNavOpen(false), [])

  React.useEffect(() => {
    if (!navOpen) return
    const scrollY = window.scrollY
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    return () => {
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      window.scrollTo(0, scrollY)
    }
  }, [navOpen])

  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
    if (layout === "document") window.scrollTo(0, 0)
  }, [layout, navigationKey])

  return (
    <div
      className={["aurora-gallery-shell", className].filter(Boolean).join(" ")}
      data-nav-open={navOpen ? "true" : "false"}
      data-layout={layout}
    >
      <a href={`#${mainId}`} className="aurora-gallery-skip-link">
        Skip to Content
      </a>

      <div
        className="aurora-gallery-backdrop"
        aria-hidden="true"
        onClick={closeNavigation}
      />

      <nav
        className="aurora-gallery-nav"
        aria-label={navAriaLabel}
        data-open={navOpen ? "true" : "false"}
      >
        <div className="aurora-gallery-nav-header">
          <div className="aurora-gallery-brand-link">{brand}</div>

          {activeLabel ? (
            <span className="aurora-gallery-mobile-crumb" aria-hidden="true">
              {activeLabel}
            </span>
          ) : null}

          <div className="aurora-gallery-nav-actions">
            {actions}
            <button
              type="button"
              className="aurora-gallery-button aurora-gallery-button--icon aurora-gallery-menu-toggle"
              aria-controls="gallery-nav-body"
              aria-expanded={navOpen}
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setNavOpen((value) => !value)}
            >
              {navOpen ? <X size={15} strokeWidth={2.25} /> : <Menu size={15} strokeWidth={2.25} />}
            </button>
          </div>
        </div>

        <div className="aurora-gallery-nav-collapse">
          <div id="gallery-nav-body" className="aurora-gallery-nav-body">
            {navLead ? <div className="aurora-gallery-nav-lead">{navLead}</div> : null}
            {groups.map((group) => (
              <div key={group.id} className="aurora-gallery-nav-group">
                <div className="aurora-gallery-section-heading">{group.label}</div>
                {group.items.map((item) => (
                  <React.Fragment key={item.id}>
                    {renderItem(item, item.id === activeId, closeNavigation)}
                  </React.Fragment>
                ))}
              </div>
            ))}
            {groups.every((group) => group.items.length === 0) ? navEmpty : null}
          </div>
        </div>
      </nav>

      <main
        ref={mainRef}
        id={mainId}
        className={["aurora-gallery-main", mainClassName].filter(Boolean).join(" ")}
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  )
}

export default GalleryShell
