import { useDeferredValue } from "react"
import type { LucideIcon } from "lucide-react"
import { Boxes, Cable, Monitor, Moon, Search, Smartphone, Sun, Tablet } from "lucide-react"

import inventoryData from "@/catalog/inventory.json"
import type { CatalogInventory, CatalogMode, MobileReadiness } from "@/catalog/types"
import { Badge } from "@/registry/aurora/ui/badge"
import { Button } from "@/registry/aurora/ui/button"
import { Card, CardContent } from "@/registry/aurora/ui/card"
import { Input } from "@/registry/aurora/ui/input"
import { NativeSelect } from "@/registry/aurora/ui/native-select"
import { Segmented } from "@/registry/aurora/ui/segmented"
import { Separator } from "@/registry/aurora/ui/separator"

import { type CatalogDevicePreset, useCatalogLocation } from "./catalog-location"
import { PlatformCapabilities } from "./PlatformCapabilities"
import { RegistryPreview } from "./RegistryPreview"

interface DevicePreset { id: CatalogDevicePreset; label: string; width: string; icon: LucideIcon }

const inventory = inventoryData as CatalogInventory
const VALID_IDS = new Set(inventory.items.map((item) => item.id))
const VALID_GROUPS = new Set(inventory.groups)
const DEVICE_PRESETS: readonly DevicePreset[] = [
  { id: "fluid", label: "Fluid", width: "100%", icon: Monitor },
  { id: "tablet", label: "Tablet", width: "820px", icon: Tablet },
  { id: "phone", label: "Phone", width: "390px", icon: Smartphone },
]
const READINESS_OPTIONS: readonly MobileReadiness[] = ["ready", "adaptive", "native-bridge", "desktop-first", "metadata-only"]

export function App() {
  const { state, update } = useCatalogLocation(VALID_IDS, VALID_GROUPS)
  const { mode, query, group, readiness, selectedId, devicePresetId, theme } = state
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filteredItems = inventory.items.filter((item) => {
    if (group !== "all" && item.group !== group) return false
    if (readiness !== "all" && item.mobileReadiness !== readiness) return false
    if (!deferredQuery) return true
    return [item.title, item.id, item.group, item.description, ...item.categories, ...item.capabilities].join(" ").toLowerCase().includes(deferredQuery)
  })
  const selectedEntry = inventory.items.find((item) => item.id === selectedId) ?? inventory.items[0]
  const activeDevice = DEVICE_PRESETS.find((preset) => preset.id === devicePresetId) ?? DEVICE_PRESETS[0]
  const runtime = "__TAURI_INTERNALS__" in window ? "Tauri" : "Web"

  if (!selectedEntry || !activeDevice) return null

  return (
    <div
      className={theme === "dark" ? "catalog-theme dark" : "catalog-theme light"}
      data-catalog-root="true"
      data-catalog-mode={mode}
      data-catalog-selected-id={selectedEntry.id}
      data-catalog-device={activeDevice.id}
    >
      <div className="catalog-shell">
        <header className="catalog-header">
          <div className="catalog-brand"><div className="catalog-mark" aria-hidden="true"><span /><span /><span /></div><div><h1>Aurora Device Catalog</h1><p>{inventory.counts.registryItems} canonical registry items across browser and Tauri viewports.</p></div></div>
          <div className="catalog-header-actions">
            <Segmented size="sm" value={mode} onValueChange={(value) => update({ mode: value as CatalogMode }, "push")} options={[{ value: "registry", label: <span className="flex items-center gap-2"><Boxes aria-hidden />Registry</span> }, { value: "capabilities", label: <span className="flex items-center gap-2"><Cable aria-hidden />Platform</span> }]} />
            <Badge tone="success" dot>{runtime}</Badge>
            <Button size="icon" variant="ghost" aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"} onClick={() => update({ theme: theme === "dark" ? "light" : "dark" })}>{theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}</Button>
          </div>
        </header>

        <div className="catalog-workspace">
          <aside className="catalog-sidebar" aria-label="Component catalog">
            {mode === "registry" ? (
              <>
                <div className="catalog-filters">
                  <Input aria-label="Search catalog" value={query} onChange={(event) => update({ query: event.target.value })} placeholder="Search 176 items" startAdornment={<Search aria-hidden />} />
                  <NativeSelect aria-label="Filter by group" value={group} onChange={(event) => update({ group: event.target.value })}><option value="all">All groups</option>{inventory.groups.map((value) => <option key={value} value={value}>{value}</option>)}</NativeSelect>
                  <NativeSelect aria-label="Filter by mobile readiness" value={readiness} onChange={(event) => update({ readiness: event.target.value as "all" | MobileReadiness })}><option value="all">All readiness states</option>{READINESS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}</NativeSelect>
                </div>
                <div className="catalog-count-row"><span>{filteredItems.length} shown</span><span>{inventory.counts.galleryPreviews} live demos</span></div>
                <div className="catalog-nav">{filteredItems.map((item) => <Button key={item.id} block variant={item.id === selectedEntry.id ? "aurora" : "ghost"} className="catalog-nav-item" data-catalog-item-id={item.id} aria-current={item.id === selectedEntry.id ? "page" : undefined} onClick={() => update({ selectedId: item.id, mode: "registry" }, "push")}><span><strong>{item.title}</strong><small>{item.group} · {item.mobileReadiness}</small></span></Button>)}</div>
                {filteredItems.length === 0 ? <p className="catalog-empty">No registry items match these filters.</p> : null}
              </>
            ) : (
              <Card elevated={false}><CardContent className="flex flex-col gap-3"><strong>Platform capability lab</strong><p className="m-0 text-sm text-[var(--aurora-text-muted)]">Exercise clipboard, share, files, viewport, storage, and Android back-navigation seams without creating a second component library.</p><Badge tone="info">7 capability checks</Badge></CardContent></Card>
            )}
          </aside>

          <main className="catalog-main">
            <section className="catalog-preview-header">
              <div>{mode === "registry" ? <><div className="catalog-title-row"><h2>{selectedEntry.title}</h2><ReadinessBadge readiness={selectedEntry.mobileReadiness} /><Badge tone="neutral" fill="outline">{selectedEntry.registryType.replace("registry:", "")}</Badge></div><p>{selectedEntry.description}</p><div className="catalog-capability-tags">{selectedEntry.capabilities.map((capability) => <Badge key={capability} tone="neutral" fill="outline">{capability}</Badge>)}</div></> : <><div className="catalog-title-row"><h2>Platform capabilities</h2><Badge tone="info">shared UI, native bridges</Badge></div><p>Run the same checks in a browser, Tauri desktop, and the Tauri Android catalog.</p></>}</div>
              <div className="catalog-device-switcher" aria-label="Preview viewport">{DEVICE_PRESETS.map((preset) => { const Icon = preset.icon; return <Button key={preset.id} size="sm" shape="pill" variant={preset.id === activeDevice.id ? "aurora" : "ghost"} onClick={() => update({ devicePresetId: preset.id })}><Icon aria-hidden />{preset.label}</Button> })}</div>
            </section>

            <Separator />

            <section className="catalog-stage" aria-label={mode === "registry" ? selectedEntry.title + " preview" : "Platform capability preview"}>
              <div className="catalog-device-frame" data-device={activeDevice.id} style={{ width: activeDevice.width }}>
                <div className="catalog-device-bar"><span>{activeDevice.label} viewport</span><span>{activeDevice.width}</span></div>
                <Card elevated={false} className="catalog-preview-card"><CardContent className="catalog-preview-content">{mode === "registry" ? <RegistryPreview key={selectedEntry.id} item={selectedEntry} /> : <PlatformCapabilities />}</CardContent></Card>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

function ReadinessBadge({ readiness }: { readiness: MobileReadiness }) {
  const tone = readiness === "ready" ? "success" : readiness === "native-bridge" ? "warn" : readiness === "desktop-first" ? "rose" : readiness === "metadata-only" ? "neutral" : "info"
  return <Badge tone={tone} shape="pill">{readiness}</Badge>
}
