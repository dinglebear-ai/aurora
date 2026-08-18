import { CheckCheck, Sparkles } from "lucide-react"

import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { Marker, MarkerContent, MarkerIcon } from "@/registry/aurora/ui/marker"
import { Spinner } from "@/registry/aurora/ui/spinner"

export default function MarkerDemo() {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <GalleryPageIntro
        eyebrow="Chat Primitives"
        heading="Marker"
        description="Lightweight timeline and state annotations for temporal separators, context transitions, live status, and completed events."
      />
      <div className="flex max-w-[720px] flex-col gap-7 rounded-[16px] border p-5" style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-page-bg)" }}>
        <Marker variant="separator"><MarkerContent>Today</MarkerContent></Marker>
        <Marker variant="border"><MarkerIcon><CheckCheck aria-hidden="true" /></MarkerIcon><MarkerContent>Conversation context synchronized</MarkerContent></Marker>
        <Marker role="status"><MarkerIcon><Spinner size="sm" tone="rose" /></MarkerIcon><MarkerContent>Aurora is composing a response</MarkerContent></Marker>
        <Marker><MarkerIcon><Sparkles aria-hidden="true" /></MarkerIcon><MarkerContent>Interactive checkpoint ready</MarkerContent></Marker>
      </div>
    </div>
  )
}
