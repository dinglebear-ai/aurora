import { mkdirSync } from "node:fs"
import { resolve } from "node:path"

import { test } from "@playwright/test"

const output = resolve("outputs/device-catalog/screenshots")
mkdirSync(output, { recursive: true })

const captures = [
  { name: "button-desktop", path: "/aurora-button", viewport: { width: 1440, height: 1000 } },
  { name: "prompt-input-phone", path: "/aurora-prompt-input", viewport: { width: 430, height: 932 } },
  { name: "gateway-landscape", path: "/aurora-gateway", viewport: { width: 932, height: 430 } },
  { name: "platform-phone", path: "/platform", viewport: { width: 430, height: 932 } },
] as const

for (const capture of captures) {
  test(`capture ${capture.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize(capture.viewport)
    await page.goto(capture.path, { waitUntil: "domcontentloaded" })
    if (capture.path === "/platform") await page.locator(".catalog-capability-grid").waitFor()
    else await page.locator("[data-catalog-preview-ready='true']").first().waitFor()
    await page.screenshot({ path: resolve(output, `${capture.name}.png`), fullPage: true })
  })
}
