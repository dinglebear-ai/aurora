import { useEffect, useReducer, useRef } from "react"

import type { CatalogMode, MobileReadiness } from "@/catalog/types"

export type CatalogDevicePreset = "fluid" | "tablet" | "phone"
export type CatalogTheme = "dark" | "light"

export interface CatalogLocationState {
  mode: CatalogMode
  selectedId: string
  devicePresetId: CatalogDevicePreset
  theme: CatalogTheme
  group: string
  readiness: "all" | MobileReadiness
  query: string
}

type HistoryIntent = "push" | "replace" | "none"
type CatalogLocationAction =
  | { type: "patch"; patch: Partial<CatalogLocationState> }
  | { type: "hydrate"; state: CatalogLocationState }

const DEFAULT_ITEM_ID = "aurora-button"
const DEFAULT_STATE: CatalogLocationState = {
  mode: "registry",
  selectedId: DEFAULT_ITEM_ID,
  devicePresetId: "fluid",
  theme: "dark",
  group: "all",
  readiness: "all",
  query: "",
}
const DEVICES = new Set<CatalogDevicePreset>(["fluid", "tablet", "phone"])
const THEMES = new Set<CatalogTheme>(["dark", "light"])
const READINESS = new Set<MobileReadiness>(["ready", "adaptive", "native-bridge", "desktop-first", "metadata-only"])

function reducer(state: CatalogLocationState, action: CatalogLocationAction): CatalogLocationState {
  if (action.type === "hydrate") return action.state
  return { ...state, ...action.patch }
}

export function useCatalogLocation(validIds: ReadonlySet<string>, validGroups: ReadonlySet<string>) {
  const [state, dispatchBase] = useReducer(
    reducer,
    undefined,
    () => readCatalogLocation(validIds, validGroups),
  )
  const historyIntent = useRef<HistoryIntent>("replace")
  const historyDepth = useRef(readHistoryDepth(window.history.state))
  const mounted = useRef(false)

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      historyIntent.current = "none"
      historyDepth.current = readHistoryDepth(event.state)
      dispatchBase({ type: "hydrate", state: readCatalogLocation(validIds, validGroups) })
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [validGroups, validIds])

  useEffect(() => {
    const intent = historyIntent.current
    const url = formatCatalogLocation(state)
    if (!mounted.current || intent === "replace") {
      history.replaceState(catalogHistoryState(historyDepth.current), "", url)
    } else if (intent === "push") {
      historyDepth.current += 1
      history.pushState(catalogHistoryState(historyDepth.current), "", url)
    }
    mounted.current = true
    historyIntent.current = "replace"
    document.title = state.mode === "capabilities"
      ? "Platform Capabilities · Aurora Device Catalog"
      : `${titleFromId(state.selectedId)} · Aurora Device Catalog`
  }, [state])

  const update = (patch: Partial<CatalogLocationState>, intent: Exclude<HistoryIntent, "none"> = "replace") => {
    historyIntent.current = intent
    dispatchBase({ type: "patch", patch })
  }

  return { state, update }
}

export function readCatalogLocation(validIds: ReadonlySet<string>, validGroups: ReadonlySet<string>): CatalogLocationState {
  const base = normalizedBase()
  const relativePath = window.location.pathname.startsWith(base)
    ? window.location.pathname.slice(base.length)
    : window.location.pathname.replace(/^\/+/, "")
  const route = decodeURIComponent(relativePath.split("/").filter(Boolean)[0] ?? "")
  const params = new URLSearchParams(window.location.search)
  const device = params.get("device") as CatalogDevicePreset | null
  const theme = params.get("theme") as CatalogTheme | null
  const requestedGroup = params.get("group")
  const requestedReadiness = params.get("readiness") as MobileReadiness | null
  const isPlatform = route === "platform"
  const selectedId = !isPlatform && validIds.has(route) ? route : DEFAULT_ITEM_ID

  return {
    ...DEFAULT_STATE,
    mode: isPlatform ? "capabilities" : "registry",
    selectedId,
    devicePresetId: device && DEVICES.has(device) ? device : DEFAULT_STATE.devicePresetId,
    theme: theme && THEMES.has(theme) ? theme : DEFAULT_STATE.theme,
    group: requestedGroup && validGroups.has(requestedGroup) ? requestedGroup : "all",
    readiness: requestedReadiness && READINESS.has(requestedReadiness) ? requestedReadiness : "all",
    query: params.get("q") ?? "",
  }
}

export function formatCatalogLocation(state: CatalogLocationState) {
  const route = state.mode === "capabilities" ? "platform" : state.selectedId
  const params = new URLSearchParams()
  if (state.devicePresetId !== DEFAULT_STATE.devicePresetId) params.set("device", state.devicePresetId)
  if (state.theme !== DEFAULT_STATE.theme) params.set("theme", state.theme)
  if (state.group !== "all") params.set("group", state.group)
  if (state.readiness !== "all") params.set("readiness", state.readiness)
  if (state.query.trim()) params.set("q", state.query.trim())
  const query = params.toString()
  return `${normalizedBase()}${encodeURIComponent(route)}${query ? `?${query}` : ""}`
}

function normalizedBase() {
  const base = import.meta.env.BASE_URL || "/"
  return base.endsWith("/") ? base : `${base}/`
}

function catalogHistoryState(depth: number) {
  return { auroraCatalog: true, auroraCatalogDepth: depth }
}

function readHistoryDepth(state: unknown) {
  if (!state || typeof state !== "object") return 0
  const depth = Reflect.get(state, "auroraCatalogDepth")
  return typeof depth === "number" && Number.isFinite(depth) && depth >= 0 ? depth : 0
}

function titleFromId(id: string) {
  return id
    .replace(/^aurora-/, "")
    .split("-")
    .map((word) => word === "ai" ? "AI" : word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
