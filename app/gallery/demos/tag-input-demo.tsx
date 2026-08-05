"use client"

import * as React from "react"
import { TagInput } from "@/registry/aurora/ui/tag-input"
import { GalleryPageIntro } from "@/components/gallery-page-intro"

const label: React.CSSProperties = {
  color: "var(--aurora-text-primary)",
  fontFamily: "var(--aurora-font-sans)",
  fontSize: 12,
  fontWeight: 560,
  margin: "0 0 8px",
}

export default function TagInputDemo() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 0 }}>
      <GalleryPageIntro
        eyebrow="Aurora Extensions"
        heading="TagInput"
        description="Aurora extension · Enter to add chips."
      />

      <div style={{ maxWidth: 440 }}>
        <div style={label}>Tags</div>
        <TagInput aria-label="Tags" defaultValue={["rag", "search", "embeddings"]} />
      </div>
    </div>
  )
}
