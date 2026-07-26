# Quickstart

This repository now has a minimal OpenWiki reference for maintaining `aurora` documentation. Use this page as the entrypoint for future updates.

## What this wiki currently covers

- Repository context: `Aurora Design System` is a Next.js 16 / React 19 codebase with a shadcn-compatible registry and Android/theme/tooling companions. Start with [`README.md`](../README.md) for the full product description.
- OpenWiki maintenance: current workflow and command/credential model used by scheduled updates.
- What was changed in this maintenance run: OpenWiki workflow migrated to OpenRouter with a single PR workflow that writes updated wiki files and selected repository metadata (`AGENTS.md`, `CLAUDE.md`, `openwiki` workflow).

## Primary navigation

- [OpenWiki Update Workflow](./operations/openwiki-update.md): details of the scheduled and manual update process and how it writes docs.

## Current maintenance state

- `.last-update.json` is present and currently records the last successful OpenWiki update at `2026-07-26T09:54:55.883Z` (`3ead1ccf2cc3ebf52c3dd0375eebdb774588e78a`).
- This maintenance refresh tracks these source changes:
  - `.github/workflows/openwiki-update.yml` (single-job OpenRouter-based automation)
  - `CLAUDE.md` (new repository OpenWiki handoff note)
- Corresponding wiki pages refreshed:
  - `/openwiki/quickstart.md`
  - `/openwiki/operations/openwiki-update.md`

## How to add to this wiki cleanly

When updating again, follow the same rule set used here:

- Start from recent changed source files, not the full tree.
- Limit edits to pages directly affected by the change set.
- Keep each concept in one canonical page.
- If a domain is out of scope, add it to `## Backlog` rather than inventing stale pages.

## Backlog

- `architecture/overview`: [`registry/aurora/styles/aurora.css`](../registry/aurora/styles/aurora.css), [`registry/aurora/ui`](../registry/aurora/ui), [`registry/aurora/blocks`](../registry/aurora/blocks), and [`app/gallery`](../app/gallery) define the full product architecture, but this update only covered OpenWiki operations.
- `flows/registry-delivery`: [`README.md`](../README.md), [`scripts/registry`](../scripts), and `public/r/*.json` govern publish/build behavior and are intentionally deferred in this update.
- `integrations/android-theme-parity`: [`android/`](../android) and [`themes/`](../themes) contain substantial cross-platform parity work and were unchanged in this maintenance pass.