import { readFileSync } from "node:fs"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import type { CatalogInventory } from "../../catalog/types"

const inventory = JSON.parse(
  readFileSync(new URL("../../catalog/inventory.json", import.meta.url), "utf8"),
) as CatalogInventory
const requestedItems = new Set((process.env.AURORA_CATALOG_ITEMS ?? "").split(",").map((value) => value.trim()).filter(Boolean))
const requestedProfiles = new Set((process.env.AURORA_CATALOG_PROFILES ?? "").split(",").map((value) => value.trim()).filter(Boolean))
const items = requestedItems.size > 0 ? inventory.items.filter((item) => requestedItems.has(item.id)) : inventory.items
const profiles = [
  { id: "desktop-fluid", viewport: { width: 1440, height: 1000 }, device: "fluid" },
  { id: "tablet", viewport: { width: 1180, height: 900 }, device: "tablet" },
  { id: "phone-portrait", viewport: { width: 430, height: 932 }, device: "fluid" },
  { id: "phone-landscape", viewport: { width: 932, height: 430 }, device: "fluid" },
].filter((profile) => requestedProfiles.size === 0 || requestedProfiles.has(profile.id))

test.describe.configure({ mode: "parallel" })

for (const profile of profiles) {
  test.describe(profile.id, () => {
    test.use({ viewport: profile.viewport })

    for (const item of items) {
      test(`${item.id} @ ${profile.id}`, async ({ page }, testInfo) => {
        await page.emulateMedia({ reducedMotion: "reduce" })
        const browserErrors: string[] = []
        const failures: string[] = []
        page.on("console", (message) => {
          if (message.type() === "error") browserErrors.push(message.text())
        })
        page.on("pageerror", (error) => browserErrors.push(error.message))

        let previewKind: string | null = null
        let warnings: Array<{ id: string; impact: string | null; nodes: number }> = []
        const params = new URLSearchParams()
        if (profile.device !== "fluid") params.set("device", profile.device)
        const url = `/${item.id}${params.size ? `?${params}` : ""}`

        try {
          await page.goto(url, { waitUntil: "domcontentloaded" })
          await page.locator(`[data-catalog-selected-id="${item.id}"]`).waitFor()
          const preview = page.locator("[data-catalog-preview-ready='true']").first()
          await preview.waitFor({ state: "visible" })
          previewKind = await preview.getAttribute("data-catalog-preview-kind")
          if (await page.locator("[data-catalog-preview-error='true']").count()) {
            failures.push("Preview error boundary rendered")
          }
          const documentOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          )
          if (documentOverflow > 1) failures.push(`Document horizontal overflow: ${documentOverflow}px`)

          const axe = await new AxeBuilder({ page })
            .include("[data-catalog-preview-ready='true']")
            .disableRules(["color-contrast"])
            .analyze()
          const critical = axe.violations.filter((violation) => violation.impact === "critical")
          if (critical.length > 0) failures.push(`Critical accessibility violations: ${critical.map((violation) => violation.id).join(", ")}`)
          warnings = axe.violations
            .filter((violation) => violation.impact !== "critical")
            .map((violation) => ({ id: violation.id, impact: violation.impact ?? null, nodes: violation.nodes.length }))
        } catch (error) {
          failures.push(error instanceof Error ? error.message : String(error))
        }

        failures.push(...browserErrors.map((error) => `Browser error: ${error}`))
        await testInfo.attach("catalog-check", {
          body: Buffer.from(JSON.stringify({
            itemId: item.id,
            profile: profile.id,
            readiness: item.mobileReadiness,
            previewKind,
            url,
            warnings,
            failures,
          })),
          contentType: "application/json",
        })
        expect(failures, failures.join("\n")).toEqual([])
      })
    }
  })
}
