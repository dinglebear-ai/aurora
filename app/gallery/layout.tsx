"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"

import { NAV, NAV_SLUG_ALIASES } from "@/app/gallery/nav-data"
import { GalleryShell, type GalleryShellGroup } from "@/catalog/gallery-shell"
import { AuroraWordmark, LabbyLockup } from "@/components/labby-brand"

const GALLERY_GROUPS: readonly GalleryShellGroup[] = NAV.map((group) => ({
  id: group.group,
  label: group.group,
  items: group.items.map((item) => ({ id: item.slug, label: item.label })),
}))

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [light, setLight] = React.useState(false)

  React.useEffect(() => {
    const previousColorScheme = document.documentElement.style.colorScheme
    document.documentElement.classList.toggle("light", light)
    document.documentElement.classList.toggle("dark", !light)
    document.documentElement.style.colorScheme = light ? "light" : "dark"
    return () => {
      document.documentElement.style.colorScheme = previousColorScheme
    }
  }, [light])

  const activeSlug = React.useMemo(() => {
    const section = pathname.split("/").pop() ?? ""
    const normalized = section.startsWith("ai-") ? section.slice(3) : section
    return NAV_SLUG_ALIASES[normalized] ?? normalized
  }, [pathname])

  const activeLabel = React.useMemo(() => {
    for (const group of NAV) {
      const found = group.items.find((item) => item.slug === activeSlug)
      if (found) return found.label
    }
    return null
  }, [activeSlug])

  return (
    <GalleryShell
      brand={
        <Link href="/" aria-label="Aurora Design System home">
          <LabbyLockup
            markSize={28}
            wordmark={<AuroraWordmark fontSize={17} />}
            subtitle="Design System"
          />
        </Link>
      }
      actions={
        <button
          type="button"
          className="aurora-gallery-button aurora-gallery-button--icon"
          aria-pressed={light}
          aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
          title={light ? "Dark mode" : "Light mode"}
          onClick={() => setLight((value) => !value)}
        >
          {light ? <Moon size={15} strokeWidth={2} /> : <Sun size={15} strokeWidth={2} />}
        </button>
      }
      groups={GALLERY_GROUPS}
      activeId={activeSlug}
      activeLabel={activeLabel}
      navigationKey={pathname}
      renderItem={(item, active, closeNavigation) => (
        <Link
          href={`/gallery/${item.id}`}
          className="aurora-gallery-link"
          aria-current={active ? "page" : undefined}
          onClick={closeNavigation}
        >
          {item.label}
        </Link>
      )}
    >
      {children}
    </GalleryShell>
  )
}
