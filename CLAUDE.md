# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->


## Build & Test

```bash
pnpm install
pnpm dev                  # Next dev server (Turbopack)
pnpm build                # Production Next build
pnpm lint                 # ESLint (flat config)
pnpm registry:build       # Rebuild shadcn registry JSON → public/r/*.json
pnpm tokens:generate      # Export Aurora tokens + run Android Style Dictionary
pnpm audit:composition    # Check registry composition rules
```

## Architecture Overview

Aurora is a **shadcn-compatible component registry** (176 items) served as a
Next.js 16 / React 19 / Tailwind v4 app at `aurora.dinglebear.ai` (canonical
domain; `aurora.tootie.tv` still resolves and its served URLs stay valid). The site is a
landing page (`/`) + a component gallery + a themes hub (`/themes`), and doubles
as a live registry endpoint — `/` content-negotiates between browser (landing)
and shadcn CLI (registry JSON from `public/r/*.json`).

- `app/(marketing)/` — public site: landing at `/` and the `/themes` hub
  (shared chrome from `components/site/`; root content negotiation → registry JSON)
- `app/gallery/` — the component gallery
- `app/dinglebear/` — serves the co-hosted dinglebear.ai tenant (see below)
- `registry/aurora/styles/` — Aurora token layer (`aurora.css`, CSS custom properties)
- `registry/aurora/ui/` — 79 published UI primitives plus 2 internal support primitives
- `registry/aurora/blocks/{ai,auth,feedback,files,navigation,workspace}` — composed product blocks
- `lib/themes.ts` — catalog powering the `/themes` site (single source of truth for the web)
- `components/site/` — shared marketing chrome (header/footer shell, theme cards, style helpers)
- `android/` — Style Dictionary output for native parity
- `themes/` — canonical Aurora theme sources for every surface:
  `themes/editors/{zed,warp,claude-code}`, `themes/browser/chrome`,
  `themes/shell/{p10k,statusline,bat,mc,nano,zsh}`. Per-tool READMEs +
  [`themes/README.md`](themes/README.md). Served copies under
  `public/{chrome,zed,warp}/` — those install URLs are canonical, keep them stable.
- `app/dinglebear/` + `proxy.ts` — **co-hosted tenant**: dinglebear.ai served
  via host rewrite as an Aurora-native page composing registry components
  (see `dinglebear/README.md`). `public/dinglebear/` holds the retired
  static-HTML tenant as handoff artifacts only.
- `scripts/` — `export-aurora-tokens.mjs`, `audit-composition.mjs`
- `registry.json` — shadcn registry manifest (source of truth for the build)

## Conventions & Patterns

- **Dark-first.** Navy base `#07131c`; accents = Cyan (primary), Rose (secondary), Axon orange (AI/automation).
- **Title Case for labels** (authoritative casing rule): buttons, headers, table columns,
  menu items, tabs, section titles — *Active Gateways*, never *active gateways*. Minor words
  (a, of, to, in, and, or) stay lowercase mid-phrase. Sentence case is ONLY for full-sentence
  body/help/status copy. Uppercase is reserved for eyebrows and badge labels.
- **Always use Aurora tokens** via CSS custom properties — no raw Tailwind color defaults.
- **Registry changes require rebuild.** After editing anything in `registry/aurora/**`,
  run `pnpm registry:build` so `public/r/*.json` stays in sync.
- **Token changes are cross-platform.** Edits to `registry/aurora/styles/aurora.css`
  must be followed by `pnpm tokens:generate` to refresh Android outputs.
- **Themes mirror the tokens.** Everything under `themes/` (`editors/`, `browser/`,
  `shell/`) hand-authors the Aurora palette in each tool's native format (excluded
  from the Next build, TS, and eslint). They are canonical here; `~` configs are
  deployed copies — keep both in sync when palette values change, re-sync
  `public/{chrome,zed,warp}/`, and update `lib/themes.ts` if the catalog changes.
- **Don't move served theme URLs.** `public/{chrome,zed,warp}/` and
  `public/themes/previews/` are canonical install/asset URLs referenced by docs and
  external users. Theme *source* lives in `themes/`; served copies stay in `public/`.
- **Package manager: pnpm** (`packageManager: pnpm@10.33.2`). Do not introduce npm/yarn lockfiles.
- **pnpm `overrides` + `onlyBuiltDependencies` live in `pnpm-workspace.yaml`, NOT the `package.json` `pnpm` field** — pnpm 10 silently ignores that field. A dead `pnpm.overrides` block let a vulnerable `tmp` slip past the security pins (fixed 2026-05-31).
- **Non-interactive shell.** Use `cp -f`, `mv -f`, `rm -f`, `rm -rf` — see `AGENTS.md`.
- **See also:** `AGENTS.md` (agent shell rules), `SKILL.md` (Aurora usage skill),
  `docs/component-kotlin-map.md` (Kotlin/Compose parity matrix).
- **SWAG upstream contract:** `aurora.dinglebear.ai` (canonical; `aurora.tootie.tv`
  also matches via the wildcard `server_name aurora.*`), `dinglebear.ai`, and
  `www.dinglebear.ai` are reverse-proxied by SWAG on `edgehost` to the immutable
  `aurora` production container on **devhost**, host port `50000→3000`. The
  canonical digest-only Compose overlay and SWAG templates are tracked under
  `ops/`; `docs/deployment.md` is the runbook. The `aurora-dev` source bind mount
  is isolated on port 3000 and must never receive public traffic. Scheme HTTP,
  no Authelia. Validate topology before changing either side.
