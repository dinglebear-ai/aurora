import { useDeferredValue } from "react"
import type { LucideIcon } from "lucide-react"
import { Boxes, Cable, Monitor, Moon, Search, Smartphone, Sun, Tablet } from "lucide-react"

import inventoryData from "@/catalog/inventory.json"
import { GalleryShell, type GalleryShellGroup } from "@/catalog/gallery-shell"
import type { CatalogInventory, CatalogMode, MobileReadiness } from "@/catalog/types"
import { AuroraWordmark, LabbyLockup } from "@/components/labby-brand"
import { Badge } from "@/registry/aurora/ui/badge"
import { Button } from "@/registry/aurora/ui/button"
import { Card, CardContent } from "@/registry/aurora/ui/card"
import { Input } from "@/registry/aurora/ui/input"
import { NativeSelect } from "@/registry/aurora/ui/native-select"
import { Segmented } from "@/registry/aurora/ui/segmented"

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

  const groups: readonly GalleryShellGroup[] = mode === "registry"
    ? inventory.groups
        .map((groupName) => ({
          id: groupName,
          label: groupName,
          items: filteredItems
            .filter((item) => item.group === groupName)
            .map((item) => ({
              id: item.id,
              label: (
                <span className="catalog-gallery-link-copy">
                  <strong>{item.title}</strong>
                  <small>{item.mobileReadiness}</small>
                </span>
              ),
            })),
        }))
        .filter((navGroup) => navGroup.items.length > 0)
    : []

  return (
    <div
      className={theme === "dark" ? "catalog-theme dark" : "catalog-theme light"}
      data-catalog-root="true"
      data-catalog-mode={mode}
      data-catalog-selected-id={selectedEntry.id}
      data-catalog-device={activeDevice.id}
    >
      <GalleryShell
        layout="viewport"
        className="catalog-gallery-shell"
        mainClassName="catalog-gallery-main"
        navAriaLabel="Aurora registry catalog"
        brand={
          <LabbyLockup
            markSize={28}
            wordmark={<AuroraWordmark fontSize={17} />}
            subtitle="Device Catalog"
          />
        }
        actions={
          <>
            <Badge tone="success" dot>{runtime}</Badge>
            <button
              type="button"
              className="aurora-gallery-button aurora-gallery-button--icon"
              aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
              onClick={() => update({ theme: theme === "dark" ? "light" : "dark" })}
            >
              {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
            </button>
          </>
        }
        groups={groups}
        activeId={mode === "registry" ? selectedEntry.id : undefined}
        activeLabel={mode === "registry" ? selectedEntry.title : "Platform capabilities"}
        navigationKey={`${mode}:${selectedEntry.id}`}
        navLead={
          <>
            <Segmented
              size="sm"
              value={mode}
              onValueChange={(value) => update({ mode: value as CatalogMode }, "push")}
              options={[
                { value: "registry", label: <span className="flex items-center gap-2"><Boxes aria-hidden />Registry</span> },
                { value: "capabilities", label: <span className="flex items-center gap-2"><Cable aria-hidden />Platform</span> },
              ]}
            />
            {mode === "registry" ? (
              <>
                <Input aria-label="Search catalog" value={query} onChange={(event) => update({ query: event.target.value })} placeholder="Search 176 items" startAdornment={<Search aria-hidden />} />
                <div className="catalog-filter-pair">
                  <NativeSelect aria-label="Filter by group" value={group} onChange={(event) => update({ group: event.target.value })}>
                    <option value="all">All groups</option>
                    {inventory.groups.map((value) => <option key={value} value={value}>{value}</option>)}
                  </NativeSelect>
                  <NativeSelect aria-label="Filter by mobile readiness" value={readiness} onChange={(event) => update({ readiness: event.target.value as "all" | MobileReadiness })}>
                    <option value="all">All readiness</option>
                    {READINESS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                  </NativeSelect>
                </div>
                <div className="catalog-count-row"><span>{filteredItems.length} shown</span><span>{inventory.counts.galleryPreviews} live</span></div>
              </>
            ) : (
              <Card elevated={false}>
                <CardContent className="flex flex-col gap-3">
                  <strong>Platform capability lab</strong>
                  <p className="m-0 text-sm text-[var(--aurora-text-muted)]">Exercise native seams without duplicating the component library.</p>
                  <Badge tone="info">7 capability checks</Badge>
                </CardContent>
              </Card>
            )}
          </>
        }
        navEmpty={<p className="catalog-empty">No registry items match these filters.</p>}
        renderItem={(item, active, closeNavigation) => (
          <button
            type="button"
            className="aurora-gallery-link catalog-gallery-link"
            data-catalog-item-id={item.id}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              update({ selectedId: item.id, mode: "registry" }, "push")
              closeNavigation()
            }}
          >
            {item.label}
          </button>
        )}
      >
        <div className="catalog-gallery-page">
          <section className="catalog-preview-header">
            <div className="catalog-page-heading">
              <p className="aurora-text-eyebrow">{mode === "registry" ? selectedEntry.group : "Runtime verification"}</p>
              <div className="catalog-title-row">
                <h1 className="aurora-text-display-1">{mode === "registry" ? selectedEntry.title : "Platform capabilities"}</h1>
                {mode === "registry" ? <ReadinessBadge readiness={selectedEntry.mobileReadiness} /> : <Badge tone="info">shared UI, native bridges</Badge>}
                {mode === "registry" ? <Badge tone="neutral" fill="outline">{selectedEntry.registryType.replace("registry:", "")}</Badge> : null}
              </div>
              <p>{mode === "registry" ? selectedEntry.description : "Run the same capability checks in a browser, Tauri desktop, and the Tauri Android catalog."}</p>
              {mode === "registry" ? <div className="catalog-capability-tags">{selectedEntry.capabilities.map((capability) => <Badge key={capability} tone="neutral" fill="outline">{capability}</Badge>)}</div> : null}
            </div>
            <div className="catalog-device-switcher" aria-label="Preview viewport">
              {DEVICE_PRESETS.map((preset) => {
                const Icon = preset.icon
                return <Button key={preset.id} size="sm" shape="pill" variant={preset.id === activeDevice.id ? "aurora" : "ghost"} onClick={() => update({ devicePresetId: preset.id })}><Icon aria-hidden />{preset.label}</Button>
              })}
            </div>
          </section>

          <section className="catalog-stage" aria-label={mode === "registry" ? selectedEntry.title + " preview" : "Platform capability preview"}>
            <div className="catalog-device-frame" data-device={activeDevice.id} style={{ width: activeDevice.width }}>
              <div className="catalog-device-bar"><span>{activeDevice.label} viewport</span><span>{activeDevice.width}</span></div>
              <Card elevated={false} className="catalog-preview-card">
                <CardContent className="catalog-preview-content">
                  {mode === "registry" ? <RegistryPreview key={selectedEntry.id} item={selectedEntry} /> : <PlatformCapabilities />}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </GalleryShell>
    </div>
  )
}

function ReadinessBadge({ readiness }: { readiness: MobileReadiness }) {
  const tone = readiness === "ready" ? "success" : readiness === "native-bridge" ? "warn" : readiness === "desktop-first" ? "rose" : readiness === "metadata-only" ? "neutral" : "info"
  return <Badge tone={tone} shape="pill">{readiness}</Badge>
}
