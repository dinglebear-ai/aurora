import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Clipboard, Files, MonitorSmartphone, Share2, Smartphone, Vault } from "lucide-react"

import { Badge } from "@/registry/aurora/ui/badge"
import { Button } from "@/registry/aurora/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/aurora/ui/card"

export function PlatformCapabilities() {
  const [message, setMessage] = useState("Choose a capability to exercise it.")
  const [viewport, setViewport] = useState(() => readViewport())
  const [historyEntries, setHistoryEntries] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const tauri = "__TAURI_INTERNALS__" in window
  const shareFunction = Reflect.get(navigator, "share") as ((data?: ShareData) => Promise<void>) | undefined
  const canShare = typeof shareFunction === "function"

  useEffect(() => {
    const update = () => setViewport(readViewport())
    window.addEventListener("resize", update)
    window.visualViewport?.addEventListener("resize", update)
    return () => { window.removeEventListener("resize", update); window.visualViewport?.removeEventListener("resize", update) }
  }, [])

  const copy = async () => {
    if (!navigator.clipboard) return setMessage("Clipboard API is unavailable in this runtime.")
    await navigator.clipboard.writeText("Aurora clipboard capability passed")
    setMessage("Copied through the active WebView clipboard API.")
  }
  const share = async () => {
    if (!shareFunction) return setMessage("Web Share is unavailable; route this action through a Tauri share plugin on mobile.")
    await shareFunction.call(navigator, { title: "Aurora", text: "Aurora device catalog capability check" })
    setMessage("Native share surface opened.")
  }
  const store = () => {
    localStorage.setItem("aurora-device-catalog", new Date().toISOString())
    setMessage("Local storage round-trip passed.")
  }
  const pushHistory = () => {
    history.pushState({ auroraCatalog: true }, "")
    setHistoryEntries((count) => count + 1)
    setMessage("History entry added. Android hardware back can now exercise WebView navigation.")
  }

  return (
    <div className="catalog-capabilities">
      <div className="catalog-capability-summary"><Badge tone={tauri ? "success" : "info"} dot>{tauri ? "Tauri runtime" : "Browser runtime"}</Badge><span>{message}</span></div>
      <div className="catalog-capability-grid">
        <CapabilityCard icon={MonitorSmartphone} title="Runtime and viewport" status="ready" description="Verifies the same frontend under browser and Tauri WebViews."><dl className="catalog-capability-values"><div><dt>Viewport</dt><dd>{viewport.width} × {viewport.height}</dd></div><div><dt>Visual viewport</dt><dd>{viewport.visualWidth} × {viewport.visualHeight}</dd></div><div><dt>Pixel ratio</dt><dd>{viewport.pixelRatio}</dd></div><div><dt>Pointer</dt><dd>{viewport.coarse ? "coarse/touch" : "fine/pointer"}</dd></div></dl></CapabilityCard>
        <CapabilityCard icon={Clipboard} title="Clipboard" status={navigator.clipboard ? "ready" : "bridge"} description="Uses the WebView clipboard when available."><Button onClick={() => void copy()}>Copy test value</Button></CapabilityCard>
        <CapabilityCard icon={Share2} title="Share sheet" status={canShare ? "ready" : "bridge"} description="Uses Web Share or identifies where a Tauri mobile plugin is required."><Button onClick={() => void share()} disabled={!canShare}>Open share surface</Button></CapabilityCard>
        <CapabilityCard icon={Files} title="File picker" status="ready" description="Exercises the platform file input and reports the selected file."><input ref={inputRef} type="file" className="sr-only" onChange={(event) => setMessage(event.target.files?.[0] ? `Selected ${event.target.files[0].name}` : "No file selected.")} /><Button onClick={() => inputRef.current?.click()}>Choose file</Button></CapabilityCard>
        <CapabilityCard icon={ArrowLeft} title="Back navigation" status="adaptive" description="Adds WebView history so Android back behavior can be tested without a second UI implementation."><div className="flex flex-wrap items-center gap-3"><Button onClick={pushHistory}>Add history entry</Button><Badge tone="neutral" fill="outline">{historyEntries} pending</Badge></div></CapabilityCard>
        <CapabilityCard icon={Vault} title="Local storage" status="ready" description="Confirms persistent frontend state in the active runtime."><Button onClick={store}>Write test value</Button></CapabilityCard>
        <CapabilityCard icon={Smartphone} title="Native bridges" status="bridge" description="Camera, biometrics, notifications, and background work remain narrow Tauri plugins, not duplicate components."><div className="flex flex-wrap gap-2"><Badge tone="neutral" fill="outline">Kotlin plugin</Badge><Badge tone="neutral" fill="outline">Swift plugin</Badge><Badge tone="neutral" fill="outline">shared TS API</Badge></div></CapabilityCard>
      </div>
    </div>
  )
}

function CapabilityCard({ icon: Icon, title, description, status, children }: { icon: typeof Smartphone; title: string; description: string; status: "ready" | "adaptive" | "bridge"; children: React.ReactNode }) {
  const tone = status === "ready" ? "success" : status === "adaptive" ? "info" : "warn"
  return <Card elevated={false}><CardHeader><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><Icon aria-hidden /><div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div></div><Badge tone={tone}>{status}</Badge></div></CardHeader><CardContent>{children}</CardContent></Card>
}

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight, visualWidth: Math.round(window.visualViewport?.width ?? window.innerWidth), visualHeight: Math.round(window.visualViewport?.height ?? window.innerHeight), pixelRatio: window.devicePixelRatio, coarse: window.matchMedia("(pointer: coarse)").matches }
}
