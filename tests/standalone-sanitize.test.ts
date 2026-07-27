import assert from "node:assert/strict"
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import {
  sanitizeStandalone,
  standaloneEnvEntries,
} from "../scripts/sanitize-standalone.mjs"

test("standaloneEnvEntries recognizes every environment-file variant", () => {
  assert.deepEqual(
    standaloneEnvEntries(["server.js", ".env.production", ".env", ".env.local", "package.json"]),
    [".env", ".env.local", ".env.production"]
  )
})

test("sanitizeStandalone removes environment files and preserves runtime files", (t) => {
  const standalone = mkdtempSync(join(tmpdir(), "aurora-standalone-sanitize-"))
  t.after(() => rmSync(standalone, { force: true, recursive: true }))
  writeFileSync(join(standalone, ".env"), "SECRET=value\n")
  writeFileSync(join(standalone, ".env.production"), "SECRET=production\n")
  writeFileSync(join(standalone, "server.js"), "export {}\n")

  assert.deepEqual(sanitizeStandalone(standalone), [".env", ".env.production"])
  assert.equal(existsSync(join(standalone, ".env")), false)
  assert.equal(existsSync(join(standalone, ".env.production")), false)
  assert.equal(existsSync(join(standalone, "server.js")), true)
})

test("sanitizeStandalone fails closed when the build output is missing", () => {
  const missing = join(tmpdir(), "aurora-standalone-missing-" + process.pid)
  assert.throws(() => sanitizeStandalone(missing), /is missing/u)
})
