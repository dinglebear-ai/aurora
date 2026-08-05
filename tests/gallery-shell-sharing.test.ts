import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

function read(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8")
}

const sharedShell = read("catalog/gallery-shell.tsx")
const sharedStyles = read("catalog/gallery-shell.css")
const galleryLayout = read("app/gallery/layout.tsx")
const galleryStyles = read("app/globals.css")
const catalogApp = read("apps/device-catalog/src/App.tsx")
const catalogStyles = read("apps/device-catalog/src/styles.css")
const siteChrome = read("app/site-chrome.css")

test("Next Gallery and Tauri catalog use the same Gallery shell component", () => {
  assert.ok(galleryLayout.includes('from "@/catalog/gallery-shell"'))
  assert.ok(catalogApp.includes('from "@/catalog/gallery-shell"'))
  assert.ok(galleryLayout.includes("<GalleryShell"))
  assert.ok(catalogApp.includes("<GalleryShell"))

  assert.equal(sharedShell.includes('from "next/'), false)
  assert.equal(sharedShell.includes("next/navigation"), false)
  assert.equal(sharedShell.includes("next/link"), false)
})

test("Next Gallery and Tauri catalog use the same Gallery shell stylesheet", () => {
  assert.ok(galleryStyles.includes('@import "../catalog/gallery-shell.css";'))
  assert.ok(catalogStyles.includes('@import "../../../catalog/gallery-shell.css";'))
  assert.ok(sharedStyles.includes(".aurora-gallery-shell"))
  assert.ok(sharedStyles.includes(".aurora-gallery-nav"))
  assert.ok(sharedStyles.includes("@media (max-width: 760px)"))

  assert.equal(siteChrome.includes(".aurora-gallery-shell"), false)
})

test("device catalog no longer owns a parallel application shell", () => {
  for (const selector of ["catalog-shell", "catalog-header", "catalog-sidebar", "catalog-workspace"]) {
    assert.equal(catalogApp.includes(selector), false, `catalog app still owns ${selector}`)
    assert.equal(catalogStyles.includes(`.${selector}`), false, `catalog stylesheet still owns .${selector}`)
  }
})
