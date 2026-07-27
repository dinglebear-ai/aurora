import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve("android/app/src/main/kotlin")

function kotlinFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const candidate = path.join(directory, entry.name)
    if (entry.isDirectory()) return kotlinFiles(candidate)
    return entry.isFile() && entry.name.endsWith(".kt") ? [candidate] : []
  })
}

test("Android application code does not swallow JVM Errors with broad Throwable catches", () => {
  const findings = kotlinFiles(root).flatMap((file) => {
    const source = readFileSync(file, "utf8")
    return source
      .split(/\r?\n/u)
      .flatMap((line, index) => /catch\s*\([^)]*:\s*Throwable\)/u.test(line)
        ? [path.relative(root, file) + ":" + (index + 1)]
        : [])
  })

  assert.deepEqual(findings, [])
})
