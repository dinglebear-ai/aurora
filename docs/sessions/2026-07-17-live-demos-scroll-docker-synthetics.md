---
date: 2026-07-17 21:28:22 EST
repo: git@github.com:jmagar/aurora.git
branch: main
head: ac39604
session id: e7304853-7dc4-4695-b532-b56eff37b2dd
transcript: /home/jmagar/.claude/projects/-home-jmagar-workspace-aurora/e7304853-7dc4-4695-b532-b56eff37b2dd.jsonl
working directory: /home/jmagar/workspace/aurora
worktree: /home/jmagar/workspace/aurora
beads: aurora-otgu, aurora-4vir, aurora-6c03, aurora-a7mo, aurora-5yck, aurora-t54a, aurora-sgm0, aurora-j2wo, aurora-k1cm, aurora-58wf
---

# Live demos, catalog scroll, Docker build, and synthetics

## User Request

"Whys it not showing a preview of the component/block like it used to?" — which
expanded across the session into: restore the live component previews, delete
the unfounded budget gate that justified removing them, fix the resulting
overlay/scroll bugs, put production back on the immutable image, root-cause the
30-minute Docker build and the Public-synthetics 403, merge the backlog, and
keep prod on latest.

## Session Overview

- Restored the live component demos on `/components` that PR #46 had replaced
  with placeholders, and deleted the orphaned, never-run web-budget script that
  was cited as the reason.
- Fixed three catalog defects surfaced by that restore: overlay portals
  escaping the drawer, an auto-open Select scroll-locking the page, and lazy
  demos collapsing the grid so scrolling jumped to the top.
- Merged the open PR backlog (10 PRs) and cut releases; left the failing
  260/261-package dependabot group unmerged by design.
- Reverted a mid-session regression where the public site briefly ran `next dev`
  (option "a"), restoring the immutable production container on port 50000.
- Root-caused the 30-minute `aurora-dev` Docker build (an overlayfs `chown -R`
  copy-up) and the Public-synthetics 403 (Cloudflare Managed Challenge on the
  Azure runner IP), shipping fixes for both.
- Kept production deployed to main HEAD throughout, ending on `ac39604`.

## Sequence of Events

1. Traced the missing previews to PR #46 (`eb4d389`), which gutted both render
   sites in `component-catalog.tsx` and cited a 64 KiB / bundle budget.
2. Established the budget was arbitrary: the 64 KiB test guards only the
   metadata JSON, and `scripts/check-web-budgets.mjs` is referenced by nothing —
   main was already over its limit, unnoticed.
3. Restored both render sites; verified in a real browser (per-CDP), not just by
   compile. Deleted the budget script. Merged as #56.
4. Addressed Codex review on #56: scoped overlay portals (Select, DropdownMenu,
   ContextMenu, HoverCard, Tooltip) to the preview container; declared the
   registry dependency; merged as #58.
5. Merged the dependency/backlog PRs (#42, #35, #36, #45, #38, #34, #37, #40,
   #41) and release #43; watched the post-merge publish to validate the
   PR-untested Docker-action bumps.
6. On request, flipped the public site to hot-reload `next dev` (option "a"),
   then found `aurora-j2wo` proving that reintroduced dev-overlay + hydration
   defects; reverted to the immutable prod container.
7. Fixed the catalog scroll-lock (`#58`) and then the scroll-jump (`#61`):
   auto-open demo focus-steal + `scrollIntoView` + a page-wide Suspense boundary
   collapsing the grid.
8. Root-caused the Docker build (`chown -R` on overlayfs) and shipped #60.
9. Root-caused the synthetics 403 (Cloudflare Managed Challenge) with a
   throwaway push-triggered diagnostic workflow; shipped code side as #75 and
   documented the operator-only Cloudflare step.
10. Deployed prod forward from the stale `15b5f90` to main HEAD `ac39604`.

## Key Findings

- The removed previews were an exact revert target: `component-catalog.tsx` had
  imported `DEMOS` and rendered `<Demo />` in the tile `LazyPreview` and the
  drawer before #46 replaced both with a "Load Interactive Demo" link.
- `scripts/check-web-budgets.mjs` limits (850/700/180 KiB) appear in no doc and
  are wired into no CI; two of three metrics measure server-side
  `.next/server/*_client-reference-manifest.js` that browsers never download.
- Catalog scroll-lock: `select-demo.tsx:39` used `<Select defaultOpen>`; Radix
  Select has no `modal` prop, so an open Select sets `data-scroll-locked` +
  `pointer-events:none` on `<body>`, freezing the whole catalog.
- Catalog scroll-jump: every demo is `next/dynamic`; the catalog's only Suspense
  boundary (added for `useSearchParams`) caught each demo's suspension and hid
  the grid (`display:none`, `scrollHeight` 10273→1000), clamping scroll to 0.
- Docker build: `RUN chown -R node:node /pnpm /app` over 93,102 files / 1.8G
  forces an overlayfs copy-up on a ZFS-backed Docker root — ~19 min, vs ~4 min
  for every other step combined.
- Synthetics 403: `aurora.tootie.tv` is Cloudflare-proxied and issues a Managed
  Challenge (`cf-mitigated: challenge`, `cType:managed`) to the runner's Azure
  IP (AS8075); a browser UA from the same IP still 403s, and un-proxied
  `dinglebear.ai` returns 200 from the same runner.

## Technical Decisions

- Deleted `check-web-budgets.mjs` rather than keep an unenforced gate; if a real
  budget is wanted it is `largestChunk` only, CI-wired, against a load target.
- Portal fix follows the existing `Drawer` convention
  (`modal={portalContainer ? false : rootProps.modal}`) for menus that support
  `modal`; Select (no `modal` prop) uses a `PreviewPosterContext` to render
  closed only inside non-interactive tiles.
- Catalog `inert` on the poster wrapper blocks focus-steal for every demo, not
  just the ones observed; per-tile Suspense contains each demo's load.
- Docker fix installs as `USER node` so files are born node-owned (no `chown`),
  mirroring the `runner` stage's `COPY --chown`.
- Synthetics fix keeps checks on the public path via a secret header + narrow
  Cloudflare Skip rule ("no broad WAF bypass"); token path drops `--location` so
  the secret can't leak on an off-host redirect (Codex P2).
- Reverted the public `next dev` experiment because `aurora-j2wo` had already
  ruled it out (dev overlay to visitors + landing hydration mismatch).

## Files Changed

| status | path | previous path | purpose | evidence |
|---|---|---|---|---|
| modified | components/site/component-catalog.tsx | — | restore live demos in tile + drawer; portal + poster + Suspense fixes | PRs #56/#58/#61 |
| deleted | scripts/check-web-budgets.mjs | — | remove orphaned, never-run budget gate | PR #56 |
| modified | registry/aurora/ui/select.tsx | — | honor usePortalContainer | PR #58 |
| modified | registry/aurora/ui/dropdown-menu.tsx | — | portal container + non-modal in preview | PRs #58/#61 |
| modified | registry/aurora/ui/context-menu.tsx | — | portal container + non-modal in preview | PRs #58/#61 |
| modified | registry/aurora/ui/hover-card.tsx | — | honor usePortalContainer | PR #58 |
| modified | registry/aurora/ui/tooltip.tsx | — | honor usePortalContainer | PR #58 |
| modified | registry.json + public/r/*.json | — | declare aurora-portal-container dependency; rebuild | PR #58 |
| created | lib/preview-poster.tsx | — | PreviewPosterContext for tile-only closed render | PR #58/#61 |
| modified | app/gallery/demos/select-demo.tsx | — | defaultOpen gated on poster | PR #58 |
| modified | app/gallery/demos/combobox-demo.tsx | — | defaultOpen gated on poster | PR #61 |
| modified | app/gallery/demos/command-demo.tsx | — | defaultOpen gated on poster | PR #61 |
| modified | next.config.ts | — | allow aurora.dinglebear.ai dev origin | PR #58 |
| modified | Dockerfile | — | install as node, drop chown -R (30min→~14min) | PR #60 |
| modified | ops/synthetic-check.sh | — | secret header, redirect-safe token path | PR #75 |
| modified | .github/workflows/synthetics.yml | — | pass AURORA_SYNTHETIC_TOKEN | PR #75 |
| created | ops/synthetics-cloudflare.md | — | operator runbook for the Cloudflare Skip rule | PR #75 |
| modified | ops/compose/production.env (gitignored) | — | deploy pointer bumped to main HEAD digests | local only |

## Beads Activity

| id | title | action | final status | why |
|---|---|---|---|---|
| aurora-58wf | Restore live demos in the components catalog | closed | closed | demos restored + verified (#56) |
| aurora-k1cm | check-web-budgets.mjs orphaned / main over budget | closed | closed | script deleted in #56; real-budget note recorded |
| aurora-t54a | Portal-scope Select and DropdownMenu | closed | closed | all five overlays honor portal container (#58) |
| aurora-a7mo | Auto-open overlay demos scroll-lock the page | closed | closed | fixed in #58; verified no body lock across scroll |
| aurora-5yck | Auto-open demos steal focus, yanking scroll | closed | closed | fixed in #61 (per-tile Suspense + inert + poster gating) |
| aurora-j2wo | Live site runs next dev: overlay/CSP/hydration | closed | closed | reverted the regression; prod restored on 50000 |
| aurora-sgm0 | Public synthetics 403 (duplicate) | closed | closed | duplicate of aurora-otgu; evidence merged |
| aurora-4vir | openwiki-update broken (better-sqlite3 native binding) | closed | closed | fixed by #72; workflow green on 7fef065, produced #74 |
| aurora-otgu | Restore public synthetics from runners | updated | open | proven root cause recorded; needs operator Cloudflare step |
| aurora-6c03 | Dependabot 260/261-package group fails CI | updated | open | #57 closed; split future groups rather than merge en masse |

Not touched this session (left open, out of scope): aurora-yelg (P0 review),
aurora-g15h and aurora-rmb4 (P3 openwiki transitive-dep hardening).

## Repository Maintenance

- **Plans**: no `docs/plans/` directory exists; nothing to move.
- **Beads**: eight closed with observed verification, two updated (see table).
- **Branches/worktrees**: single worktree on `main`. Deleted stale local branch
  `pr57` (tracked closed PR #57, superseded by #69) — `git branch -D pr57`.
  Left auto-PR branches `#73` (release-please 0.4.3) and `#74` (openwiki update)
  untouched — bot-owned, not this session's to merge.
- **Stale docs**: updated the `aurora-nashost-serves-dev-build` memory to reflect
  the post-#46 topology (prod on 50000, dev container profile-gated). Added
  `ops/synthetics-cloudflare.md` runbook.
- **Skipped/blocked**: could not create the Cloudflare Skip rule — the SWAG
  DNS-01 token lacks firewall scope and the Global API key was not repurposed.

## Tools and Skills Used

- **Shell (Bash)**: git, gh (PR merge/checks/watch), docker build/inspect/run,
  cosign verify, curl diagnostics, bd, ssh to edgehost. Primary workhorse.
- **File tools (Read/Edit/Write)**: all code and doc edits.
- **claude-in-chrome (CDP over Playwright to axon-chrome)**: verified previews,
  portal placement, and scroll behavior on real builds. Hit the known
  backgrounded-tab throttling and the dev-origin non-hydration artifact.
- **Skill superpowers:systematic-debugging**: invoked twice (Docker build,
  synthetics 403) to force evidence-before-fix.
- **Issues**: identified my own earlier mis-explanations (scroll = "dev only";
  synthetics = "IP block") and corrected them with instrumentation.

## Commands Executed

| command | result |
|---|---|
| `docker build --target dev --progress=plain` | chown step ~19min+, killed; proved root cause |
| `gh run` diag (push-triggered) capturing 403 | `cf-mitigated: challenge`, AS8075, dinglebear 200 |
| `ops/deploy.sh` (x3) | deployed 845057f → 15b5f90 → 7fef065 → ac39604, each self-verified |
| `cosign verify … publish.yml@refs/heads/main` | SIGNATURE VERIFIED for each deployed digest |
| `AURORA_SYNTHETIC_TOKEN=… ops/synthetic-check.sh` | header transmitted, 200, redirect-safe |

## Errors Encountered

- Public `next dev` on port 50000 reintroduced the dev overlay + landing
  hydration mismatch (aurora-j2wo). Resolved by reverting to the prod container.
- `pkill -f "docker compose"` matched its own shell, killing the wrapper;
  worked around with pid-targeted kills and clean restarts.
- Verifying via the tailnet IP made Next block `/_next/` chunks (no hydration,
  blank previews). Resolved by using the allowed hostname / `AURORA_DEV_ORIGIN`.

## Behavior Changes (Before/After)

| area | before | after |
|---|---|---|
| /components tiles | gradient + slug placeholder | live scaled demos |
| /components drawer | "Load Interactive Demo" link | interactive demo, overlays above drawer |
| /components scroll | froze / jumped to top | smooth to bottom, no lock |
| aurora-dev image build | 30min+, often unfinished | chown step 19min → 3.3s |
| Public synthetics (CI) | 403 at first request | inert until Cloudflare rule; then green |
| aurora.tootie.tv | ran next dev briefly | immutable prod image, main HEAD |

## Verification Evidence

| command | expected | actual | status |
|---|---|---|---|
| CDP scroll of /components (prod build) | monotonic, no reset | 900→9273, 0 scroll-to-zero | pass |
| CDP Select-in-drawer | opens above drawer | insideDrawerPanel=true | pass |
| docker run runner image | serves 200 as node uid | 200 /, 200 /components, uid=1000 | pass |
| curl x3 hostnames post-deploy | 200 + rev=ac39604 | all 200, rev=ac39604 | pass |
| runner diag curl | identify 403 source | Cloudflare Managed Challenge | pass |

## Risks and Rollback

- Deploy is digest-pinned and cosign-verified; rollback is `ops/deploy.sh` with a
  prior digest (e.g. `15b5f90` / `sha256:06b5d1ab…`).
- Synthetics code is inert until the operator adds the secret + Cloudflare rule;
  no runtime risk to the site.
- Docker `deps`-as-`node` change was validated against the production `runner`
  target locally and by the post-merge publish, since CI does not build the
  Dockerfile on PRs.

## Decisions Not Taken

- Origin-over-Tailscale for synthetics: rejected — loses public-edge + TLS
  coverage, the point of a public synthetic.
- Repurposing the SWAG Global API key to create the Cloudflare rule: rejected as
  over-broad; DNS-01 scoped token confirmed unable, handed off instead.
- Merging the 260/261-package dependabot group (#55/#57): rejected — fails CI;
  split into smaller groups.

## References

- PRs: #56, #58, #60, #61, #75 (this session); #43/#59/#70 releases; #72 OpenWiki.
- ops/synthetics-cloudflare.md (Cloudflare Skip-rule runbook).
- Beads: aurora-otgu, aurora-6c03, aurora-yelg, aurora-g15h, aurora-rmb4.

## Open Questions

- Which Cloudflare setting issues the Managed Challenge (Super Bot Fight Mode vs
  Security Level vs a custom rule)? The Skip rule works regardless, but the exact
  source is unconfirmed without dashboard access.

## Next Steps

- **Operator (unblocks synthetics)**: `gh secret set AURORA_SYNTHETIC_TOKEN` and
  add the Cloudflare Skip custom rule on the example.internal zone per
  `ops/synthetics-cloudflare.md`; then re-run `synthetics.yml` to confirm green
  and close aurora-otgu.
- **Bot PRs**: review/merge #73 (release 0.4.3) and #74 (OpenWiki update) as
  desired — automated, left untouched.
- **Follow-ups**: aurora-6c03 (split the dependabot group), aurora-g15h /
  aurora-rmb4 (OpenWiki transitive-dep hardening), aurora-yelg (P0 review).
