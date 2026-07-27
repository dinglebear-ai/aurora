#!/usr/bin/env node
import { existsSync, readdirSync, rmSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

export function standaloneEnvEntries(entries) {
  return [...entries]
    .filter((entry) => entry === ".env" || entry.startsWith(".env."))
    .sort((a, b) => a.localeCompare(b))
}

export function sanitizeStandalone(standalone) {
  if (!existsSync(standalone)) {
    throw new Error("Standalone sanitization failed: " + standalone + " is missing. Run next build first.")
  }

  const envFiles = standaloneEnvEntries(readdirSync(standalone))
  for (const envFile of envFiles) {
    rmSync(join(standalone, envFile), { force: true, recursive: true })
  }
  return envFiles
}

function main() {
  const standalone = resolve(process.cwd(), ".next", "standalone")
  const removed = sanitizeStandalone(standalone)
  if (removed.length === 0) {
    console.log("Standalone sanitization passed: no environment files were present.")
    return
  }
  console.log("Removed standalone environment files: " + removed.join(", "))
}

const entrypoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ""
if (entrypoint === import.meta.url) main()
