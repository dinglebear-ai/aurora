#!/usr/bin/env node
import { spawnSync } from "node:child_process"

for (const [script, args] of [
  ["scripts/generate-gallery-entries.mjs", ["--check"]],
  ["scripts/generate-client-catalog.mjs", ["--check"]],
  ["scripts/generate-device-catalog.mjs", ["--check"]],
  ["scripts/validate-registry-graph.mjs", []],
]) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
