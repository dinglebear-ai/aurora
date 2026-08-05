"use client"

import * as React from "react"
import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { NativeSelect } from "@/registry/aurora/ui/native-select"

const section: React.CSSProperties = {
  display: "grid",
  gap: 24,
}

// CD dsCard chrome: navy page surface, generous padding, the control sits alone.
const stage: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  minHeight: 150,
  padding: "48px 40px",
  borderRadius: "var(--aurora-radius-3)",
  border: "1px solid var(--aurora-border-default)",
  background: "var(--aurora-page-bg)",
  boxSizing: "border-box",
}

const control: React.CSSProperties = {
  width: 300,
  maxWidth: "100%",
}

export default function NativeSelectDemo() {
  return (
    <div style={section}>
      <GalleryPageIntro
        eyebrow="Form elements"
        heading="Native Select"
        description="The native select uses the operating system menu and browser-managed interaction, recolored to Aurora tokens with a capsule surface and muted chevron."
      />

      <div style={stage}>
        <div style={control}>
          <NativeSelect aria-label="Deployment environment" defaultValue="prod">
            <option value="prod">Production</option>
            <option value="staging">Staging</option>
            <option value="local">Local</option>
          </NativeSelect>
        </div>
      </div>
    </div>
  )
}
