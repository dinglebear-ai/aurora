---
title: Aurora Gallery Complaint Matrix
created: 2026-07-30
updated: 2026-07-30
---

# Aurora Gallery Complaint Matrix

This file captures each review comment as a chooser prompt. Each item has a blank `Answer` space for the selected direction after reviewing the gallery alternatives.

## Gallery Shell

### Gallery page layout
Path: `/home/jmagar/workspace/aurora/app/gallery/[section]/page.tsx`

- [ ] Keep the top `Components / Name` heading, but move the install card below the live component demo.
- [ ] Remove duplicated component headings and duplicate descriptions inside demos.
- [ ] Stop preserving a low scroll position when navigating between gallery pages.

Answer:


### Gallery navigation
Path: `/home/jmagar/workspace/aurora/app/gallery/layout.tsx`

- [ ] Remove duplicate routes where one demo is clearly better (`table` vs `tables`, `resizable` vs `resizable-panels`, `queue` vs `task`).
- [ ] Add stronger icon/indicator language with less redundant text.

Answer:


## AI Activity

### Reasoning
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/thinking/thinking.tsx`

- [ ] Collapsed reasoning should be icon-only.

Answer:


### Thinking
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/thinking-demo.tsx`

- [ ] Thinking gallery demo should present an icon-only collapsed state.

Answer:


### Chain of thought
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/thinking/thinking.tsx`

- [ ] Collapsed chain-of-thought should be icon-only.

Answer:


### Plan
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/thinking/thinking.tsx`

- [ ] Collapsed plan should be icon-only.
- [ ] Plan must not render like a full-width table or stretch across the whole screen.
- [ ] Plan should behave visually like compact tool calls/thinking.

Answer:


### Tool and Tool Calls
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/tool-calls/tool-calls.tsx`

- [ ] Collapsed tool and tool-call controls should be icon-only.
- [ ] Replace letter badges with relevant lucide icons for read, write, shell, grep, lookup, and fallback tool types.

Answer:


### Task and Queue
Path: `/home/jmagar/workspace/aurora/app/gallery/[section]/page.tsx`

- [ ] Task and Queue are visually/functionally duplicate demos and should be deduplicated.

Answer:


## Compactness and Surface Footprint

### Compact footprint targets
Paths:
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-agent-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-checkpoint-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-commit-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-environment-variables-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-package-info-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-sandbox-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-snippet-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-jsx-preview-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-stack-trace-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-test-results-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-panel-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-audio-player-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-mic-selector-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-transcription-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-voice-selector-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/item-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/chart-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/card-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-inline-citation-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-sources-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ask-user-question-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/permission-prompt-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-suggestion-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-open-in-chat-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-persona-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/collapsible-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/accordion-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/listbox-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/search-results-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/description-list-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/timeline-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/data-table-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/command-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-model-selector-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/ai-confirmation-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/sonner-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/calendar-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/number-input-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/textarea-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/slider-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/combobox-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/date-picker-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/banners-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/label-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/field-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/input-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/progress-demo.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/toggle-demo.tsx`

- [ ] These demos/components must not expand to fill the whole chat/page width by default.
- [ ] Present compact chooser alternatives for every listed component.

Answer:


## Files and Content

### Sources
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/elements/core.tsx`

- [ ] Sources should never take a huge full-width panel footprint.
- [ ] Sources should condense to badge-like file chips with relevant filetype icons.
- [ ] Sources should remove excess row height and avoid oversized counts.

Answer:


### Attachment chip
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/files/attachment/attachment.tsx`

- [ ] Make the attachment chip about half as tall, closer to badge height.
- [ ] Move file size inline to the right of the file name.
- [ ] Make the dismiss button about half the current diameter.
- [ ] Show dismiss only on hover for desktop and after tap/focus for touch/mobile.
- [ ] Use a relevant filetype icon rather than a generic visual indicator.

Answer:


### Inline citation
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/elements/core.tsx`

- [ ] Inline citation should show a hover tooltip.

Answer:


### File picker
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/files/file-picker/file-picker.tsx`

- [ ] Picker should not anchor in the bottom-right of the viewport/page.

Answer:


### File tree
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/files/file-tree/file-tree.tsx`

- [ ] Open tabs need polish and should resemble refined compact attachment chips.
- [ ] Selection detail card needs stronger visual hierarchy and polish.

Answer:


### Code surfaces
Paths:
`/home/jmagar/workspace/aurora/registry/aurora/blocks/files/code-editor/code-editor.tsx`
`/home/jmagar/workspace/aurora/registry/aurora/blocks/workspace/code-block/code-block.tsx`
`/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/elements/core.tsx`
`/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/artifact/artifact.tsx`

- [ ] Code editor, code blocks, snippets, JSX previews, and artifacts need colored syntax highlighting.

Answer:


## Sidebar

### Agent session sidebar
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/workspace/sidebar/sidebar.tsx`

- [ ] Fix the bottom avatar treatment in the existing sidebar.
- [ ] Preserve the good session-sidebar density and hierarchy.

Answer:


### Site navigation sidebar
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/workspace/sidebar/sidebar.tsx`

- [ ] Add a separate site-navigation sidebar block/component, distinct from agent-session navigation.

Answer:


## Specific Component Redesigns

### Chart
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/chart.tsx`

- [ ] Chart needs visual polish and should not feel like a placeholder.

Answer:


### Card
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/card.tsx`

- [ ] Card is too generic, too wide, and needs a serious redesign.

Answer:


### Carousel
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/carousel.tsx`

- [ ] Carousel does not actually feel like a carousel.

Answer:


### Data table
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/data-table.tsx`

- [ ] Data table route/demo does not look like a data table.

Answer:


### Tables
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/tables-demo.tsx`

- [ ] Align status indicators first, then text, so labels do not zigzag.
- [ ] Move environment badges into a consistent right-side column.
- [ ] Fix tight spacing around the Add gateway action.

Answer:


### Table
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/table-demo.tsx`

- [ ] Remove or redirect the weaker `table` page because `/tables` is better.

Answer:


### Command
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/command-demo.tsx`

- [ ] Command looks like an alert clone; differentiate it or delete it.

Answer:


### Sonner
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/sonner-demo.tsx`

- [ ] Sonner looks like an alert clone; differentiate it or delete it.

Answer:


### Callout
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/callout.tsx`

- [ ] Callout looks like another alert clone; differentiate it or delete it.

Answer:


### Breadcrumb
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/breadcrumb.tsx`

- [ ] Breadcrumbs are too low-contrast and hard to identify as breadcrumbs.

Answer:


### Input group
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/input-group.tsx`

- [ ] Current input groups are visually broken and need a complete restart.

Answer:


### Toggle
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/toggle.tsx`

- [ ] Toggle demo appears not to do anything.

Answer:


### Buttons
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/button.tsx`

- [ ] Button shapes, borders, and weights are not attractive enough.
- [ ] Button text weight is too thick.
- [ ] Button states should follow modern best practices: clear default, hover, pressed, focus, disabled, and loading behavior.

Answer:


### Direction
Path: `/home/jmagar/workspace/aurora/registry/aurora/ui/direction.tsx`

- [ ] Direction demo needs a more meaningful RTL/LTR example.

Answer:


### Brand
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/brand-demo.tsx`

- [ ] Brand page should show every icon, mark, lockup, and logo asset.

Answer:


### Prompt input
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/prompt-input/prompt-input.tsx`

- [ ] Prompt input is a high-use component and needs a much stronger design.

Answer:


### Conversation
Path: `/home/jmagar/workspace/aurora/registry/aurora/blocks/ai/elements/core.tsx`

- [ ] Conversation surface is visually weak compared with the sidebar and needs a stronger chat layout.

Answer:


### Popover / Hover card / Sheet / Drawer
Paths:
`/home/jmagar/workspace/aurora/registry/aurora/ui/popover.tsx`
`/home/jmagar/workspace/aurora/registry/aurora/ui/hover-card.tsx`
`/home/jmagar/workspace/aurora/registry/aurora/ui/sheet.tsx`
`/home/jmagar/workspace/aurora/app/gallery/demos/drawer-demo.tsx`

- [ ] Popover is too basic.
- [ ] Hover card is too basic.
- [ ] Sheet is too basic.
- [ ] Drawer is too basic.

Answer:


## Foundations

### Colors
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/colors-demo.tsx`

- [ ] Colors feel regressed toward teal/grey instead of electric blue and modern light blues/purples/pinks.
- [ ] Show all expanded color tokens that exist.
- [ ] Add a color picker for all 13 core colors.
- [ ] Let the user choose the three accent colors first.
- [ ] Suggest compatible semantic and interaction colors from the chosen accent colors, while still allowing manual override.

Answer:


### General color and contrast direction
Path: `/home/jmagar/workspace/aurora/registry/aurora/styles/aurora.css`

- [ ] Increase vibrancy, saturation, and contrast while staying clean and modern.
- [ ] Reduce grey/teal dullness.
- [ ] Improve icon and text colors that currently default to weak grey.
- [ ] Use more icons and indicators and less explanatory text.

Answer:


### Corner glow treatment
Path: `/home/jmagar/workspace/aurora/registry/aurora/styles/aurora.css`

- [ ] Remove the wrap-around corner glow treatment from every component.
- [ ] Replace it with a cleaner, classier active/focus/selection treatment.

Answer:


### Borders and radii
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/spacing-demo.tsx`

- [ ] Provide several alternate border/radius treatment options.

Answer:


### Typography
Path: `/home/jmagar/workspace/aurora/app/gallery/demos/type-demo.tsx`

- [ ] Typography demo needs work; larger examples look better and should guide the scale.

Answer:
