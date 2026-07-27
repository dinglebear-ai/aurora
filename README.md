# Aurora Design System

Operator-first design system for [Labby](https://github.com/jmagar/labby) — an AI-powered gateway control plane built with Rust.

![Aurora](https://img.shields.io/badge/Aurora-Design_System-29b6f6?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwxKSI+PHBhdGggZD0iTSA4IDEzIEwgMjQgNyBMIDQwIDEzIEwgMjQgMTkgWiIgZmlsbD0iIzI0NTM2YyIvPjxwYXRoIGQ9Ik0gOCAyMSBMIDI0IDE1IEwgNDAgMjEgTCAyNCAyNyBaIiBmaWxsPSIjMWM3ZmFjIi8+PHBhdGggZD0iTSA4IDI5IEwgMjQgMjMgTCA0MCAyOSBMIDI0IDM1IFoiIGZpbGw9IiMyOWI2ZjYiLz48cGF0aCBkPSJNIDggMzcgTCAyNCAzMSBMIDQwIDM3IEwgMjQgNDMgWiIgZmlsbD0iIzY3Y2JmYSIvPjwvZz48L3N2Zz4=)

## Overview

Aurora is a shadcn-compatible registry for agent products and operator-grade application workflows.

It is a dark-first, operator-grade design system featuring:
- **176 registry items** — 79 UI primitives + 73 composed blocks + 24 supporting styles, themes, pages, and registry utilities
- **CSS custom properties** — compatible with both dark and light themes
- **shadcn registry** — install any component with one command
- **Manrope + Inter + JetBrains Mono** font stack

Registry source is organized by responsibility:
- `registry/aurora/styles/` contains the Aurora token and theme contract.
- `registry/aurora/ui/` contains stable UI primitives.
- `registry/aurora/blocks/` contains domain-oriented product blocks for AI, workspace, files, auth, navigation, and feedback workflows.

## Quick install

```bash
# Install the Aurora token layer first
npx shadcn@latest add https://aurora.tootie.tv/r/aurora-tokens.json

# Then install any Aurora item
npx shadcn@latest add https://aurora.tootie.tv/r/aurora-button.json
```

## Registry usage

### Namespaced installs

Add Aurora to your project's `components.json`:

```json
{
  "registries": {
    "@aurora": "https://aurora.tootie.tv/r/{name}.json"
  }
}
```

Then install from the namespace:

```bash
npx shadcn@latest add @aurora/aurora-tokens
npx shadcn@latest add @aurora/aurora-button
```

### Branded root URL hosting

When you deploy this Next.js app, the root route is configured for shadcn content negotiation. Browsers still get the docs/gallery, while the shadcn CLI can resolve the root registry from `/` via the `Accept` or `User-Agent` headers.

That means the branded registry URL is simply:

```bash
https://aurora.tootie.tv
```

The generated registry payloads are still available directly under `public/r/*.json`.

## Setup

1. Add to `app/globals.css`:
```css
@import "../registry/aurora/styles/aurora.css";
```

2. Add to `app/layout.tsx`:
```tsx
import { Manrope, Inter, JetBrains_Mono } from "next/font/google"
// html className="dark"
```

## Components

### UI Primitives (`registry/aurora/ui/`)
| Component | Import |
|---|---|
| Button | `@/registry/aurora/ui/button` |
| Badge | `@/registry/aurora/ui/badge` |
| Input | `@/registry/aurora/ui/input` |
| Select | `@/registry/aurora/ui/select` |
| Textarea | `@/registry/aurora/ui/textarea` |
| Checkbox | `@/registry/aurora/ui/checkbox` |
| Switch | `@/registry/aurora/ui/switch` |
| Avatar | `@/registry/aurora/ui/avatar` |
| Progress | `@/registry/aurora/ui/progress` |
| Tabs | `@/registry/aurora/ui/tabs` |
| Breadcrumb | `@/registry/aurora/ui/breadcrumb` |
| Pagination | `@/registry/aurora/ui/pagination` |
| Dialog | `@/registry/aurora/ui/dialog` |
| DropdownMenu | `@/registry/aurora/ui/dropdown-menu` |
| ContextMenu | `@/registry/aurora/ui/context-menu` |
| Tooltip | `@/registry/aurora/ui/tooltip` |
| Banner | `@/registry/aurora/ui/banner` |
| Toast | `@/registry/aurora/ui/toast` |
| EmptyState | `@/registry/aurora/ui/empty-state` |
| Skeleton | `@/registry/aurora/ui/skeleton` |
| StatCard | `@/registry/aurora/ui/stat-card` |
| DataTable | `@/registry/aurora/ui/data-table` |
| FilterBar | `@/registry/aurora/ui/filter-bar` |

### Product Blocks (`registry/aurora/blocks/`)
| Block | Import |
|---|---|
| PromptInput | `@/registry/aurora/blocks/ai/prompt-input/prompt-input` |
| Terminal | `@/registry/aurora/blocks/navigation/terminal/terminal` |
| Thinking | `@/registry/aurora/blocks/ai/thinking/thinking` |
| ToolCalls | `@/registry/aurora/blocks/ai/tool-calls/tool-calls` |
| CodeBlock | `@/registry/aurora/blocks/workspace/code-block/code-block` |
| Artifact | `@/registry/aurora/blocks/ai/artifact/artifact` |
| Sidebar | `@/registry/aurora/blocks/workspace/sidebar/sidebar` |
| CommandPalette | `@/registry/aurora/blocks/workspace/command-palette/command-palette` |
| PermissionPrompt | `@/registry/aurora/blocks/auth/permission-prompt/permission-prompt` |
| AskUserQuestion | `@/registry/aurora/blocks/ai/ask-user-question/ask-user-question` |
| PermissionsDropdown | `@/registry/aurora/blocks/auth/permissions-dropdown/permissions-dropdown` |
| Attachment | `@/registry/aurora/blocks/files/attachment/attachment` |
| FilePicker | `@/registry/aurora/blocks/files/file-picker/file-picker` |
| FileTree | `@/registry/aurora/blocks/files/file-tree/file-tree` |
| CodeEditor | `@/registry/aurora/blocks/files/code-editor/code-editor` |
| WebPreview | `@/registry/aurora/blocks/workspace/web-preview/web-preview` |
| ShareDialog | `@/registry/aurora/blocks/workspace/share-dialog/share-dialog` |
| Login | `@/registry/aurora/blocks/auth/login/login` |
| OAuth | `@/registry/aurora/blocks/auth/oauth/oauth` |
| ErrorPage | `@/registry/aurora/blocks/feedback/error-page/error-page` |

## Theming

Aurora uses CSS custom properties for theming. Add `.light` to `<html>` or `<body>` to switch to light mode:

```tsx
document.documentElement.classList.toggle("dark")
document.documentElement.classList.toggle("light")
```

### Key tokens
```css
--aurora-accent-primary: #29b6f6;  /* cyan — primary CTA */
--aurora-accent-pink: #f9a8c4;     /* rose — secondary CTA, agent actions */
--aurora-success: #7dd3c7;
--aurora-warn: #c6a36b;
--aurora-error: #c78490;
```

### Themes — one palette, every surface

The same palette ships as ready-to-install themes for your editor, terminal,
browser, and shell, all under **[`themes/`](themes)** (browse them at
[`aurora.tootie.tv/themes`](https://aurora.tootie.tv/themes)):

- **[`themes/editors/`](themes/editors)** — [Zed](themes/editors/zed) (Aurora
  Neon + icon theme), [Warp](themes/editors/warp), and
  [Claude Code](themes/editors/claude-code).
- **[`themes/browser/`](themes/browser)** — [Chrome](themes/browser/chrome) MV3
  theme (dark + light).
- **[`themes/shell/`](themes/shell)** — Powerlevel10k prompt, the Claude Code
  statusline, `bat`, Midnight Commander, `nano`, and zsh colors (`eza`,
  dircolors, fast-syntax-highlighting, `fzf`).

See [`themes/README.md`](themes/README.md) for the full catalog; each subdir has
its own README with a palette table and install commands. The Claude Code theme
in [`themes/editors/claude-code/`](themes/editors/claude-code) is the origin
everything else aligns to. Served copies live under `public/{chrome,zed,warp}/`
for `curl` install from `aurora.tootie.tv` — those URLs are canonical, keep them
stable.

## Reproducible installs

The `aurora.tootie.tv/r/*` endpoints are mutable discovery URLs. Production
consumers should pin a full Git commit in the raw GitHub registry URL; see
[`docs/versioning.md`](docs/versioning.md) for the install command and upgrade
procedure.

## Development

```bash
pnpm install
pnpm dev        # starts on http://localhost:3000
pnpm lint
pnpm audit:composition
pnpm exec tsc --noEmit
pnpm build
pnpm audit:standalone
pnpm registry:build
pnpm registry:graph
pnpm generated:check
pnpm tokens:generate

# Unit tests (Node test runner — no framework required)
pnpm test:unit

# Android gates
cd android
./gradlew androidCheck --no-daemon
```

> **Generated artifacts:** `pnpm build` first verifies gallery routes and the
> compact client catalog against their sources, then runs `pnpm readmes:generate`.
> Gallery entries and `lib/gallery-manifest.json` come from
> `app/gallery/demo-map.tsx` via `pnpm gallery:generate`;
> `lib/client-catalog.json` comes from navigation, slug, and registry metadata
> via `pnpm catalog:generate`. Theme README assets under `public/readmes/` come
> from `lib/themes.ts` plus `themes/**/README.md`.
> If the prebuild step mutates files you have staged, commit or stash those
> changes first — otherwise the working tree will be dirty after the build.

## Contributing

1. Components live in `registry/aurora/ui/` for primitives or `registry/aurora/blocks/<domain>/<name>/` for product blocks
2. Add a demo at `app/gallery/demos/<name>-demo.tsx`
3. Register the demo in `app/gallery/demo-map.tsx` and its navigation/slug metadata
4. Run `pnpm gallery:generate` (never edit `app/gallery/entries/` or the manifest directly)
5. Update `registry.json`, run `pnpm registry:build`, then `pnpm generated:check`
6. Use inline styles with Aurora CSS vars — never hardcode hex values

## Deployment

Local development uses `docker compose --profile dev up aurora-dev`. A local
standalone smoke uses `docker compose --profile prod-build up aurora-prod-build`
on port 50001. Public traffic uses only the digest-pinned, read-only production
overlay documented in [`docs/deployment.md`](docs/deployment.md); it never
serves the source bind mount or a mutable image tag.

## Security

The web app sets a baseline of HTTP security headers (CSP, HSTS, `X-Frame-Options`,
and more). See [`docs/security.md`](docs/security.md) for the full security posture
and known limitations.

## License

MIT
