import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const registry = JSON.parse(readFileSync(resolve(root, "registry.json"), "utf8"))
const clientCatalog = JSON.parse(readFileSync(resolve(root, "lib/client-catalog.json"), "utf8"))
const galleryManifest = JSON.parse(readFileSync(resolve(root, "lib/gallery-manifest.json"), "utf8"))
const checkOnly = process.argv.includes("--check")

const FIXTURE_BY_REGISTRY = Object.freeze({
  "aurora-button": "button",
  "aurora-card": "card",
  "aurora-badge": "feedback",
  "aurora-callout": "feedback",
  "aurora-status-indicator": "feedback",
  "aurora-input": "forms",
  "aurora-textarea": "forms",
  "aurora-switch": "forms",
  "aurora-tabs": "forms",
  "aurora-description-list": "progress",
  "aurora-stepper": "progress",
  "aurora-timeline": "progress",
  "aurora-accordion": "disclosure",
  "aurora-collapsible": "disclosure",
  "aurora-dropdown-menu": "disclosure",
  "aurora-tooltip": "disclosure",
  "aurora-dialog": "overlays",
  "aurora-alert-dialog": "overlays",
  "aurora-sheet": "overlays",
  "aurora-combobox": "widgets",
  "aurora-multi-select": "widgets",
  "aurora-radio-group": "widgets",
  "aurora-popover": "widgets",
  "aurora-gateway": "gateway-page",
  "aurora-chat": "chat-page",
  "aurora-log-viewer": "log-viewer-page",
  "aurora-palette": "palette-page",
  "aurora-files": "files-page",
})

const DEMO_BY_REGISTRY = Object.freeze({
  "aurora-terminal-block": "terminal-demo",
  "aurora-sidebar-block": "sidebar-demo",
  "aurora-login-block": "login-demo",
  "aurora-marketplace-block": "marketplace-demo",
})

const NATIVE_BRIDGE_NAMES = new Set([
  "aurora-ai-audio-player",
  "aurora-ai-mic-selector",
  "aurora-ai-speech-input",
  "aurora-ai-transcription",
  "aurora-ai-voice-selector",
  "aurora-attachment",
  "aurora-clipboard",
  "aurora-file-picker",
  "aurora-oauth",
  "aurora-share-dialog",
  "aurora-web-preview",
])

const DESKTOP_FIRST_NAMES = new Set([
  "aurora-ai-canvas",
  "aurora-chart",
  "aurora-code-editor",
  "aurora-code-workspace",
  "aurora-context-menu",
  "aurora-data-table",
  "aurora-file-tree",
  "aurora-hover-card",
  "aurora-menubar",
  "aurora-navigation-menu",
  "aurora-resizable-panels",
  "aurora-sidebar-block",
  "aurora-table",
  "aurora-terminal-block",
])

const ADAPTIVE_NAMES = new Set([
  "aurora-command-palette",
  "aurora-drawer",
  "aurora-filter-bar",
  "aurora-marketplace-block",
  "aurora-prompt-input",
  "aurora-scroll-area",
  "aurora-search-results",
  "aurora-sheet",
  "aurora-sidebar",
])

const FALLBACK_GROUPS = Object.freeze({
  "registry:base": "Registry assets",
  "registry:block": "Blocks",
  "registry:file": "Registry assets",
  "registry:item": "Registry assets",
  "registry:lib": "Registry assets",
  "registry:page": "Pages",
  "registry:style": "Foundations",
  "registry:theme": "Themes",
  "registry:ui": "Components",
})

const rowsByRegistry = new Map()
for (const row of clientCatalog.items) {
  const rows = rowsByRegistry.get(row.registry) ?? []
  rows.push(row)
  rowsByRegistry.set(row.registry, rows)
}

function directSlug(name) {
  return name.replace(/^aurora-/, "")
}

function chooseCatalogRow(item) {
  const rows = rowsByRegistry.get(item.name) ?? []
  const direct = directSlug(item.name)
  return rows.find((row) => row.slug === direct)
    ?? rows.find((row) => galleryManifest[row.slug])
    ?? rows[0]
    ?? null
}

function chooseDemo(item, row) {
  const direct = directSlug(item.name)
  const override = DEMO_BY_REGISTRY[item.name]
  if (override) return { slug: direct, moduleName: override }
  const candidates = [row?.slug, direct]
  if (direct.startsWith("ai-")) candidates.push(direct.slice(3))
  for (const slug of candidates) {
    if (!slug) continue
    const moduleName = galleryManifest[slug]
    if (moduleName && moduleName !== "parity-demo") return { slug, moduleName }
  }
  return null
}

function readinessFor(item) {
  if (["registry:base", "registry:file", "registry:item", "registry:lib", "registry:style", "registry:theme"].includes(item.type)) {
    return { status: "metadata-only", reason: "Registry asset or configuration item; no runtime component surface." }
  }
  if (NATIVE_BRIDGE_NAMES.has(item.name)) {
    return { status: "native-bridge", reason: "The React surface is shared, but full mobile behavior requires a Tauri plugin or native platform API." }
  }
  if (DESKTOP_FIRST_NAMES.has(item.name)) {
    return { status: "desktop-first", reason: "The component renders on mobile, but its dense pointer-oriented interaction needs a deliberate compact composition." }
  }
  if (item.type === "registry:page" || item.type === "registry:block" || ADAPTIVE_NAMES.has(item.name)) {
    return { status: "adaptive", reason: "Shared React implementation with responsive layout or interaction changes for phone and tablet widths." }
  }
  return { status: "ready", reason: "Shared React primitive suitable for browser, Tauri desktop, and Tauri mobile WebViews." }
}

function capabilitiesFor(item, readiness) {
  const text = [item.name, item.title, item.description, ...(item.categories ?? [])].join(" ").toLowerCase()
  const capabilities = new Set(["webview"])
  if (item.type === "registry:ui" || item.type === "registry:block" || item.type === "registry:page") capabilities.add("touch")
  if (/input|editor|command|search|form|textarea|select|combobox|otp/.test(text)) capabilities.add("keyboard")
  if (/dialog|sheet|drawer|popover|menu|tooltip|overlay/.test(text)) capabilities.add("overlay")
  if (/file|attachment|artifact|workspace/.test(text)) capabilities.add("file-system")
  if (/share/.test(text)) capabilities.add("share")
  if (/clipboard|copy/.test(text)) capabilities.add("clipboard")
  if (/audio|voice|speech|mic|transcription/.test(text)) capabilities.add("media")
  if (/oauth|url|web-preview|open-in/.test(text)) capabilities.add("external-browser")
  if (/sidebar|navigation|dialog|sheet|drawer|page/.test(text)) capabilities.add("back-navigation")
  if (readiness.status === "adaptive" || item.type === "registry:page") capabilities.add("safe-area")
  return [...capabilities].sort()
}

const items = registry.items.map((item) => {
  const row = chooseCatalogRow(item)
  const demo = chooseDemo(item, row)
  const readiness = readinessFor(item)
  const files = (item.files ?? []).map((file) => file.path)
  const sourcePath = item.meta?.sourcePath ?? files[0] ?? null
  const group = row?.group ?? FALLBACK_GROUPS[item.type] ?? "Other"

  return {
    id: item.name,
    title: item.title ?? item.name,
    description: item.description ?? "",
    registryType: item.type,
    group,
    categories: item.categories ?? [],
    sourcePath,
    installTarget: item.meta?.installTarget ?? null,
    installUrl: `https://aurora.tootie.tv/r/${item.name}.json`,
    files,
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
    fixtureId: FIXTURE_BY_REGISTRY[item.name] ?? null,
    previewSlug: demo?.slug ?? row?.slug ?? null,
    demoModule: demo?.moduleName ?? null,
    mobileReadiness: readiness.status,
    mobileReadinessReason: readiness.reason,
    capabilities: capabilitiesFor(item, readiness),
  }
})

const groups = [...new Set([...clientCatalog.groups, ...items.map((item) => item.group)])]
const output = {
  schemaVersion: 1,
  counts: {
    registryItems: items.length,
    galleryPreviews: items.filter((item) => item.demoModule).length,
    sharedFixtures: items.filter((item) => item.fixtureId).length,
    metadataOnly: items.filter((item) => item.mobileReadiness === "metadata-only").length,
  },
  groups,
  items,
}

const outputPath = resolve(root, "catalog/inventory.json")
const text = `${JSON.stringify(output, null, 2)}\n`
if (checkOnly) {
  if (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== text) {
    throw new Error("Device catalog inventory is stale; run pnpm catalog:device:generate")
  }
  console.log(`Device catalog inventory is current: ${items.length} registry items.`)
} else {
  writeFileSync(outputPath, text)
  console.log(`Generated device catalog inventory: ${items.length} registry items, ${output.counts.galleryPreviews} gallery previews.`)
}
