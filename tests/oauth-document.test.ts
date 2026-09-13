import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"

test("OAuth document provenance matches canonical components and tokens", async () => {
  const provenance = JSON.parse(await readFile("public/oauth-document/provenance.json", "utf8"))
  for (const [file, expected] of Object.entries(provenance.files)) {
    assert.equal(createHash("sha256").update(await readFile(file)).digest("hex"), expected, `${file} changed; run pnpm oauth:build`)
  }
})

test("Every no-script OAuth template has a bounded substitution contract", async () => {
  for (const state of ["consent", "success", "error", "expired"]) {
    const html = await readFile(`public/oauth-document/${state}.html`, "utf8")
    assert.deepEqual([...new Set(html.match(/\{\{[A-Z]+\}\}/g))].sort(),
      (state === "consent" ? ["{{ACTION}}", "{{MESSAGE}}", "{{STYLE}}", "{{TITLE}}"] : ["{{MESSAGE}}", "{{STYLE}}", "{{TITLE}}"]))
    assert.doesNotMatch(html, /<script\b|\son\w+=|<iframe\b/)
    assert.match(html, /aria-labelledby="oauth-title"/)
    assert.match(html, new RegExp(`data-state="${state}"`))
  }
})
