#!/usr/bin/env bash
set -euo pipefail

expected_version=0.2.3
expected_integrity='sha512-FEUxPpgnpTA5h+RbegaSjboIvaKUz689j8YoqXpcmsFreCNZ/GDDD6soiOE8PrOX6nvi5AQP18hbLlu2rTpMgA=='

node -e 'const p = require("./package.json"); if (p.devDependencies.openwiki !== process.argv[1]) process.exit(1)' "$expected_version"
grep -q "^  openwiki@$expected_version:" pnpm-lock.yaml
grep -q -F "resolution: {integrity: $expected_integrity}" pnpm-lock.yaml

echo "OpenWiki package version and integrity are pinned."
