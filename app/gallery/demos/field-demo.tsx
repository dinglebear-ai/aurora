"use client"

import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { Field } from "@/registry/aurora/ui/field"
import { Input } from "@/registry/aurora/ui/input"

export default function FieldDemo() {
  return (
    <div className="grid gap-6">
      <GalleryPageIntro
        eyebrow="Components"
        heading="Field"
        description="A form row that pairs a label, optional description, and inline validation with any control — required marker and an error message that announces to assistive tech."
      />
      <section
        style={{
          boxSizing: "border-box",
          width: "100%",
          maxWidth: 460,
          padding: "26px 30px",
          borderRadius: "var(--aurora-radius-2)",
          border: "1px solid var(--aurora-border-strong)",
          background: "var(--aurora-page-bg)",
          color: "var(--aurora-text-primary)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <Field
          label="Gateway URL"
          description="Host and port of the control plane."
          htmlFor="gateway-url"
          required
        >
          <Input id="gateway-url" defaultValue="labby.local:8765" />
        </Field>

        <Field label="API Token" htmlFor="api-token" error="Token is required.">
          <Input id="api-token" error placeholder="ghp_…" />
        </Field>
      </section>
    </div>
  )
}
