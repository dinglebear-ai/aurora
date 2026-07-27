#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"

const root = process.cwd()
const standalone = join(root, ".next", "standalone")

if (!existsSync(standalone)) {
  console.error("Standalone audit failed: .next/standalone is missing. Run pnpm build first.")
  process.exit(1)
}

const forbidden = [
  ".worktrees",
  "android",
  "registry",
  "scripts",
  "themes",
]

const entries = new Set(readdirSync(standalone))
const envFindings = [...entries].filter((entry) => entry === ".env" || entry.startsWith(".env."))
const findings = [...envFindings, ...forbidden.filter((entry) => entries.has(entry))]
const allowedDocsFiles = new Set(["docs/component-kotlin-map.md"])

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

if (entries.has("docs")) {
  const docsFiles = listFiles(join(standalone, "docs")).map((path) => relative(standalone, path))
  findings.push(...docsFiles.filter((path) => !allowedDocsFiles.has(path)))
}

if (findings.length > 0) {
  console.error("Standalone audit failed: broad traced files/directories found in .next/standalone:")
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log("Standalone audit passed.")
