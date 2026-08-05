# Aurora Device Catalog

Cross-platform catalog for Aurora's canonical React/shadcn components.

## Source-of-truth rule

The catalog imports components directly from `registry/aurora`. It does not consume, mirror, or compare against the legacy Jetpack Compose components under the repository's top-level `android/` directory.

React owns the UI. Tauri supplies desktop and mobile application shells. Native Kotlin or Swift is limited to narrow platform capabilities exposed through Tauri plugins.

## Coverage

The generated inventory covers all 176 registry items:

- 157 existing gallery preview mappings
- 28 registry items backed by 13 fixtures shared with Storybook
- Visual preview coverage for every runtime UI, block, and page registry item
- Explicit mobile readiness for every item: `ready`, `adaptive`, `native-bridge`, `desktop-first`, or `metadata-only`
- Capability tags for touch, keyboard, overlays, safe areas, back navigation, files, media, clipboard, sharing, and external-browser handoff
- Metadata previews for registry assets and runtime surfaces that do not yet have a dedicated visual demo

The Platform mode exercises viewport behavior, clipboard, Web Share, file selection, local storage, WebView history, and native-plugin boundaries. Catalog state is URL-addressable, including the selected item, platform mode, viewport, theme, group, readiness filter, and search query.

Hosted builds are served by the main Aurora application at paths such as:

```text
/catalog/aurora-prompt-input?device=phone&theme=dark
/catalog/platform?device=phone
```

## Structure

- `../../catalog/inventory.json`: generated complete registry inventory
- `../../catalog/fixtures.tsx`: fixtures shared by Storybook and the device catalog
- `../../scripts/generate-device-catalog.mjs`: deterministic inventory generator and drift check
- `src/`: responsive React catalog shell and capability lab
- `src-tauri/`: Tauri v2 desktop and mobile backend
- `src-tauri/gen/android/`: generated Android Studio project

## Generate and validate the inventory

From the repository root:

```bash
pnpm catalog:device:generate
pnpm catalog:device:check
```

The production catalog build runs the drift check automatically. The main Aurora production build also exports the catalog into `public/catalog` for hosting under `/catalog/`.

Run the full browser verification matrix with:

```bash
pnpm catalog:device:crawl
```

This checks all 176 registry items at four viewport profiles and writes JSON, Markdown, screenshots, traces, and failure evidence under `outputs/device-catalog/`.

## Run in a browser

```bash
pnpm catalog:device:dev
```

## Run with Tauri desktop

```bash
pnpm --dir apps/device-catalog tauri dev
```

## Run with Tauri Android

Ensure `JAVA_HOME`, `ANDROID_HOME`, and the Android NDK are configured, then connect a device or start an emulator:

```bash
pnpm catalog:device:android
```

Run the complete Android build, install, WebView, back-navigation, screenshot, and log smoke test with:

```bash
pnpm catalog:device:android:test
```

Create a debug or release APK with:

```bash
pnpm catalog:device:android:build -- --debug --apk
```

The Android commands resolve `cargo`, `rustc`, and `rustdoc` from the native stable rustup toolchain before invoking Tauri. This prevents external Cargo wrappers from silently selecting a private toolchain without the installed Android targets.

Add or adjust mobile-readiness rules in `../../scripts/generate-device-catalog.mjs`. Add shared interactive examples to `../../catalog/fixtures.tsx`; the matching Storybook stories import the same fixtures.
