---
type: "Reference"
title: "Quickstart"
description: "Entry page for maintaining Aurora repository OpenWiki documentation, with canonical navigation and current maintenance scope."
timestamp: "2026-07-28T10:31:21Z"
tags: [openwiki, aurora, maintenance]
---

# Quickstart

This repository has a focused OpenWiki reference for maintaining `aurora` documentation. Use this as the entrypoint for future updates.

## What this wiki currently covers

- Repository context: `Aurora Design System` is a Next.js 16 / React 19 codebase with a shadcn-compatible registry and Android/theme/tooling companions. Start with [`README.md`](../README.md) for the full product description.
- OpenWiki maintenance: how updates are generated and how agent-facing handoff guidance in [`CLAUDE.md`](../CLAUDE.md#openwiki) is kept synchronized.
- The current maintenance state is tracked in [`.last-update.json`](./.last-update.json).

## Primary navigation

- [OpenWiki Update Workflow](./operations/openwiki-update.md): details of the scheduled and manual update process and how generated docs are proposed.
- [Agent handoff notes](../CLAUDE.md#openwiki): canonical `OPENWIKI` notes for local agents.

## Current maintenance state

- `.last-update.json` is present and records the last successful OpenWiki update.
- This maintenance refresh tracks these source changes:
  - `CLAUDE.md` (`<!-- OPENWIKI:START -->` handoff block)
- Corresponding wiki updates in this run:
  - `/openwiki/quickstart.md`
  - `/openwiki/.last-update.json`

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