# Changelog

All notable changes to Aurora are documented here. Aurora follows
[Semantic Versioning](https://semver.org/). Install URLs at
`aurora.tootie.tv/r/<name>.json` are a public contract — renames are
breaking changes and will be listed here.

---

## Unreleased

### Breaking and migration notes

- **Production delivery is immutable.** The public service no longer uses the
  writable `pnpm dev` container. Operators must deploy the tested GHCR digest
  through `ops/compose/production.yaml`; `docker compose up` without an explicit
  development profile is intentionally a no-op. See `docs/deployment.md`.
- **Node 24 ESM is the project contract.** Local and CI tooling now require Node
  24 and treat `.js`/`.ts` as ES modules. Remove CommonJS-only test assumptions
  and use `import`/`export` in project tooling.
- **Android local consumption requires explicit composite substitution.** Aurora
  is not published to Maven. Consumers must include this repository's `android/`
  build and substitute `tv.tootie.aurora:aurora`; use the current checkout path,
  not the retired `aurora-design-system` path. See the packaged skill's Android
  reference.

### Security and delivery

- Switched the CSP to same-origin scripts plus the documented Next.js static
  bootstrap relaxation so public pages remain prerenderable; forms are
  restricted to self and production upgrades insecure requests.
- Published URL-bearing components now reject non-HTTP(S) and malformed schemes.
- Added short caching for mutable `/r/*.json` discovery URLs and documented
  commit-SHA registry URLs for reproducible installs.
- Added exact-SHA image builds, SBOM/provenance attestations, vulnerability
  scanning, keyless signing, signature verification, and digest-only promotion.
- Split OpenWiki generation (model secret, read-only repository token) from PR
  creation (write token, no model secret), pinned its dependency graph, and use
  fresh superseding branches.
- Added public landing/content-negotiation/schema/checksum/TLS synthetics,
  optional failure webhooks, production resource/log limits, and tracked
  Compose/SWAG topology.

### Registry and tokens

- Consolidated the singular `Source` implementation and added deterministic
  gallery/catalog generation plus registry dependency-graph validation.
- Removed the deprecated clipboard `execCommand` fallback; unsupported Clipboard
  API environments now expose the component's explicit error state.

- Mutable registry URLs remain supported for interactive discovery and receive
  short revalidation caching. Production consumers should pin the immutable
  `raw.githubusercontent.com/jmagar/aurora/<full-commit>/public/r/<name>.json`
  form described in `docs/versioning.md`.
- Current main includes registry graph, component API, token export, theme, and
  Android light/dark parity changes made after v0.3.1. Consumers upgrading from
  v0.3.1 should rebuild vendored components, review changed component props,
  regenerate Android tokens, and verify both color modes before release.

## [0.5.1](https://github.com/dinglebear-ai/aurora/compare/v0.5.0...v0.5.1) (2026-07-29)


### Fixed

* **codeql:** stop the Gradle build cache starving Kotlin extraction ([#104](https://github.com/dinglebear-ai/aurora/issues/104)) ([ec90cc2](https://github.com/dinglebear-ai/aurora/commit/ec90cc21d937a868d11cd2c955eea6ccdefb878f))
* **eslint:** ignore apps/*/dist build output ([#98](https://github.com/dinglebear-ai/aurora/issues/98)) ([c7f7593](https://github.com/dinglebear-ai/aurora/commit/c7f7593a03bb7d4796641c9dee897a2d3b16d111))
* **ops:** complete the jmagar -&gt; dinglebear-ai repository move ([#101](https://github.com/dinglebear-ai/aurora/issues/101)) ([1cbc8f4](https://github.com/dinglebear-ai/aurora/commit/1cbc8f428c21c6716be1c0e1f83815070c8e6f1e))

## [0.5.0](https://github.com/dinglebear-ai/aurora/compare/v0.4.3...v0.5.0) (2026-07-28)


### Added

* add cross-platform Tauri device catalog ([#95](https://github.com/dinglebear-ai/aurora/issues/95)) ([ab0542b](https://github.com/dinglebear-ai/aurora/commit/ab0542bd7eee4397f124478ffb32fafd17185fae))
* prompt input composition updates ([#91](https://github.com/dinglebear-ai/aurora/issues/91)) ([3ead1cc](https://github.com/dinglebear-ai/aurora/commit/3ead1ccf2cc3ebf52c3dd0375eebdb774588e78a))


### Fixed

* complete comprehensive review remediation ([#94](https://github.com/dinglebear-ai/aurora/issues/94)) ([2037087](https://github.com/dinglebear-ai/aurora/commit/2037087f3b62a0b0db8cb0671562bf76ba99786d))
* **docker:** repair the production image build ([#97](https://github.com/dinglebear-ai/aurora/issues/97)) ([e3206fd](https://github.com/dinglebear-ai/aurora/commit/e3206fddd9b78056c08a59e33c05827a3badf010))
* remediate comprehensive repository review ([#78](https://github.com/dinglebear-ai/aurora/issues/78)) ([d702943](https://github.com/dinglebear-ai/aurora/commit/d702943d7bff8603691a2d32804cd7a4a610f284))

## [0.4.3](https://github.com/jmagar/aurora/compare/v0.4.2...v0.4.3) (2026-07-18)


### Fixed

* **ci:** build the native SQLite binding OpenWiki needs ([#72](https://github.com/jmagar/aurora/issues/72)) ([7dd260d](https://github.com/jmagar/aurora/commit/7dd260dc887bf43165ee00a9f6a7a373759cc745))
* **synthetics:** pass Cloudflare bot challenge on aurora.tootie.tv ([#75](https://github.com/jmagar/aurora/issues/75)) ([ac39604](https://github.com/jmagar/aurora/commit/ac396049ebcc91386e462cfa4ed8db686cedfcd6))

## [0.4.2](https://github.com/jmagar/aurora/compare/v0.4.1...v0.4.2) (2026-07-17)


### Dependencies

* **deps:** bump the minor group across 1 directory with 59 updates ([#69](https://github.com/jmagar/aurora/issues/69)) ([4078a0d](https://github.com/jmagar/aurora/commit/4078a0d344292903892bff1a7c0a12c88afc5efd))

## [0.4.1](https://github.com/jmagar/aurora/compare/v0.4.0...v0.4.1) (2026-07-17)


### Fixed

* **catalog:** contain demo suspension so scrolling stops jumping to top ([#61](https://github.com/jmagar/aurora/issues/61)) ([15b5f90](https://github.com/jmagar/aurora/commit/15b5f90ee764895f2f2ec273d06e5a8d6a314540))
* **catalog:** stop auto-open overlay demos scroll-locking the page ([#58](https://github.com/jmagar/aurora/issues/58)) ([845057f](https://github.com/jmagar/aurora/commit/845057f146a1453c6b2a4e6a47ff3b5cde0a133b))


### Changed

* **docker:** stop the dev image chowning 93k files (30min -&gt; ~14min) ([#60](https://github.com/jmagar/aurora/issues/60)) ([624df8b](https://github.com/jmagar/aurora/commit/624df8b1197b11f428f91c7661fe838b78508f11))


### Dependencies

* **deps:** bump actions/cache from 4.3.0 to 6.1.0 ([#65](https://github.com/jmagar/aurora/issues/65)) ([740ca9d](https://github.com/jmagar/aurora/commit/740ca9d2d27862d3fe50763b9ada46d639da9722))
* **deps:** bump actions/download-artifact from 4.3.0 to 8.0.1 ([#68](https://github.com/jmagar/aurora/issues/68)) ([4a25919](https://github.com/jmagar/aurora/commit/4a25919c4d09b0be336fbbb5c9ef9c0a69b53440))
* **deps:** bump actions/upload-artifact from 4.6.2 to 7.0.1 ([#64](https://github.com/jmagar/aurora/issues/64)) ([4bdeb97](https://github.com/jmagar/aurora/commit/4bdeb9771525699855659e3a3963e8912dacc628))
* **deps:** bump google/osv-scanner-action/osv-scanner-action ([#66](https://github.com/jmagar/aurora/issues/66)) ([163bd4e](https://github.com/jmagar/aurora/commit/163bd4e1d78474a01c5ba36f1e7329f4326b4926))
* **deps:** bump gradle/actions/wrapper-validation ([#67](https://github.com/jmagar/aurora/issues/67)) ([fd0fa68](https://github.com/jmagar/aurora/commit/fd0fa68ffd872206a08008c831cec7b52ffb042f))
* take the minor group rebased, minus openwiki; ungroup openwiki ([#62](https://github.com/jmagar/aurora/issues/62)) ([7c8d11d](https://github.com/jmagar/aurora/commit/7c8d11dd0e2ca6793f5c15fa5496350ac0e42980))

## [0.4.0](https://github.com/jmagar/aurora/compare/v0.3.1...v0.4.0) (2026-07-17)


### Added

* **dinglebear:** open the full app on the dinglebear.ai host ([db0c034](https://github.com/jmagar/aurora/commit/db0c0349a1e75aed167fea9c57676b060bad8343))
* **dinglebear:** replace static tenant with Aurora-native fleet page ([6fa3f4a](https://github.com/jmagar/aurora/commit/6fa3f4ac920379b564c968534a6a4cb505a50841))
* **plugins:** dendrite marketplace viewer at /plugins ([32cfdf4](https://github.com/jmagar/aurora/commit/32cfdf475df64be40cbd00053141679e5de3a760))


### Fixed

* align AI automation accent to Axon orange ([fa53183](https://github.com/jmagar/aurora/commit/fa53183f7e9a790391198424b8b90afb4b5fa50c))
* audit and polish Aurora UI primitives ([#53](https://github.com/jmagar/aurora/issues/53)) ([2ae003c](https://github.com/jmagar/aurora/commit/2ae003cd23d47ff9599c9bd8cc85dd28e66f18fc))
* bridge Aurora font tokens to next/font variables ([1110e1c](https://github.com/jmagar/aurora/commit/1110e1c751d4990ccfa8207139b8b1932c187b22))
* **catalog:** restore live component demos; drop unused web budget script ([#56](https://github.com/jmagar/aurora/issues/56)) ([10e2e18](https://github.com/jmagar/aurora/commit/10e2e18ce1d1e5c2136d5180f18c4b5845372fa2))
* harden image publication scan ([#47](https://github.com/jmagar/aurora/issues/47)) ([e99edc0](https://github.com/jmagar/aurora/commit/e99edc0b01f65a3187c5137d453f68b7b86e5359))
* make popover focus deterministic ([#49](https://github.com/jmagar/aurora/issues/49)) ([ae5c076](https://github.com/jmagar/aurora/commit/ae5c076f9f9470523ab7a8a02680477fae38899c))
* make production migration rollback-safe ([#50](https://github.com/jmagar/aurora/issues/50)) ([178e13d](https://github.com/jmagar/aurora/commit/178e13df5c953a70da3ea46ca054968f652699f1))
* remediate comprehensive Aurora review ([#46](https://github.com/jmagar/aurora/issues/46)) ([eb4d389](https://github.com/jmagar/aurora/commit/eb4d38930aceb6cfa6a8d42a39ead060334162f5))


### Dependencies

* **deps-dev:** bump @types/node from 20.19.9 to 26.1.1 ([#41](https://github.com/jmagar/aurora/issues/41)) ([ad8ad05](https://github.com/jmagar/aurora/commit/ad8ad05a46fd3b68d2e71c000540342a6f7c9e86))
* **deps-dev:** bump style-dictionary from 4.0.0 to 5.5.0 ([#40](https://github.com/jmagar/aurora/issues/40)) ([9f3c81c](https://github.com/jmagar/aurora/commit/9f3c81c8236bcd9df962b2dc8f6781a7fc74a065))
* **deps-dev:** bump typescript from 5.9.2 to 5.9.3 ([#42](https://github.com/jmagar/aurora/issues/42)) ([a602586](https://github.com/jmagar/aurora/commit/a602586989d60337360ff1711f381ffa428f8a66))
* **deps:** bump actions/setup-node from 4.4.0 to 7.0.0 ([#37](https://github.com/jmagar/aurora/issues/37)) ([bba796a](https://github.com/jmagar/aurora/commit/bba796a5efb679430d5cb23276f577f50b1ea5d9))
* **deps:** bump docker/build-push-action from 6.19.2 to 7.3.0 ([#34](https://github.com/jmagar/aurora/issues/34)) ([be3b426](https://github.com/jmagar/aurora/commit/be3b426cee245f7cd6c0c02567dfe6a1bb157999))
* **deps:** bump docker/login-action from 3.7.0 to 4.4.0 ([#38](https://github.com/jmagar/aurora/issues/38)) ([456a5bc](https://github.com/jmagar/aurora/commit/456a5bcecac42207676a5dd32dfd1aa10e386149))
* **deps:** bump googleapis/release-please-action ([#36](https://github.com/jmagar/aurora/issues/36)) ([c3f1e55](https://github.com/jmagar/aurora/commit/c3f1e55f97295bc4029c9f80c4d7ac64c8a83bff))
* **deps:** bump pnpm/action-setup ([#35](https://github.com/jmagar/aurora/issues/35)) ([3f7a8d0](https://github.com/jmagar/aurora/commit/3f7a8d080c35dbe69b23c33086fe57cff2c0f873))

## [0.3.1](https://github.com/jmagar/aurora/compare/v0.3.0...v0.3.1) (2026-07-11)


### Fixed

* **ci:** switch OpenWiki to local openai-compatible proxy ([7caa3bc](https://github.com/jmagar/aurora/commit/7caa3bc95673fd98025c332b595c7db22862e4c9))
* **ui:** correct token/color bugs across Aurora UI primitives ([#33](https://github.com/jmagar/aurora/issues/33)) ([494f06a](https://github.com/jmagar/aurora/commit/494f06a699602caf99fb2af52eda61d355695600))

## 0.3.0

### Breaking

- **`Badge` — `badgeVariants` export removed.** The named `badgeVariants` CVA
  helper is gone. A deprecated no-op shim (`export const badgeVariants = undefined`)
  remains to surface a clear import error instead of a silent undefined. If you
  depended on `badgeVariants`, switch to the `<Badge>` component directly.

- **`Badge` — `tone="default"` deprecated.** Passing `tone="default"` (or the
  old `variant="default"` alias) now emits a `console.warn` in development:
  ```
  [Aurora Badge] tone="default" is deprecated. Use tone="neutral" instead.
  ```
  Switch to `tone="neutral"`. The alias still renders but will be removed in a
  future version.

### New

- **`aurora-inject-once` lib helper** (`registry/aurora/lib/inject-once.ts`).
  Shared utility that guards a dynamic `<style>` injection against duplicates
  using a stable DOM `id` attribute — safe across React Fast Refresh hot
  reloads, where module-level booleans reset but the DOM persists.
  Install: `npx shadcn@latest add https://aurora.tootie.tv/r/aurora-inject-once.json`

- Eight UI components migrated to `inject-once`:
  `Button`, `AlertDialog`, `OperationIcon`, `NumberInput`, `Carousel`,
  `CopyButton`, `Card`, and `Avatar`. These components now declare
  `@aurora/aurora-inject-once` in their `registryDependencies`.

### Changed

- **`next.config.ts`** — `AURORA_DEV_ORIGIN` environment variable now controls
  the dev-proxy origin (was hardcoded). Set it if your dev network differs from
  the default.

- **`export-aurora-tokens.mjs`** — `resolveVars` now throws hard errors instead
  of silently returning `undefined` for unresolvable tokens, circular variable
  references, or base/base key collisions. Broken token exports will fail loudly
  at build time rather than producing corrupt output.

- **Gallery `generateStaticParams`** — production builds now assert that every
  DEMOS key resolves to a registered registry item. Unknown slugs throw at build
  time; dev emits a `console.warn`.

---

## 0.2.x and earlier

Pre-0.3.0 changes are not retroactively documented. See git history for the
full record.
