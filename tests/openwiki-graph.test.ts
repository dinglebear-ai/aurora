import assert from "node:assert/strict"
import test from "node:test"

import {
  collectOpenWikiPackages,
  diffOpenWikiGraph,
  packageVersion,
  parseManifestPackages,
  parseOpenWikiLockfile,
  renderOpenWikiGraph,
  snapshotKeyFor,
} from "../scripts/check-openwiki-graph.mjs"

function fixtureLockfile() {
  return {
    importers: {
      ".": {
        devDependencies: {
          openwiki: {
            version: "0.1.2(peer@1.0.0)",
          },
        },
      },
    },
    snapshots: {
      "openwiki@0.1.2(peer@1.0.0)": {
        dependencies: {
          alpha: "1.0.0(peer@1.0.0)",
        },
        optionalDependencies: {
          beta: "2.0.0",
        },
      },
      "alpha@1.0.0(peer@1.0.0)": {
        dependencies: {
          shared: "3.0.0",
        },
      },
      "beta@2.0.0": {
        dependencies: {
          shared: "3.0.0",
        },
      },
      "shared@3.0.0": {},
    },
  }
}

test("collectOpenWikiPackages walks lockfile dependencies and optional dependencies", () => {
  assert.deepEqual(collectOpenWikiPackages(fixtureLockfile()), [
    "alpha@1.0.0",
    "beta@2.0.0",
    "openwiki@0.1.2",
    "shared@3.0.0",
  ])
})

test("packageVersion removes only peer-context suffixes", () => {
  assert.equal(packageVersion("1.2.3(peer@4.5.6)"), "1.2.3")
  assert.equal(packageVersion("1.2.3"), "1.2.3")
})

test("snapshotKeyFor fails closed for missing and unsupported references", () => {
  assert.equal(snapshotKeyFor("alpha", "1.0.0", { "alpha@1.0.0": {} }), "alpha@1.0.0")
  assert.throws(() => snapshotKeyFor("alpha", "2.0.0", {}), /missing snapshot/u)
  assert.throws(() => snapshotKeyFor("alpha", "workspace:.*", {}), /unsupported local dependency/u)
  assert.throws(() => snapshotKeyFor("alias", "npm:alpha@1.0.0", {}), /unsupported npm alias/u)
})

test("collectOpenWikiPackages rejects malformed lockfile edges", () => {
  const lockfile = fixtureLockfile()
  const alpha = lockfile.snapshots["alpha@1.0.0(peer@1.0.0)"] as {
    dependencies: Record<string, unknown>
  }
  alpha.dependencies = { broken: {} }
  assert.throws(() => collectOpenWikiPackages(lockfile), /invalid reference/u)
})

test("parseOpenWikiLockfile parses pnpm lockfile YAML", () => {
  const source = [
    "importers:",
    "  .:",
    "    devDependencies:",
    "      openwiki:",
    "        version: 0.1.2",
    "snapshots:",
    "  openwiki@0.1.2: {}",
    "",
  ].join("\n")
  const lockfile = parseOpenWikiLockfile(source)
  assert.deepEqual(collectOpenWikiPackages(lockfile), ["openwiki@0.1.2"])
})

test("renderOpenWikiGraph creates a stable reviewable manifest", () => {
  const rendered = renderOpenWikiGraph(["alpha@1.0.0", "openwiki@0.1.2"])
  assert.deepEqual(parseManifestPackages(rendered), ["alpha@1.0.0", "openwiki@0.1.2"])
  assert.match(rendered, /pnpm run openwiki:graph:update/u)
})

test("diffOpenWikiGraph reports additions and removals", () => {
  const expected = renderOpenWikiGraph(["alpha@1.0.0", "openwiki@0.1.2"])
  assert.deepEqual(diffOpenWikiGraph(expected, ["beta@2.0.0", "openwiki@0.1.2"]), {
    added: ["beta@2.0.0"],
    removed: ["alpha@1.0.0"],
  })
})
