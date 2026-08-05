"use client"

import * as React from "react"
import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { SpeechInput } from "@/registry/aurora/blocks/ai/elements/speech-input"

// CD-parity composition for the SpeechInput AI element: a voice-capture panel in
// its recording state — pink mic, pulsing rose LISTENING status, live level
// meter, stop toggle, and a transcript area carrying the in-progress dictation.
export default function AiSpeechInputDemo() {
  return (
    <div className="grid gap-6">
      <GalleryPageIntro
        eyebrow="AI elements / speech-input"
        heading="Speech Input"
        description="Voice capture with a mic toggle, a live level meter, and a transcript area."
      />
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "11px",
          padding: "22px 26px",
          borderRadius: "var(--aurora-radius-2)",
          border: "1px solid var(--aurora-border-strong)",
          background: "var(--aurora-page-bg)",
          boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)",
        }}
      >
        <SpeechInput
          aria-label="Speech transcript"
          defaultRecording
          defaultValue="Migrate the schema table, then re-run the ingest job…"
        />
      </section>
    </div>
  )
}
