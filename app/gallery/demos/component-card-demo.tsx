"use client";

import * as React from "react";
import { GalleryPageIntro } from "@/components/gallery-page-intro";
import {
  ComponentCard,
  type ComponentCardTag,
} from "@/registry/aurora/ui/component-card";
import { Button } from "@/registry/aurora/ui/button";
import { Badge } from "@/registry/aurora/ui/badge";
import { Switch } from "@/registry/aurora/ui/switch";
import { Slider } from "@/registry/aurora/ui/slider";

type Entry = {
  name: string;
  blurb: string;
  tags: ComponentCardTag[];
  preview: React.ReactNode;
};

const ENTRIES: Entry[] = [
  {
    name: "Button",
    blurb:
      "Border-and-glow control with six intents and async, pulse, and focus states.",
    tags: [{ label: "shadcn", accent: true }, "control"],
    preview: (
      <div style={{ display: "flex", gap: 8 }}>
        <Button>Deploy</Button>
        <Button variant="rose">Stop</Button>
      </div>
    ),
  },
  {
    name: "Badge",
    blurb: "Compact status pill across neutral, accent, and semantic tones.",
    tags: ["shadcn", "status"],
    preview: (
      <div style={{ display: "flex", gap: 6 }}>
        <Badge>live</Badge>
        <Badge tone="success">ok</Badge>
        <Badge tone="rose">down</Badge>
      </div>
    ),
  },
  {
    name: "Switch",
    blurb: "On/off toggle with a hard focus ring — no soft glow.",
    tags: ["shadcn", "control"],
    preview: (
      <div style={{ display: "flex", gap: 12 }}>
        <Switch aria-label="Enabled preview" defaultChecked />
        <Switch aria-label="Disabled preview" />
      </div>
    ),
  },
  {
    name: "ColorPicker",
    blurb: "Tappable swatch grid over a curated palette; selected = hard ring.",
    tags: ["extension"],
    preview: (
      <div style={{ display: "flex", gap: 8 }}>
        {[
          "var(--aurora-accent-primary)",
          "var(--aurora-accent-pink)",
          "var(--axon-orange)",
          "var(--aurora-success)",
          "var(--aurora-error)",
        ].map((c, i) => (
          <span
            key={c}
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              background: c,
              boxShadow:
                i === 0
                  ? "0 0 0 2px var(--aurora-page-bg), 0 0 0 4px var(--aurora-accent-primary)"
                  : "none",
            }}
          />
        ))}
      </div>
    ),
  },
  {
    name: "Slider",
    blurb: "Single-value track with a cyan fill and draggable thumb.",
    tags: ["shadcn", "control"],
    preview: (
      <div style={{ width: 180 }}>
        <Slider aria-label="Preview intensity" defaultValue={62} />
      </div>
    ),
  },
];

const NAMES = ENTRIES.map((e) => e.name);

const sectionLabel: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--aurora-font-sans)",
  fontSize: "var(--aurora-type-caption)",
  fontWeight: "var(--aurora-weight-label)" as React.CSSProperties["fontWeight"],
  letterSpacing: "var(--aurora-letter-eyebrow)",
  textTransform: "uppercase",
  color: "var(--aurora-text-muted)",
  marginBottom: 9,
};

export default function ComponentCardDemo() {
  const [i, setI] = React.useState(2);
  const cur = ENTRIES[i];
  const cmp = ENTRIES[(i + 1) % ENTRIES.length];

  return (
    <div className="grid gap-6">
      <GalleryPageIntro
        eyebrow="Aurora Extensions"
        heading="ComponentCard"
        description="Gallery tile + focused viewer (nav · jump · compare) — a registry-browsing surface that renders any component's live preview, name, blurb, and tags."
      />

      <section
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "24px 26px",
          borderRadius: "var(--aurora-radius-2)",
          border: "1px solid var(--aurora-border-strong)",
          background: "var(--aurora-page-bg)",
          color: "var(--aurora-text-primary)",
        }}
      >
        <div>
          <span style={sectionLabel}>variant=&quot;tile&quot; — gallery grid (with prev/next)</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {/* First tile: current entry with prev/next cycling through all entries */}
            <ComponentCard
              {...cur}
              thumbHeight={104}
              index={i}
              total={ENTRIES.length}
              onPrev={i > 0 ? () => setI((n) => Math.max(0, n - 1)) : undefined}
              onNext={i < ENTRIES.length - 1 ? () => setI((n) => Math.min(ENTRIES.length - 1, n + 1)) : undefined}
              onOpen={() => {}}
            />
            {/* Second tile: next entry (wraps) */}
            <ComponentCard
              {...cmp}
              thumbHeight={104}
              index={(i + 1) % ENTRIES.length}
              total={ENTRIES.length}
              onPrev={() => setI((n) => Math.max(0, n - 1))}
              onNext={() => setI((n) => Math.min(ENTRIES.length - 1, n + 1))}
              onOpen={() => {}}
            />
          </div>
        </div>

        <div>
          <span style={sectionLabel}>
            variant=&quot;viewer&quot; — prev/next · jump · compare
          </span>
          <ComponentCard
            variant="viewer"
            {...cur}
            thumbHeight={120}
            index={i}
            total={ENTRIES.length}
            siblings={NAMES}
            onPrev={() => setI((n) => Math.max(0, n - 1))}
            onNext={() => setI((n) => Math.min(ENTRIES.length - 1, n + 1))}
            onJump={(name) => setI(NAMES.indexOf(name))}
            comparePreview={cmp.preview}
            compareName={cmp.name}
          />
        </div>
      </section>
    </div>
  );
}
