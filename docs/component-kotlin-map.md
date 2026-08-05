---
title: Aurora Component to Kotlin and Compose Map
created: 2026-07-30
updated: 2026-07-30
---

# Aurora Component → Kotlin/Compose Map

Cross-reference of every Aurora (shadcn/React) component and its nearest Jetpack Compose / Material 3 equivalent.

## Current Registry → Android Counterparts

Generated from the current `registry.json` inventory and `android/aurora/src/main/kotlin/tv/tootie/aurora/components`.

Registry items mapped: every component item in `registry.json` (its `items` array minus the `registry:style` token entries) — see `registry.json` for the current total. Most registry items have a named Kotlin counterpart; a handful are intentionally primitive/library/native-flow patterns rather than standalone Aurora Kotlin files. `aurora-ai-elements` is an umbrella registry item whose child items are mapped separately.

| Shadcn registry item | Type | Kotlin counterpart |
|---|---|---|
| `aurora-button` | ui | `AuroraButton.kt` |
| `aurora-badge` | ui | `AuroraBadge.kt` |
| `aurora-input` | ui | `AuroraTextField.kt` |
| `aurora-select` | ui | `AuroraSelect.kt` |
| `aurora-native-select` | ui | `AuroraSelect.kt` |
| `aurora-textarea` | ui | `AuroraTextField.kt` |
| `aurora-avatar` | ui | `AuroraAvatar.kt` |
| `aurora-progress` | ui | `AuroraProgress.kt` |
| `aurora-switch` | ui | `AuroraSwitch.kt` |
| `aurora-tabs` | ui | `AuroraTabs.kt` |
| `aurora-breadcrumb` | ui | `AuroraBreadcrumb.kt` |
| `aurora-pagination` | ui | `AuroraPagination.kt` |
| `aurora-dialog` | ui | `AuroraDialog.kt` |
| `aurora-dropdown-menu` | ui | `AuroraDropdownMenu.kt` |
| `aurora-tooltip` | ui | `AuroraTooltip.kt` |
| `aurora-context-menu` | ui | `AuroraContextMenu.kt` |
| `aurora-banner` | ui | `AuroraBanner.kt` |
| `aurora-toast` | ui | `AuroraToast.kt` |
| `aurora-empty-state` | ui | `AuroraEmptyState.kt` |
| `aurora-skeleton` | ui | `AuroraAiShimmer.kt` |
| `aurora-stat-card` | ui | `AuroraStatCard.kt` |
| `aurora-data-table` | ui | `AuroraDataTable.kt` |
| `aurora-filter-bar` | ui | `AuroraFilterBar.kt` |
| `aurora-prompt-input` | block | `AuroraPromptInput.kt` |
| `aurora-tool-calls` | block | `AuroraToolCallList.kt` |
| `aurora-thinking` | block | `AuroraThinking.kt` |
| `aurora-code-block` | block | `AuroraCodeBlock.kt` |
| `aurora-terminal` | block | `AuroraTerminal.kt` |
| `aurora-sidebar` | block | `AuroraSidebar.kt` |
| `aurora-checkbox` | ui | `AuroraCheckbox.kt` |
| `aurora-artifact` | block | `AuroraArtifact.kt` |
| `aurora-permission-prompt` | block | `AuroraPermissionPrompt.kt` |
| `aurora-ask-user-question` | block | `AuroraAskUserQuestion.kt` |
| `aurora-permissions-dropdown` | block | `AuroraPermissionPrompt.kt` |
| `aurora-file-tree` | block | `AuroraFileTree.kt` |
| `aurora-code-editor` | block | `AuroraCodeEditor.kt` |
| `aurora-web-preview` | block | `AuroraWebView.kt` |
| `aurora-login` | block | `AuroraLoginScreen.kt` |
| `aurora-oauth` | block | No direct Kotlin component; use Custom Tabs/AppAuth flow |
| `aurora-error-page` | block | `AuroraErrorPage.kt` |
| `aurora-attachment` | block | `AuroraAttachment.kt` |
| `aurora-command-palette` | block | `AuroraCommandPalette.kt` |
| `aurora-share-dialog` | block | `AuroraShareSheet.kt` |
| `aurora-file-picker` | block | `AuroraFilePicker.kt` |
| `aurora-field` | ui | `AuroraField.kt` |
| `aurora-radio-group` | ui | `AuroraRadioGroup.kt` |
| `aurora-slider` | ui | `AuroraSlider.kt` |
| `aurora-number-input` | ui | `AuroraNumberInput.kt` |
| `aurora-combobox` | ui | `AuroraCombobox.kt` |
| `aurora-popover` | ui | `AuroraPopover.kt` |
| `aurora-sheet` | ui | `AuroraSheet.kt` |
| `aurora-callout` | ui | `AuroraCallout.kt` |
| `aurora-status-indicator` | ui | `AuroraStatusIndicator.kt` |
| `aurora-timeline` | ui | `AuroraTimeline.kt` |
| `aurora-description-list` | ui | `AuroraDescriptionList.kt` |
| `aurora-resizable-panels` | ui | `AuroraResizablePanels.kt` |
| `aurora-listbox` | ui | `AuroraListbox.kt` |
| `aurora-search-results` | ui | `AuroraListbox.kt` / LazyColumn pattern |
| `aurora-kbd` | ui | `AuroraKbd.kt` |
| `aurora-toolbar` | ui | `AuroraToolbar.kt` |
| `aurora-separator` | ui | `AuroraSeparator.kt` |
| `aurora-spinner` | ui | `AuroraSpinner.kt` |
| `aurora-button-group` | ui | `AuroraButtonGroup.kt` |
| `aurora-accordion` | ui | `AuroraCollapsible.kt` |
| `aurora-ai-elements` | block | Umbrella registry item; map child registry items separately |
| `aurora-marketplace` | block | `AuroraMarketplace.kt` |
| `aurora-alert-dialog` | ui | `AuroraAlertDialog.kt` |
| `aurora-aspect-ratio` | ui | No direct Kotlin component; use `Modifier.aspectRatio` |
| `aurora-calendar` | ui | `AuroraCalendar.kt` |
| `aurora-card` | ui | `AuroraCard.kt` |
| `aurora-carousel` | ui | `AuroraCarousel.kt` |
| `aurora-chart` | ui | No direct Kotlin component; use Vico or another chart library |
| `aurora-collapsible` | ui | `AuroraCollapsible.kt` |
| `aurora-date-picker` | ui | `AuroraCalendar.kt` |
| `aurora-direction` | ui | No direct Kotlin component; use `LocalLayoutDirection` |
| `aurora-hover-card` | ui | `AuroraPopover.kt` |
| `aurora-input-group` | ui | `AuroraInputGroup.kt` |
| `aurora-input-otp` | ui | `AuroraInputOtp.kt` |
| `aurora-item` | ui | `AuroraItem.kt` |
| `aurora-label` | ui | No direct Kotlin component; use `Text` with label typography |
| `aurora-menubar` | ui | `AuroraMenubar.kt` |
| `aurora-navigation-menu` | ui | `AuroraNavigationMenu.kt` |
| `aurora-scroll-area` | ui | No direct Kotlin component; use Compose scroll modifiers / `LazyColumn` |
| `aurora-table` | ui | `AuroraTable.kt` |
| `aurora-toggle` | ui | `AuroraToggle.kt` |
| `aurora-toggle-group` | ui | `AuroraButtonGroup.kt` |
| `aurora-ai-attachments` | block | `AuroraAttachment.kt` |
| `aurora-ai-chain-of-thought` | block | `AuroraChainOfThought.kt` |
| `aurora-ai-checkpoint` | block | `AuroraCheckpoint.kt` |
| `aurora-ai-confirmation` | block | `AuroraAlertDialog.kt` |
| `aurora-ai-context` | block | `AuroraContextPanel.kt` |
| `aurora-ai-conversation` | block | `AuroraConversation.kt` |
| `aurora-ai-inline-citation` | block | `AuroraInlineCitation.kt` |
| `aurora-ai-message` | block | `AuroraMessage.kt` |
| `aurora-ai-model-selector` | block | `AuroraModelSelector.kt` |
| `aurora-ai-plan` | block | `AuroraPlanList.kt` |
| `aurora-ai-queue` | block | `AuroraQueueList.kt` |
| `aurora-ai-reasoning` | block | `AuroraReasoning.kt` |
| `aurora-ai-shimmer` | block | `AuroraAiShimmer.kt` |
| `aurora-ai-sources` | block | `AuroraSources.kt` |
| `aurora-ai-suggestion` | block | `AuroraSuggestionChip.kt` |
| `aurora-ai-task` | block | `AuroraTaskItem.kt` |
| `aurora-ai-tool` | block | `AuroraToolCallList.kt` |
| `aurora-ai-agent` | block | `AuroraAgentRow.kt` |
| `aurora-ai-commit` | block | `AuroraCommitRow.kt` |
| `aurora-ai-environment-variables` | block | `AuroraEnvironmentVariables.kt` |
| `aurora-ai-jsx-preview` | block | No direct Kotlin component; use `AuroraWebView.kt` for rendered preview |
| `aurora-ai-package-info` | block | `AuroraPackageInfo.kt` |
| `aurora-ai-sandbox` | block | `AuroraSandbox.kt` |
| `aurora-ai-schema-display` | block | `AuroraSchemaDisplay.kt` |
| `aurora-ai-snippet` | block | `AuroraSnippet.kt` |
| `aurora-ai-stack-trace` | block | `AuroraStackTrace.kt` |
| `aurora-ai-test-results` | block | `AuroraTestResults.kt` |
| `aurora-ai-audio-player` | block | `AuroraAudioPlayer.kt` |
| `aurora-ai-mic-selector` | block | `AuroraMicSelector.kt` |
| `aurora-ai-persona` | block | `AuroraPersona.kt` |
| `aurora-ai-speech-input` | block | `AuroraSpeechInput.kt` |
| `aurora-ai-transcription` | block | `AuroraTranscription.kt` |
| `aurora-ai-voice-selector` | block | `AuroraVoiceSelector.kt` |
| `aurora-ai-canvas` | block | `AuroraCanvasView.kt` |
| `aurora-ai-connection` | block | `AuroraConnection.kt` |
| `aurora-ai-controls` | block | `AuroraControls.kt` |
| `aurora-ai-edge` | block | `AuroraAiEdge.kt` |
| `aurora-ai-node` | block | `AuroraCanvasView.kt` node model |
| `aurora-ai-panel` | block | `AuroraAiPanel.kt` |
| `aurora-ai-image` | block | `AuroraAiImage.kt` |
| `aurora-ai-open-in-chat` | block | `AuroraOpenInChat.kt` |

## Observed Alignment Notes

### `aurora-button` → `AuroraButton.kt`

Viewed web `aurora-button` in the local gallery at `/gallery/buttons` with `agent-browser`, then viewed the Android counterpart on emulator `emulator-5554` in the app settings screen. The web gallery shows `aurora`, `neutral`, `rose`, `ghost`, and `destructive` variants, three size tiers, disabled states, icon content, and async/loading examples. The Android screen currently renders `AuroraButton` instances such as `Save`, `Log out`, `Approval Policy`, and `Approvals Reviewer`.

Required Kotlin alignment work:

- Rename or expand `AuroraButtonVariant` to match the shadcn API: `Aurora`, `Neutral`, `Rose`, `Automation`, `Ghost`, `Destructive`, and optionally `Plain`. Keep compatibility aliases only if app call sites need migration time.
- Replace the Material filled primary treatment with the web primary treatment: control-surface background, cyan mixed border, subtle top inset highlight, and cyan outer glow. The current Android `Save` button is a solid cyan filled pill, which is visually stronger than the web `aurora` variant.
- Add a size model matching web sizes: `Sm`, `Default`, `Lg`, `Icon`, and optionally `Unstyled`, with fixed heights and radius equivalents for 7px, 8px, and 10px rather than relying on Material default pill shapes.
- Add rose and automation variants using Aurora token colors. Rose is used for send/agent affordances on web; Axon orange is used for AI/automation identity.
- Add trailing icon and icon-only support. Current Kotlin has `leadingIcon` only, while web supports arbitrary icon content and has an explicit `icon` size.
- Preserve loading state width and spinner tone by variant. The web implementation keeps layout stable during loading and maps spinner tone to cyan, rose, or muted.
- Align disabled and pressed states with web behavior: disabled opacity around 45%, active press scale/tint feedback, and focus/selection as border plus glow rather than filled-state changes.

### `aurora-input` / `aurora-textarea` → `AuroraTextField.kt`

Viewed web `aurora-input` at `/gallery/input` and Android text fields in the settings screen. The web input is a compact tokenized control surface with explicit state variants in the gallery alternatives; Android currently wraps `OutlinedTextField`, which gives correct editing behavior but keeps Material default density, shape, and focus treatment.

Required Kotlin alignment work:

- Add Aurora-owned colors and shape to `AuroraTextField`: control-surface fill, strong border, muted placeholder, focus as cyan border/glow, and error as muted Aurora error rather than default M3 styling.
- Add density/size options so settings fields do not default to oversized Material text-field height when the web input is a compact operator control.
- Treat `textarea` as the same primitive with explicit multiline sizing and min/max line presets, rather than relying only on `singleLine = false`.
- Preserve the good existing accessibility/error semantics while moving visual styling off Material defaults.

### `aurora-field` → `AuroraField.kt`

Viewed web field usage through input/select pages and Android settings field labels/descriptions. Kotlin already has label, description, required, disabled, and error semantics; the gap is visual density and spacing.

Required Kotlin alignment work:

- Match the web field rhythm: tighter label/description spacing, Aurora label typography, muted description tone, and predictable control spacing.
- Add optional `hint`, `success`, or state slot parity if web field variants expose non-error helper states.
- Keep the current TalkBack required/error behavior; it is ahead of the web visual parity needs.

### `aurora-select` / `aurora-native-select` → `AuroraSelect.kt`

Viewed web `aurora-select` at `/gallery/select` and Android select-like controls in settings/chat (`Approval Policy`, `Approvals Reviewer`, model/reasoning selectors). Web select appears as a compact combobox trigger; Kotlin uses `ExposedDropdownMenuBox` and `OutlinedTextField`, while several app call sites hand-roll clickable rows plus dropdown menus.

Required Kotlin alignment work:

- Style the closed trigger like Aurora controls: control-surface background, rounded 8-10px equivalent radius, token border, muted trailing chevron, and active border/glow.
- Hoist `expanded` / `onExpandedChange` or add a second overload so app screens can use the shared primitive instead of custom clickable rows.
- Add option row styling for selected, disabled, danger, helper text, and sectioned entries so `ApprovalPolicyBar` can stop maintaining a local descriptive menu item.
- Split searchable combobox behavior from simple select behavior so `AuroraSelect`, `AuroraCombobox`, and web `native-select` mappings are explicit.

### `aurora-dropdown-menu` → `AuroraDropdownMenu.kt`

Compared web dropdown/select behavior via gallery snapshots and Android menus in model/approval controls. Kotlin supports groups, separators, danger items, leading icons, trailing text, and enabled state, but it still uses default Material menu chrome.

Required Kotlin alignment work:

- Apply Aurora menu surface, border, radius, shadow, and item hover/pressed equivalents instead of default Material popup styling.
- Add selected item treatment as first-class API, not just ad hoc trailing text checks.
- Add two-line item support to the component so descriptive approval-policy rows can be shared instead of implemented locally.

### `aurora-prompt-input` → `AuroraPromptInput.kt`

Viewed web `aurora-prompt-input` at `/gallery/prompt-input` and Android chat composer. The web prompt has attach, slash-command, mention, model selector, and send controls in a dense composer. Android has the message field, attachment affordance in the app layer, and a send button, while `AuroraPromptInput.kt` itself only exposes `leadingContent` plus the text/send row.

Required Kotlin alignment work:

- Promote attach, slash-command, mention, and model/action slots into the Kotlin component API so the app does not assemble composer chrome around the primitive.
- Match web composer shape and density: larger rounded container, token border, active rose/Axon-orange accent, and stable bottom toolbar layout.
- Add explicit disabled/loading/sendable visual states matching web, including spinner placement and disabled send tone.
- Keep the current haptic and IME-send behavior; those are Android-native parity wins.

### `aurora-sidebar` → `AuroraSidebar.kt`

Viewed web `aurora-sidebar` at `/gallery/sidebar` and Android drawer/sidebar in the running app. The web sidebar has workspace chrome, new-session action, search, grouped session sections, collapsible/compact modes, footer/settings, and selected-row treatment. Kotlin `AuroraSidebar.kt` is currently a thin `ModalNavigationDrawer` wrapper, while the app implements much of the richer sidebar separately.

Required Kotlin alignment work:

- Expand `AuroraSidebar` data model for header/workspace, primary action, search, grouped sections, session rows, footer actions, and compact/icon-only mode.
- Move app-specific drawer visuals toward the shared component so the current Android sidebar does not drift from the registry block.
- Add selected, active, empty, and collapsed states with Aurora token styling instead of Material `NavigationDrawerItem` defaults.

### `aurora-status-indicator` → `AuroraStatusIndicator.kt`

Viewed Android status usage in the chat header (`Connected`) and compared against the web status-indicator surface from the registry map. Kotlin has a good tone model and pulse behavior, but app usage currently mixes custom status rows and icons around it.

Required Kotlin alignment work:

- Add size and label-density variants matching web dot-only, dot-label, and compact status use cases.
- Ensure app headers use `AuroraStatusIndicator` directly instead of rebuilding dot + label rows.
- Audit tone names against web status token names so `Online`, `Syncing`, `Queued`, `Degraded`, `Offline`, `Error`, and `Automating` stay aligned with registry semantics.

### `aurora-toast` → `AuroraToast.kt`

Checked Kotlin source for the Snackbar-backed counterpart. Web toast supports Aurora status styling and action flows; Kotlin has status variants and action labels through `SnackbarHostState`, but still inherits Material snackbar layout.

Required Kotlin alignment work:

- Apply Aurora toast chrome: status border, muted status surface, compact radius, and stronger title/body/action layout if the web toast exposes title or description slots.
- Add dismiss action parity where web toasts expose close affordances.
- Keep the Snackbar queue/state model; the main gap is visual and slot parity.

## Full Pair Parity Matrix

This matrix is the working Kotlin parity backlog. It covers every non-token shadcn registry item from `registry.json`, including direct Kotlin counterparts, shared counterparts, umbrella entries, and intentional native/primitive delegates.

| Shadcn registry item | Kotlin target | Kotlin parity note |
|---|---|---|
| `aurora-button` | `AuroraButton.kt` | Match shadcn variants, sizes, icon-only, rose/automation, loading width, and border/glow styling instead of Material filled defaults. |
| `aurora-badge` | `AuroraBadge.kt` | Verify tone names, compact density, rounded radius, icon/overflow behavior, and status-token colors against web badge variants. |
| `aurora-input` | `AuroraTextField.kt` | Replace Material default shape/colors with Aurora control surface, compact density, focus glow, placeholder tone, and explicit state styling. |
| `aurora-select` | `AuroraSelect.kt` | Style trigger/menu with Aurora tokens, hoist expanded state, add selected/disabled/helper/danger rows, and share with app dropdown use. |
| `aurora-native-select` | `AuroraSelect.kt` | Decide whether native-select is only a simple select alias on Android or needs a separate non-searchable compact API. |
| `aurora-textarea` | `AuroraTextField.kt` | Add multiline presets, min/max row sizing, resize-equivalent behavior, and textarea-specific density around the shared text field. |
| `aurora-avatar` | `AuroraAvatar.kt` | Align sizes, fallback initials, image loading states, border/ring treatment, and grouped/avatar-stack behavior if present on web. |
| `aurora-progress` | `AuroraProgress.kt` | Match web determinate/indeterminate variants, track height, status tones, rose/Axon-orange support, and label/value semantics. |
| `aurora-switch` | `AuroraSwitch.kt` | Check thumb/track token colors, icon/thumb content, disabled opacity, focus ring, and animation timing against web switch. |
| `aurora-tabs` | `AuroraTabs.kt` | Align line/pill variants, active indicator style, scroll behavior, density, disabled tabs, and keyboard/focus semantics. |
| `aurora-breadcrumb` | `AuroraBreadcrumb.kt` | Match separators, truncation/collapse behavior, current-page treatment, icon slots, and muted link typography. |
| `aurora-pagination` | `AuroraPagination.kt` | Align page item sizes, ellipsis handling, prev/next icons, disabled/current states, and compact mobile wrapping. |
| `aurora-dialog` | `AuroraDialog.kt` | Match web dialog shell: panel radius, overlay opacity, header/body/footer slots, close affordance, and alert-vs-custom distinction. |
| `aurora-dropdown-menu` | `AuroraDropdownMenu.kt` | Apply Aurora popup chrome, selected item API, two-line items, shortcuts, danger styling, and section heading parity. |
| `aurora-tooltip` | `AuroraTooltip.kt` | Match plain/rich tooltip surfaces, delay behavior, arrow/placement options, compact typography, and disabled-trigger handling. |
| `aurora-context-menu` | `AuroraContextMenu.kt` | Align item model with dropdown menu, long-press behavior, disabled/danger/shortcut rows, and touch target sizing. |
| `aurora-banner` | `AuroraBanner.kt` | Match status variants, optional icon/action/dismiss slots, full-width spacing, and sticky or inline presentation options. |
| `aurora-toast` | `AuroraToast.kt` | Replace Material snackbar chrome with Aurora toast surface, status border, title/description/action slots, and dismiss parity. |
| `aurora-empty-state` | `AuroraEmptyState.kt` | Align icon sizing, title/body/action slots, compact/full-page variants, and muted visual hierarchy. |
| `aurora-skeleton` | `AuroraAiShimmer.kt` | Add non-AI skeleton aliases/variants for text/avatar/button/card shapes so web skeleton does not map only to AI shimmer. |
| `aurora-stat-card` | `AuroraStatCard.kt` | Match metric layout, trend/status slot, compact widths, border/glow treatment, and optional icon/action areas. |
| `aurora-data-table` | `AuroraDataTable.kt` | Align sorting, empty/loading states, row selection, sticky headers, density, column metadata, and action cells. |
| `aurora-filter-bar` | `AuroraFilterBar.kt` | Match chip variants, clear-all affordance, overflow/wrap behavior, selected count, and search/filter composition slots. |
| `aurora-prompt-input` | `AuroraPromptInput.kt` | Add attach/slash/mention/model slots, toolbar layout, loading/send states, and web composer density while preserving Android haptics. |
| `aurora-tool-calls` | `AuroraToolCallList.kt` | Match collapsed/expanded states, status tones, argument/result code blocks, timing metadata, and error display. |
| `aurora-thinking` | `AuroraThinking.kt` | Align animation, Axon-orange AI accent, text/compact variants, reduced-motion behavior, and placement within chat flows. |
| `aurora-code-block` | `AuroraCodeBlock.kt` | Match header, language badge, copy action, line wrapping, selection, syntax/highlight strategy, and terminal-vs-code distinction. |
| `aurora-terminal` | `AuroraTerminal.kt` | Align title/status/actions, line types, auto-scroll, monospace density, copy/clear affordances, and role/log semantics. |
| `aurora-sidebar` | `AuroraSidebar.kt` | Expand from drawer wrapper to registry block: search, groups, session rows, primary action, footer, selected/collapsed states. |
| `aurora-checkbox` | `AuroraCheckbox.kt` | Match checked/indeterminate styling, label/description composition, disabled tone, focus ring, and row vs standalone forms. |
| `aurora-artifact` | `AuroraArtifact.kt` | Align toolbar actions, language/type labels, expand/copy states, preview surfaces, loading/error states, and WebView handoff. |
| `aurora-permission-prompt` | `AuroraPermissionPrompt.kt` | Match permission severity variants, detail rows, allow/deny button hierarchy, command preview, and reviewer metadata. |
| `aurora-ask-user-question` | `AuroraAskUserQuestion.kt` | Align single/multi-choice options, submit/skip actions, validation, prompt typography, and selected-option treatment. |
| `aurora-permissions-dropdown` | `AuroraPermissionPrompt.kt` | Needs a real dropdown/sheet counterpart or an expanded prompt mode for granular permission toggles. |
| `aurora-file-tree` | `AuroraFileTree.kt` | Match folder/file icons, depth indentation, active/selected states, rename/actions, truncation, and keyboard navigation where feasible. |
| `aurora-code-editor` | `AuroraCodeEditor.kt` | Align editable/read-only modes, diagnostics, diff/line numbers, syntax highlighting, focus ring, and copy/save actions. |
| `aurora-web-preview` | `AuroraWebView.kt` | Match preview chrome, URL/status bar, reload/open actions, error/loading states, and JS/security defaults. |
| `aurora-login` | `AuroraLoginScreen.kt` | Align auth layout, provider buttons, validation/error surfaces, OAuth/device-code flows, and loading/disabled states. |
| `aurora-oauth` | Custom Tabs/AppAuth flow | Create a documented Compose OAuth flow component for scope/token rows, progress states, callback errors, and browser handoff. |
| `aurora-error-page` | `AuroraErrorPage.kt` | Match error code/status variants, retry/home actions, iconography, copy density, and full-screen vs embedded modes. |
| `aurora-attachment` | `AuroraAttachment.kt` | Align file icon/thumbnail, size metadata, remove/download actions, progress/error states, and compact chip/card variants. |
| `aurora-command-palette` | `AuroraCommandPalette.kt` | Match searchable modal, grouped results, keyboard shortcuts, active row, empty/loading states, and command metadata. |
| `aurora-share-dialog` | `AuroraShareSheet.kt` | Decide native sheet vs custom dialog parity; add preview/copy/link options if web share dialog exposes them. |
| `aurora-file-picker` | `AuroraFilePicker.kt` | Match button/dropzone modes, single/multiple selection, accepted types, selected file list, and error/progress display. |
| `aurora-field` | `AuroraField.kt` | Align field spacing, label/description/error/success states, required marker, disabled opacity, and control slot rhythm. |
| `aurora-radio-group` | `AuroraRadioGroup.kt` | Match option cards/rows, helper descriptions, selected border/glow, disabled/error states, and group semantics. |
| `aurora-slider` | `AuroraSlider.kt` | Align track/thumb color, tick/step labels, range slider parity, disabled state, value label, and touch target sizing. |
| `aurora-number-input` | `AuroraNumberInput.kt` | Match decrement/input/increment layout, min/max/step validation, disabled buttons, compact size, and keyboard behavior. |
| `aurora-combobox` | `AuroraCombobox.kt` | Align searchable trigger/input, filtering, empty state, selected chip/value display, keyboard navigation, and hoisted state. |
| `aurora-popover` | `AuroraPopover.kt` | Match anchor positioning, panel chrome, arrow/offset options, dismiss behavior, focus trapping, and rich content slots. |
| `aurora-sheet` | `AuroraSheet.kt` | Match side/bottom variants, header/body/footer slots, overlay, close affordance, drag handle, and responsive breakpoints. |
| `aurora-callout` | `AuroraCallout.kt` | Align tone variants, icon/title/body/action slots, border-left or full-border treatment, and compact density. |
| `aurora-status-indicator` | `AuroraStatusIndicator.kt` | Align tone names, dot-label sizes, pulsing behavior, compact variants, and ensure app headers use the shared primitive. |
| `aurora-timeline` | `AuroraTimeline.kt` | Match connector line, status dots/icons, timestamps, expanded detail rows, density, and loading/empty states. |
| `aurora-description-list` | `AuroraDescriptionList.kt` | Align label/value layout, columns/responsiveness, dividers, copyable values, muted labels, and compact mode. |
| `aurora-resizable-panels` | `AuroraResizablePanels.kt` | Match drag handle styling, min/max constraints, persistence hooks, orientation variants, and accessibility fallback. |
| `aurora-listbox` | `AuroraListbox.kt` | Align active/selected rows, multi-select, icons/descriptions/meta, keyboard navigation, empty state, and density. |
| `aurora-search-results` | `AuroraListbox.kt` / LazyColumn pattern | Add a named `AuroraSearchResults` wrapper with grouped headings, active rows, description/meta slots, and empty state. |
| `aurora-kbd` | `AuroraKbd.kt` | Match mono typography, border/fill, key grouping, size variants, and high-contrast/readability states. |
| `aurora-toolbar` | `AuroraToolbar.kt` | Align grouped actions, separators, icon button sizes, overflow behavior, sticky/inline variants, and disabled/active states. |
| `aurora-separator` | `AuroraSeparator.kt` | Match horizontal/vertical thickness, spacing presets, decorative semantics, and muted/strong token variants. |
| `aurora-spinner` | `AuroraSpinner.kt` | Align size/tone variants, aria/content descriptions, loading placement conventions, and rose/Axon-orange/muted tones. |
| `aurora-button-group` | `AuroraButtonGroup.kt` | Match single/multi-select, variant sizing, active border/glow, disabled options, icon options, and segmented density. |
| `aurora-accordion` | `AuroraCollapsible.kt` | Add an accordion wrapper supporting multiple items, single/multiple open modes, trigger/content styling, and chevron states. |
| `aurora-ai-elements` | Child components | Keep as umbrella docs/exports only; ensure every child item below has a Kotlin counterpart or explicit delegate note. |
| `aurora-marketplace` | `AuroraMarketplace.kt` | Align card/list variants, install/status actions, filters, search, badges, loading/empty states, and responsive grid. |
| `aurora-alert-dialog` | `AuroraAlertDialog.kt` | Match destructive/default variants, title/description/body/action slots, focus/escape behavior, and button hierarchy. |
| `aurora-aspect-ratio` | `Modifier.aspectRatio` | Document as modifier-only helper; add sample wrapper if consumers need a named Aurora API. |
| `aurora-calendar` | `AuroraCalendar.kt` | Align selected/range states, navigation header, disabled dates, density, token colors, and date-picker dialog split. |
| `aurora-card` | `AuroraCard.kt` | Match elevated/accent/interactive variants, header/content/footer slots, radius/shadow tiers, and selected/focus states. |
| `aurora-carousel` | `AuroraCarousel.kt` | Align controls, dots, keyboard/swipe behavior, item sizing, autoplay if present, and reduced-motion handling. |
| `aurora-chart` | Vico or chart library | Decide supported chart library and wrap tokens/legend/tooltip/empty states in a named Aurora chart API. |
| `aurora-collapsible` | `AuroraCollapsible.kt` | Match trigger slot, content animation, chevron, disabled state, and controlled/uncontrolled state API. |
| `aurora-date-picker` | `AuroraCalendar.kt` | Add explicit date-picker wrapper/dialog API covering trigger field, selected text, calendar popover, and range mode. |
| `aurora-direction` | `LocalLayoutDirection` | Document as composition helper; add a small named wrapper only if gallery parity needs an installable component. |
| `aurora-hover-card` | `AuroraPopover.kt` | Add hover-card alias/behavior for desktop and click fallback for Android, with rich content styling and delay config. |
| `aurora-input-group` | `AuroraInputGroup.kt` | Align leading/trailing addons, segmented controls, button slots, validation state, disabled state, and compact density. |
| `aurora-input-otp` | `AuroraInputOtp.kt` | Match digit boxes, focus advance/backspace, paste handling, error state, disabled state, and accessibility labels. |
| `aurora-item` | `AuroraItem.kt` | Align icon/avatar/content/meta/action slots, selected/active/danger states, density, and clickable row semantics. |
| `aurora-label` | `Text` with label typography | Decide if a named `AuroraLabel` wrapper is needed for required/disabled/error association parity with web label. |
| `aurora-menubar` | `AuroraMenubar.kt` | Align top-level menu interactions, keyboard navigation, nested submenus, checked/radio items, shortcuts, and disabled states. |
| `aurora-navigation-menu` | `AuroraNavigationMenu.kt` | Match nav bar/rail/drawer variants, active indicator, icons/badges, grouped items, and responsive layout. |
| `aurora-scroll-area` | Compose scroll modifiers / `LazyColumn` | Document modifier usage or add named scroll wrapper with fade/scrollbar parity for desktop/mobile. |
| `aurora-table` | `AuroraTable.kt` | Align static table density, sticky headers, column alignment, row hover/selected states, empty/loading rows, and horizontal scroll. |
| `aurora-toggle` | `AuroraToggle.kt` | Match pressed/selected styling, icon/text variants, size variants, disabled state, and toolbar integration. |
| `aurora-toggle-group` | `AuroraButtonGroup.kt` | Add toggle-group wrapper or mode for multi/single pressed state, roving focus, and item-level aria semantics. |
| `aurora-ai-attachments` | `AuroraAttachment.kt` | Add collection wrapper for multiple attachments, upload progress, remove/retry actions, and AI composer placement. |
| `aurora-ai-chain-of-thought` | `AuroraChainOfThought.kt` | Align collapsible reasoning steps, disclosure header, caution copy, streaming state, and Axon-orange AI styling. |
| `aurora-ai-checkpoint` | `AuroraCheckpoint.kt` | Match status icons/tone names, timestamp/detail slots, pending/running/done/failed states, and timeline integration. |
| `aurora-ai-confirmation` | `AuroraAlertDialog.kt` | Add confirmation-specific API for prompt, risk level, confirm/cancel labels, command preview, and blocking state. |
| `aurora-ai-context` | `AuroraContextPanel.kt` | Align token usage meter, included files/resources, threshold coloring, empty state, and compact panel layout. |
| `aurora-ai-conversation` | `AuroraConversation.kt` | Match message list spacing, streaming scroll behavior, empty/loading states, role semantics, and virtualization strategy. |
| `aurora-ai-inline-citation` | `AuroraInlineCitation.kt` | Align superscript/pill variants, source popover, active/visited state, and accessible link labels. |
| `aurora-ai-message` | `AuroraMessage.kt` | Match user/assistant/system variants, markdown/code slots, tool-call embeds, streaming state, actions, and avatar placement. |
| `aurora-ai-model-selector` | `AuroraModelSelector.kt` | Align grouped model options, provider/meta text, selected checkmark, Axon-orange trigger, disabled/loading states, and reasoning pairing. |
| `aurora-ai-plan` | `AuroraPlanList.kt` | Match task hierarchy, checkbox/status pills, progress summary, edit/expand states, and empty/running states. |
| `aurora-ai-queue` | `AuroraQueueList.kt` | Align queued/running/done/error tones, position metadata, actions, progress/spinner state, and compact row density. |
| `aurora-ai-reasoning` | `AuroraReasoning.kt` | Match disclosure surface, streamed text, step grouping, Axon-orange accent, collapsed summary, and reduced-motion behavior. |
| `aurora-ai-shimmer` | `AuroraAiShimmer.kt` | Align shimmer colors, animation timing, shape variants, reduced-motion fallback, and skeleton aliasing. |
| `aurora-ai-sources` | `AuroraSources.kt` | Match source pill/card variants, titles/domains/snippets, overflow behavior, active citation link, and horizontal scrolling. |
| `aurora-ai-suggestion` | `AuroraSuggestionChip.kt` | Align suggestion list/chip variants, icon/action slots, selected/disabled state, and wrapping behavior. |
| `aurora-ai-task` | `AuroraTaskItem.kt` | Match task statuses, checkbox behavior, assignee/meta slots, nested subtasks, disabled state, and status colors. |
| `aurora-ai-tool` | `AuroraToolCallList.kt` | Add single-tool wrapper/API for one tool call while sharing the list row styling and expand/collapse behavior. |
| `aurora-ai-agent` | `AuroraAgentRow.kt` | Align avatar/status/name/role/action slots, running/waiting/error states, pulse treatment, and compact row density. |
| `aurora-ai-commit` | `AuroraCommitRow.kt` | Match hash/message/author/time layout, status/diff metadata, copy/open actions, and monospace hash styling. |
| `aurora-ai-environment-variables` | `AuroraEnvironmentVariables.kt` | Align key/value masking, copy/reveal actions, required/missing states, grouping, and monospace/token colors. |
| `aurora-ai-jsx-preview` | `AuroraWebView.kt` | Add preview-specific wrapper for render errors, reload/open actions, sandbox notes, and size/chrome parity. |
| `aurora-ai-package-info` | `AuroraPackageInfo.kt` | Match package name/version/license/status, install/update actions, description wrapping, and registry/source metadata. |
| `aurora-ai-sandbox` | `AuroraSandbox.kt` | Align runtime/status/env rows, permissions, actions, warning/error states, and compact panel layout. |
| `aurora-ai-schema-display` | `AuroraSchemaDisplay.kt` | Match nested schema tree/table, required badges, type chips, descriptions, expand/collapse, and monospace values. |
| `aurora-ai-snippet` | `AuroraSnippet.kt` | Align inline/block variants, copy action, language label, mono typography, truncation, and selected/focus state. |
| `aurora-ai-stack-trace` | `AuroraStackTrace.kt` | Match frame rows, file/line styling, collapsed/expanded frames, copy/open actions, and error header. |
| `aurora-ai-test-results` | `AuroraTestResults.kt` | Align pass/fail/skipped summary, suite grouping, duration, failure details, rerun action, and status tones. |
| `aurora-ai-audio-player` | `AuroraAudioPlayer.kt` | Match controls, timeline, time labels, loading/error states, volume/playback speed if present, and accessibility labels. |
| `aurora-ai-mic-selector` | `AuroraMicSelector.kt` | Align device list, selected indicator, permission/error state, muted/unavailable devices, and trigger styling. |
| `aurora-ai-persona` | `AuroraPersona.kt` | Match avatar/name/role/status layout, selected/active states, description/meta slots, and compact variants. |
| `aurora-ai-speech-input` | `AuroraSpeechInput.kt` | Align recording/listening states, pulse animation, permission denial, disabled/loading states, and haptic feedback. |
| `aurora-ai-transcription` | `AuroraTranscription.kt` | Match live partial/final text, confidence/progress, error/empty state, scrolling, and highlight animation. |
| `aurora-ai-voice-selector` | `AuroraVoiceSelector.kt` | Align voice option metadata, preview action, selected state, disabled/loading, and Axon-orange AI trigger styling. |
| `aurora-ai-canvas` | `AuroraCanvasView.kt` | Align pan/zoom, node/edge slots, selection, minimap/controls if present, empty state, and touch gestures. |
| `aurora-ai-connection` | `AuroraConnection.kt` | Match connection status, direction labels, active/idle/error styling, animation, and node relationship metadata. |
| `aurora-ai-controls` | `AuroraControls.kt` | Align stop/pause/retry/etc. buttons, danger/disabled/loading states, icon size, tooltips/labels, and compact mode. |
| `aurora-ai-edge` | `AuroraAiEdge.kt` | Match edge label chip, active/error states, direction/metadata slots, and canvas integration. |
| `aurora-ai-node` | `AuroraCanvasView.kt` node model | Add explicit node rendering API or wrapper for node shape, status, icon/avatar, labels, and selection. |
| `aurora-ai-panel` | `AuroraAiPanel.kt` | Align title/action/footer slots, Axon-orange border/surface, collapsed state, loading/error states, and density. |
| `aurora-ai-image` | `AuroraAiImage.kt` | Match image frame, caption, loading/error, download/open actions, aspect ratio, and selected/focus states. |
| `aurora-ai-open-in-chat` | `AuroraOpenInChat.kt` | Align icon/button size, tooltip/label, disabled state, destination metadata, and placement in artifact/source surfaces. |

**Conventions used:**
- `M3` = `androidx.compose.material3.*`
- `Foundation` = `androidx.compose.foundation.*`
- `CMP` = Compose Multiplatform (Desktop/iOS — not Android-only)
- `Custom` = must be built as a custom Composable (no direct M3 primitive)
- `Third-party` = common library recommendation when M3 has no equivalent

---

## UI Primitives

| Aurora Component | Kotlin / Compose Equivalent | Package / Notes |
|---|---|---|
| `accordion` | `AnimatedVisibility` + custom trigger | Foundation — M3 has no Accordion; wrap in `Surface + Column` |
| `alert-dialog` | `AlertDialog` | `M3.AlertDialog` |
| `aspect-ratio` | `Modifier.aspectRatio(ratio)` | Foundation modifier |
| `avatar` | Custom `Box` + `AsyncImage` (Coil) | No M3 Avatar; `Box(shape = CircleShape)` + `Image` or initials `Text` |
| `badge` | `Badge`, `BadgedBox` | `M3.Badge` / `M3.BadgedBox` |
| `banner` | Custom `Surface` + `Row` | No M3 Banner (removed from M3); custom status strip |
| `breadcrumb` | Custom `Row` + `Text` + separators | No M3 Breadcrumb; `FlowRow` (M3) works for wrapping |
| `button-group` | `SingleChoiceSegmentedButtonRow` / `MultiChoiceSegmentedButtonRow` | `M3.SegmentedButton` |
| `button` | `Button`, `OutlinedButton`, `FilledTonalButton`, `TextButton`, `ElevatedButton` | `M3.*Button` — aurora "ghost" → `TextButton`, "neutral" → `OutlinedButton` |
| `calendar` | `DatePicker`, `DatePickerDialog` | `M3.DatePicker` — full calendar picker |
| `callout` | Custom `Surface` + `Row` (icon + text) | No M3 Callout; use `Card` with tonal color + leading icon |
| `card` | `Card`, `ElevatedCard`, `OutlinedCard`, `FilledCard` | `M3.*Card` — aurora `elevated` prop → `ElevatedCard`, `accent` → `OutlinedCard` with tint |
| `carousel` | `HorizontalPager` + `PagerState` | `Foundation.pager.HorizontalPager` (accompanist or foundation 1.4+) |
| `chart` | Third-party: **Vico** (`com.patrykandpatrick.vico`) | No M3 chart primitives |
| `checkbox` | `Checkbox`, `TriStateCheckbox` | `M3.Checkbox` |
| `collapsible` | `AnimatedVisibility` | Foundation — wrap trigger in `Row`, content in `AnimatedVisibility` |
| `combobox` | `ExposedDropdownMenuBox` + `ExposedDropdownMenu` | `M3.ExposedDropdownMenuBox` |
| `context-menu` | `DropdownMenu` on `Modifier.pointerInput(longPress)` | `M3.DropdownMenu` — no dedicated context menu; use long-press gesture |
| `data-table` | `LazyColumn` with custom header `Row` | Foundation — no M3 Table; use sticky headers via `stickyHeader {}` |
| `date-picker` | `DatePicker`, `DatePickerDialog`, `DateRangePicker` | `M3.DatePicker` |
| `description-list` | Custom `Column` of `Row(label, value)` items | No M3 equivalent; use `ListItem` loosely |
| `dialog` | `Dialog`, `AlertDialog` | `M3.AlertDialog` for confirmations; `M3.Dialog` for custom content |
| `direction` | `CompositionLocalProvider(LocalLayoutDirection provides ...)` | Foundation — `LayoutDirection.Rtl` / `LayoutDirection.Ltr` |
| `dropdown-menu` | `DropdownMenu`, `DropdownMenuItem` | `M3.DropdownMenu` + `M3.DropdownMenuItem` |
| `empty-state` | Custom `Column` (icon + title + description + action) | No M3 equivalent |
| `field` | Custom wrapper around `OutlinedTextField` + `Text` (label/error) | `M3.OutlinedTextField` has built-in `label`, `supportingText`, `isError` |
| `filter-bar` | `FlowRow` + `FilterChip` / `InputChip` | `M3.FilterChip`, `M3.InputChip`, `M3.FlowRow` (M3 1.2+) |
| `hover-card` | `TooltipBox` / `RichTooltip` (CMP Desktop) | `M3.TooltipBox` on Android; CMP `Popup` on Desktop |
| `input-group` | `OutlinedTextField` with `leadingIcon` / `trailingIcon` | `M3.OutlinedTextField` |
| `input-otp` | Custom: series of `BasicTextField` + focus forwarding | No M3 OTP input; build with `BasicTextField` array + `KeyboardOptions(imeAction)` |
| `input` | `TextField`, `OutlinedTextField`, `BasicTextField` | `M3.OutlinedTextField` for aurora's control-surface style; `state` prop → `isError`, `colors` |
| `item` | `ListItem` | `M3.ListItem` — `headlineContent`, `leadingContent`, `trailingContent` |
| `kbd` | Custom `Surface(shape = RoundedCornerShape) + Text(fontFamily = Mono)` | No M3 equivalent |
| `label` | `Text` with `MaterialTheme.typography.labelMedium` | Foundation — or `M3.Text` with body-small / label styles |
| `listbox` | `LazyColumn` + custom `SelectionContainer` | Foundation — `LazyColumn` with selection state |
| `menubar` | `TopAppBar` menu; CMP: `MenuBar` | `M3.TopAppBar` + `DropdownMenu` for desktop-style menubar; CMP `MenuBar` for true menubar |
| `native-select` | `ExposedDropdownMenuBox` | `M3.ExposedDropdownMenuBox` — replaces native `<select>` |
| `navigation-menu` | `NavigationBar`, `NavigationRail`, `NavigationDrawer` | `M3.NavigationBar` (bottom), `M3.NavigationRail` (side), `M3.NavigationDrawer` |
| `number-input` | Custom: `OutlinedTextField(keyboardType = Number)` + `IconButton` ×2 | No M3 spinner input; build with `Row(decrement, TextField, increment)` |
| `pagination` | Custom `Row` of page buttons / `LazyPagingItems` (Paging 3) | `androidx.paging.compose.collectAsLazyPagingItems` for data; UI is custom |
| `popover` | `Popup` + `Surface` | Foundation `Popup` — positioned relative to anchor |
| `progress` | `LinearProgressIndicator`, `CircularProgressIndicator` | `M3.LinearProgressIndicator` (determinate + indeterminate) |
| `radio-group` | `RadioButton` + `Column` | `M3.RadioButton` — pair each with a `Text` in a `Row` |
| `resizable-panels` | Custom drag-based `Box` with `Modifier.draggable` | No M3 equivalent; use `SplitPane` in CMP |
| `scroll-area` | `LazyColumn`, `LazyRow`, `Modifier.verticalScroll` | Foundation — `VerticalScrollbar` available in CMP Desktop |
| `search-results` | `LazyColumn` with custom items | Foundation — re-export of `listbox` pattern |
| `select` | `ExposedDropdownMenuBox` + `ExposedDropdownMenu` | `M3.ExposedDropdownMenuBox` |
| `separator` | `HorizontalDivider`, `VerticalDivider` | `M3.HorizontalDivider` / `M3.VerticalDivider` (M3 1.1+) |
| `sheet` | `ModalBottomSheet`, `BottomSheetScaffold` | `M3.ModalBottomSheet` — aurora "sheet" slides from right → use `ModalDrawer` / `M3.ModalNavigationDrawer` |
| `skeleton` | Custom shimmer `Box` + `InfiniteTransition` | No M3 equivalent; Third-party: **Shimmer** (`com.valentinilk.shimmer`) |
| `slider` | `Slider`, `RangeSlider` | `M3.Slider` — `onValueChange` / `valueRange` / `steps` |
| `spinner` | `CircularProgressIndicator` | `M3.CircularProgressIndicator` — aurora size/tone maps to `modifier.size()` + `color` param |
| `stat-card` | Custom `Card` + `Column(label, value, trend)` | No M3 equivalent; build on `ElevatedCard` |
| `status-indicator` | Custom `Box(shape=CircleShape)` + `Text` | `M3.Badge` works for dot-only; add label with `Row` |
| `switch` | `Switch` | `M3.Switch` — `thumbContent` slot for icon |
| `table` | `LazyColumn` with header `Row` + `stickyHeader` | Foundation — CMP Desktop has `BasicTable` (experimental) |
| `tabs` | `TabRow`, `ScrollableTabRow`, `Tab`, `LeadingIconTab` | `M3.TabRow` / `M3.ScrollableTabRow` — aurora `PillGroup` → `SingleChoiceSegmentedButtonRow` |
| `textarea` | `OutlinedTextField(singleLine = false, minLines = 3)` | `M3.OutlinedTextField` with `minLines` / `maxLines` |
| `timeline` | Custom `LazyColumn` with connecting line overlay | No M3 equivalent; `Canvas` + `LazyColumn` |
| `toast` | `Snackbar`, `SnackbarHost`, `SnackbarHostState` | `M3.Snackbar` — `SnackbarResult.ActionPerformed` for aurora's `action` prop |
| `toggle-group` | `SingleChoiceSegmentedButtonRow`, `MultiChoiceSegmentedButtonRow` | `M3.SegmentedButton` |
| `toggle` | `IconToggleButton`, `FilledIconToggleButton`, `FilledTonalIconToggleButton` | `M3.*IconToggleButton` |
| `toolbar` | `TopAppBar`, `CenterAlignedTopAppBar`, `MediumTopAppBar`, `LargeTopAppBar` | `M3.TopAppBar` — aurora's toolbar is inline (not top); use `Row` + custom styling |
| `tooltip` | `TooltipBox`, `PlainTooltip`, `RichTooltip` | `M3.TooltipBox` (M3 1.1+) |

---

## AI Blocks

These are Aurora-specific composites. All are `Custom` Composables — no direct M3 equivalent. The table shows the **Compose primitive(s) to build on**.

| Aurora Block | Build With | Notes |
|---|---|---|
| `artifact` | `Surface` + `AnimatedContent` + `IconButton` toolbar | Full artifact viewer; `WebView` for HTML artifacts |
| `ask-user-question` | `AlertDialog` or `Card` + `RadioButton` / `Checkbox` + `Button` | Option list with single/multi select |
| `agent` | `Row` + `Icon` + `AnimatedContent` + `StatusIndicator` | Agent header row with live status |
| `audio-player` | `Slider` + `IconButton` (play/pause/seek) + `MediaPlayer` | Use `MediaPlayer` or `ExoPlayer` (`media3`) under the hood |
| `canvas` | `Canvas` (Compose) + `Graph` node layout | Topology/flow canvas; consider **Zoomable** library |
| `chain-of-thought` | `AnimatedVisibility` + `LazyColumn` of step rows | Collapsible reasoning trace |
| `checkpoint` | `Row` + status dot + `Text` + `AnimatedVisibility` | Step/checkpoint with expandable detail |
| `commit` | `Row` + `Icon` + `Text` (hash, message, timestamp) | Git commit row item |
| `confirmation` | `AlertDialog` | Maps directly to M3 AlertDialog with confirm/cancel actions |
| `connection` | `Canvas` + node positions | Graph edge between two agent nodes |
| `context` | `Card` + `Column` + context item rows | Context window visualization |
| `controls` | `Row` + `IconButton` ×n | Toolbar of icon buttons for agent controls |
| `conversation` | `LazyColumn` + message composables | `LazyColumn` with `reverseLayout = false`; set `role = "log"` semantics |
| `message` | `Row` (user) / `Column` (assistant) + `Text` + avatar | Differentiate by sender; assistant = Axon-orange surface |
| `inline-citation` | `ClickableText` / custom `AnnotatedString` link | Inline superscript citation link |
| `mic-selector` | `ExposedDropdownMenuBox` + `Icon` (mic) | Audio input device picker |
| `model-selector` | `ExposedDropdownMenuBox` + `Icon` (Sparkles) | AI model picker; Axon-orange accent |
| `open-in-chat` | `IconButton` | Single action button to open artifact in chat |
| `package-info` | `Card` + `Row` (name, version, description) | Package/dependency info card |
| `panel` | `Surface` + `Column` with header | Generic titled panel |
| `persona` | `Row` + `Avatar` + `Text` (name, role) | Persona/profile display row |
| `plan` | `LazyColumn` of `Checkbox` + `Text` steps | Step list with completion state |
| `queue` | `LazyColumn` of queued item rows | Task queue visualization |
| `reasoning` | `AnimatedVisibility` + `Text` (pre-formatted) | Collapsible reasoning block |
| `sandbox` | `Card` + `Badge` (runtime/status) | Sandbox environment info card |
| `schema-display` | `LazyColumn` + custom property rows | JSON schema tree viewer |
| `shimmer` | Custom `InfiniteTransition` + gradient `Box` | Loading placeholder shimmer |
| `snippet` | `SelectionContainer` + `Text(fontFamily = Mono)` | Inline code snippet |
| `sources` | `LazyRow` of source pills | Source/citation chip list |
| `speech-input` | `IconButton` + `MicRecorder` state | Microphone input button with recording state |
| `stack-trace` | `SelectionContainer` + `LazyColumn` + `Text(fontFamily = Mono)` | Scrollable error stack trace |
| `suggestion` | `SuggestionChip` / `AssistChip` | `M3.SuggestionChip` |
| `task` | `Row` + `Checkbox` + `Text` + `Badge` | Task item with status badge |
| `test-results` | `LazyColumn` + pass/fail rows with `StatusIndicator` | Test result list |
| `tool` | Re-export of `ToolCalls` | — |
| `thinking` | `AnimatedVisibility` + pulsing `CircularProgressIndicator` | AI thinking state indicator |
| `tool-calls` | `LazyColumn` of tool call rows + `AnimatedVisibility` | Expandable tool call trace |
| `transcription` | `Text` + word-level highlight animation | Live transcription display |
| `voice-selector` | `ExposedDropdownMenuBox` + `Icon` (Sparkles) | TTS voice picker; Axon-orange accent |
| `prompt-input` | `OutlinedTextField(singleLine = false)` + send `IconButton` | Main chat input; `BasicTextField` for full styling control |

---

## Auth Blocks

| Aurora Block | Kotlin / Compose Equivalent | Notes |
|---|---|---|
| `login` | Custom full-screen `Scaffold` + `Column` (email, password fields + button) | `OutlinedTextField` + `Button`; password field uses `PasswordVisualTransformation` |
| `oauth` | Custom OAuth flow screen + `CustomTabsIntent` (Chrome Custom Tabs) | Use `androidx.browser.customtabs` or `AppAuth` library |
| `permission-prompt` | `AlertDialog` or `ModalBottomSheet` | Maps to `M3.AlertDialog` with permission description + allow/deny buttons |
| `permissions-dropdown` | `ModalBottomSheet` + `LazyColumn` of `ToggleRow` items | Granular permission toggles; `Switch` per permission row |

---

## Files Blocks

| Aurora Block | Kotlin / Compose Equivalent | Notes |
|---|---|---|
| `attachment` | `Card` grid tile or `ListItem` row | Thumbnail via `AsyncImage` (Coil); video badge overlay = `Box` |
| `code-editor` | Third-party: **CodeView** (`io.github.kbiakov.codeview`) or `BasicTextField` | No M3 code editor; `BasicTextField` + syntax highlighting library |
| `file-picker` | `rememberLauncherForActivityResult(GetContent())` | `ActivityResultContracts.GetContent` / `OpenDocument` / `GetMultipleContents` |
| `file-tree` | `LazyColumn` with recursive indented `TreeItem` composables | Custom recursion; `Modifier.padding(start = depth * 16.dp)` per level |

---

## Navigation / Workspace Blocks

| Aurora Block | Kotlin / Compose Equivalent | Notes |
|---|---|---|
| `terminal` | `SelectionContainer` + `LazyColumn` + `Text(fontFamily = Mono)` | Scroll-to-bottom with `LazyListState.animateScrollToItem(lastIndex)` |
| `code-block` | `SelectionContainer` + `Surface` + `Text(fontFamily = Mono)` | Copy button = `IconButton` + `ClipboardManager` |
| `command-palette` | `ModalBottomSheet` or `Dialog` + `TextField` (search) + `LazyColumn` | Full-screen search palette; `SearchBar` (M3 1.2+) is closest primitive |
| `marketplace` | `LazyVerticalGrid` or `LazyColumn` of `Card` items | `Foundation.LazyVerticalGrid` with `GridCells.Adaptive(minSize)` |
| `share-dialog` | `ShareSheet` via `Intent.ACTION_SEND` | Android native share sheet; `Intent(Intent.ACTION_SEND).apply { type = "text/plain" }` |
| `sidebar` | `ModalNavigationDrawer`, `PermanentNavigationDrawer`, `NavigationRail` | `M3.ModalNavigationDrawer` for mobile; `M3.PermanentNavigationDrawer` for large screens |
| `web-preview` | `AndroidView { WebView(context) }` | Embed Android `WebView` via `AndroidView` composable wrapper |

---

## Feedback Blocks

| Aurora Block | Kotlin / Compose Equivalent | Notes |
|---|---|---|
| `error-page` | Custom full-screen `Column` (icon + title + description + retry button) | No M3 error page; build on `Scaffold` + `Column` |

---

## Theming Notes

Aurora's dark-first navy palette maps to Material 3's dynamic color system:

```kotlin
// Aurora → M3 color role mapping
val AuroraColorScheme = darkColorScheme(
    primary          = Color(0xFF29B6F6),  // --aurora-accent-primary (cyan)
    secondary        = Color(0xFFF9A8C4),  // --aurora-accent-pink (rose)
    tertiary         = Color(0xFFFF9645),  // --axon-orange
    background       = Color(0xFF07131C),  // --aurora-page-bg
    surface          = Color(0xFF102330),  // --aurora-panel-medium
    surfaceVariant   = Color(0xFF13293A),  // --aurora-panel-strong
    outline          = Color(0xFF1D3D4E),  // --aurora-border-default
    outlineVariant   = Color(0xFF24536C),  // --aurora-border-strong
    onBackground     = Color(0xFFE6F4FB),  // --aurora-text-primary
    onSurface        = Color(0xFFE6F4FB),
    onSurfaceVariant = Color(0xFFA7BCC9),  // --aurora-text-muted
    error            = Color(0xFFC78490),  // --aurora-error
)
```

### Typography equivalents

| Aurora token | M3 Typography role |
|---|---|
| `--aurora-font-display` (Manrope) | `displayLarge`, `displayMedium`, `displaySmall` |
| `--aurora-font-sans` (Inter) | `bodyLarge`, `bodyMedium`, `bodySmall`, `labelLarge` |
| `--aurora-font-mono` (JetBrains Mono) | Custom `FontFamily` — use `FontFamily(Font(R.font.jetbrains_mono))` |
| `aurora-text-section` | `titleMedium` / `titleLarge` |
| `aurora-text-control` | `labelMedium` |
| `aurora-text-body-sm` | `bodySmall` |
| `aurora-text-caption` | `labelSmall` |

### AI / Automation Accent In Compose

Aurora uses Axon orange (`--axon-orange: #ff9645`) for AI/automation identity. Map this to M3's `tertiary` color role. Existing `accentViolet*` Kotlin slots are compatibility aliases to Axon orange until the API is renamed; do not introduce new violet AI styling.

```kotlin
// AI-accented surfaces use tertiary container
Surface(color = MaterialTheme.colorScheme.tertiaryContainer) { ... }
Icon(tint = MaterialTheme.colorScheme.tertiary) { ... }
```
