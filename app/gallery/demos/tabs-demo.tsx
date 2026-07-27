"use client"

import * as React from "react"
import { Badge } from "@/registry/aurora/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/aurora/ui/card"
import { PillGroup, PillTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aurora/ui/tabs"
import { GalleryPageIntro } from "@/components/gallery-page-intro"

/* Mirrors the Claude Design Tabs preview 1:1 — underline tabs with the
   animated glowing accent indicator, rendered with the registry Radix Tabs. */

export default function TabsDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <GalleryPageIntro
        eyebrow="Navigation"
        heading="Tabs & Pills"
        description="Underline tabs with live panels plus the pill-group variant for compact segmented choices. Disabled states stay visible without losing the active context."
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="a11y" disabled>A11y</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Current registry health for the active surface.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Badge tone="success" dot>Registry live</Badge>
              <Badge tone="info">17 owned primitives</Badge>
              <Badge tone="rose">Navigation lane</Badge>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Tokens</CardTitle>
              <CardDescription>Cyan stays primary, rose stays secondary, and panels remain token-only.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 aurora-text-body-sm">
              <span>Page shell uses the dark-first Aurora wash.</span>
              <span>Selection reads as border plus glow, not flooded fill.</span>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle>Pill Group</CardTitle>
              <CardDescription>Segmented choice for tight, operator-style toggles.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <PillGroup
                defaultValue="preview"
                panels={
                  <>
                    <TabsContent value="preview">Preview the active component.</TabsContent>
                    <TabsContent value="compare">Compare token and component variants.</TabsContent>
                    <TabsContent value="export">Export the selected artifact.</TabsContent>
                  </>
                }
              >
                <PillTrigger value="preview">Preview</PillTrigger>
                <PillTrigger value="compare">Compare</PillTrigger>
                <PillTrigger value="export">Export</PillTrigger>
              </PillGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
