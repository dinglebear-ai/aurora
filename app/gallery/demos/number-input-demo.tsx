"use client"

import * as React from "react"
import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { NumberInput } from "@/registry/aurora/ui/number-input"

export default function NumberInputDemo() {
  const [value, setValue] = React.useState(4)
  return (
    <div className="grid gap-6">
      <GalleryPageIntro
        eyebrow="Components"
        heading="Number Input"
        description="A stepper-bound numeric field: decrement and increment buttons flank a centered value, clamped to min/max and advanced by step."
      />
      <section
        style={{
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 60px",
          borderRadius: "var(--aurora-radius-2)",
          border: "1px solid var(--aurora-border-strong)",
          background: "var(--aurora-page-bg)",
          color: "var(--aurora-text-primary)",
        }}
      >
        <div style={{ width: 260 }}>
          <NumberInput aria-label="Worker count" value={value} min={0} max={16} onValueChange={setValue} />
        </div>
      </section>
    </div>
  )
}
