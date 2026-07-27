"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Moon, Search, Sun, X } from "lucide-react"

function GithubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  )
}
import { LabbyMark, AuroraWordmark } from "@/components/labby-brand"
import { SiteCommandPalette } from "@/components/site/site-command-palette"
import { useCommandPalette } from "@/registry/aurora/blocks/workspace/command-palette/command-palette"
import { tint } from "@/components/site/style-tokens"
import { readBrowserStorage, writeBrowserStorage } from "@/lib/browser-storage"

const NAV = [
  { label: "Components", href: "/components" },
  { label: "Themes", href: "/themes" },
  { label: "Plugins", href: "/plugins" },
  { label: "Tokens", href: "/tokens" },
  { label: "Icons", href: "/icons" },
  { label: "Docs", href: "/docs" },
]

const GITHUB_URL = "https://github.com/jmagar/aurora"

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  if (href === "/themes") return pathname === "/themes" || pathname.startsWith("/themes/")
  if (href === "/components") return pathname.startsWith("/components") || pathname.startsWith("/gallery")
  if (href === "/docs") return pathname === "/docs" || pathname.startsWith("/docs/")
  return pathname.startsWith(href)
}

/** Nav link chrome. */
function navLinkStyle(active: boolean): React.CSSProperties {
  return {
    color: active ? "var(--aurora-text-primary)" : "var(--aurora-text-muted)",
    background: active ? "var(--aurora-control-surface)" : "transparent",
    borderColor: active ? tint("--aurora-accent-primary", 28) : "transparent",
    boxShadow: active ? `0 0 0 1px ${tint("--aurora-accent-primary", 12)}` : "none",
  }
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [light, setLight] = React.useState(false)
  const [still, setStill] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { open: cmdOpen, onOpenChange: onCmdOpenChange, setOpen: setCmdOpen } = useCommandPalette()

  // Close the mobile menu once navigation lands somewhere.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset driven by route change
    setMenuOpen(false)
  }, [pathname])

  // Sync external client-only state (persisted theme + URL flags) into React on
  // mount. setState-in-effect is the correct tool here — the values aren't known
  // until the client, and reading them in a useState initializer would mismatch
  // SSR hydration.
  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = readBrowserStorage(() => window.localStorage, "aurora-site-theme")
    if (stored === "light") setLight(true)
    const p = new URLSearchParams(window.location.search)
    if (p.get("still") === "1") setStill(true)
    if (p.get("theme") === "light") setLight(true)
    if (p.get("theme") === "dark") setLight(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", light)
    document.documentElement.classList.toggle("dark", !light)
    document.documentElement.style.colorScheme = light ? "light" : "dark"
    writeBrowserStorage(() => window.localStorage, "aurora-site-theme", light ? "light" : "dark")
  }, [light])

  return (
    <div
      className={`aurora-page-shell${still ? " aurora-still" : ""}`}
      style={{ position: "relative", overflow: "clip", minHeight: "100vh" }}
    >
      <div aria-hidden className="aurora-grain" />

      <header
        className="sticky top-0 z-40 flex items-center gap-4 px-5 py-3 md:px-10"
        style={{
          background: tint("--aurora-nav-bg", 84),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--aurora-border-default)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="Aurora home">
          <LabbyMark size={26} />
          <AuroraWordmark fontSize={17} />
          <span
            className="aurora-text-meta ml-0.5 hidden pl-2 sm:inline"
            style={{ color: "var(--aurora-text-muted)", borderLeft: "1px solid var(--aurora-border-strong)" }}
          >
            Design System
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="aurora-text-control rounded-[10px] border px-3 py-[7px] transition-colors"
                style={navLinkStyle(active)}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        <button
          onClick={() => setCmdOpen(true)}
          aria-label="Search — open the command palette"
          className="aurora-text-control hidden h-[34px] items-center gap-2 rounded-[10px] px-3 sm:flex"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,.045), rgba(0,0,0,.1))",
            border: "1px solid var(--aurora-border-strong)",
            color: "var(--aurora-text-muted)",
            boxShadow: "var(--aurora-highlight-medium)",
          }}
        >
          <Search size={14} strokeWidth={1.75} />
          <span className="aurora-text-control" style={{ color: "var(--aurora-text-muted)" }}>
            Search
          </span>
          <span className="ml-1 flex gap-[3px]">
            {["⌘", "K"].map((k) => (
              <kbd
                key={k}
                className="aurora-text-code rounded-[5px] px-[5px] py-[1px]"
                style={{
                  fontSize: 10,
                  background: "var(--aurora-control-surface)",
                  border: "1px solid var(--aurora-border-default)",
                  color: "var(--aurora-text-muted)",
                }}
              >
                {k}
              </kbd>
            ))}
          </span>
        </button>
        <button
          onClick={() => setLight((v) => !v)}
          aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
          title={light ? "Dark mode" : "Light mode"}
          className="grid size-[34px] place-items-center rounded-[10px]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,.045), rgba(0,0,0,.1))",
            border: "1px solid var(--aurora-border-strong)",
            color: "var(--aurora-text-primary)",
            boxShadow: "var(--aurora-highlight-medium)",
          }}
        >
          {light ? <Moon size={15} strokeWidth={1.75} /> : <Sun size={15} strokeWidth={1.75} />}
        </button>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
          title="GitHub"
          className="grid size-[34px] place-items-center rounded-[10px]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,.045), rgba(0,0,0,.1))",
            border: "1px solid var(--aurora-border-strong)",
            color: "var(--aurora-text-primary)",
            boxShadow: "var(--aurora-highlight-medium)",
          }}
        >
          <GithubIcon size={15} />
        </a>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="grid size-[34px] place-items-center rounded-[10px] md:hidden"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,.045), rgba(0,0,0,.1))",
            border: "1px solid var(--aurora-border-strong)",
            color: "var(--aurora-text-primary)",
            boxShadow: "var(--aurora-highlight-medium)",
          }}
        >
          {menuOpen ? <X size={16} strokeWidth={1.75} /> : <Menu size={16} strokeWidth={1.75} />}
        </button>
      </header>

      {menuOpen ? (
        <nav
          aria-label="Site navigation"
          className="sticky top-[59px] z-40 flex flex-col gap-1 px-5 py-3 md:hidden"
          style={{
            background: tint("--aurora-nav-bg", 94),
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--aurora-border-default)",
            boxShadow: "var(--aurora-shadow-medium)",
          }}
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="aurora-text-control rounded-[10px] border px-3 py-[9px] transition-colors"
                style={navLinkStyle(active)}
              >
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={() => {
              setMenuOpen(false)
              setCmdOpen(true)
            }}
            className="aurora-text-control flex items-center gap-2 rounded-[10px] border border-transparent px-3 py-[9px] text-left"
            style={{ color: "var(--aurora-text-muted)" }}
          >
            <Search size={14} strokeWidth={1.75} />
            Search
          </button>
        </nav>
      ) : null}

      <main className="relative z-10 mx-auto w-full max-w-[1160px] px-5 md:px-10">
        {children}
      </main>

      <SiteCommandPalette open={cmdOpen} onOpenChange={onCmdOpenChange} />

      <footer
        className="relative z-10 mt-20 px-5 py-8 md:px-10"
        style={{ borderTop: "1px solid var(--aurora-border-default)" }}
      >
        <div
          className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4"
          style={{ color: "var(--aurora-text-muted)" }}
        >
          <span className="aurora-text-body-sm" style={{ color: "var(--aurora-text-muted)" }}>
            Aurora design system — operator-first, built for Labby &amp; Axon.
          </span>
          <span className="aurora-text-code">aurora.tootie.tv</span>
        </div>
      </footer>
    </div>
  )
}
