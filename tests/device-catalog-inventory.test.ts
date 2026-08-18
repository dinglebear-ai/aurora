import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const registry = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf8")) as { items: Array<{ name: string; type: string }> }
const inventory = JSON.parse(readFileSync(new URL("../catalog/inventory.json", import.meta.url), "utf8")) as {
  schemaVersion: number
  counts: { registryItems: number; galleryPreviews: number; sharedFixtures: number; metadataOnly: number }
  items: Array<{
    id: string
    registryType: string
    sourcePath: string | null
    fixtureId: string | null
    demoModule: string | null
    mobileReadiness: string
    mobileReadinessReason: string
    capabilities: string[]
  }>
}

const readinessValues = new Set(["ready", "adaptive", "native-bridge", "desktop-first", "metadata-only"])
const fixtureValues = new Set(["button", "card", "feedback", "forms", "progress", "disclosure", "overlays", "widgets"])

test("device catalog inventory covers the complete registry", () => {
  assert.equal(inventory.schemaVersion, 1)
  assert.equal(inventory.counts.registryItems, registry.items.length)
  assert.equal(inventory.items.length, registry.items.length)
  assert.equal(new Set(inventory.items.map((item) => item.id)).size, inventory.items.length)
  assert.deepEqual(
    inventory.items.map((item) => item.id).toSorted(),
    registry.items.map((item) => item.name).toSorted(),
  )
})

test("device catalog readiness metadata is complete and React-first", () => {
  for (const item of inventory.items) {
    assert.ok(readinessValues.has(item.mobileReadiness), `unexpected readiness for ${item.id}`)
    assert.ok(item.mobileReadinessReason.length > 0, `missing readiness reason for ${item.id}`)
    assert.ok(item.capabilities.includes("webview"), `missing WebView capability for ${item.id}`)
    if (item.fixtureId) assert.ok(fixtureValues.has(item.fixtureId), `unknown fixture ${item.fixtureId}`)
    if (item.sourcePath) assert.ok(existsSync(new URL(`../${item.sourcePath}`, import.meta.url)), `missing source ${item.sourcePath}`)
    if (["registry:ui", "registry:block", "registry:page"].includes(item.registryType)) {
      assert.notEqual(item.mobileReadiness, "metadata-only", `runtime surface marked metadata-only: ${item.id}`)
    }
  }

  const serialized = JSON.stringify(inventory)
  assert.equal(serialized.includes("android/aurora"), false)
  assert.equal(serialized.includes("component-kotlin-map"), false)
})

test("device catalog aggregate counts match the generated items", () => {
  assert.equal(inventory.counts.galleryPreviews, inventory.items.filter((item) => item.demoModule).length)
  assert.equal(inventory.counts.sharedFixtures, inventory.items.filter((item) => item.fixtureId).length)
  assert.equal(inventory.counts.metadataOnly, inventory.items.filter((item) => item.mobileReadiness === "metadata-only").length)
  assert.equal(inventory.counts.registryItems, 182)
})
