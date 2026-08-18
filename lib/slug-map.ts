// Gallery slug → registry item name. Handles plurals and aliases.
//
// This is a *pure* data + resolver module: it deliberately imports nothing
// (no React, no next, no registry.json), so it can be imported directly by
// Node's `--test` runner (which does not resolve the `@/` path alias or JSON
// import assertions). `lib/registry-meta.ts` re-exports these and layers the
// registry.json lookup on top.
//
// NOTE: ai- prefix normalization is handled in slugToRegistry(), not in the
// map itself — "ai-message" strips to "message" as a fallback when the ai-*
// slug itself is absent.
export const SLUG_TO_REGISTRY: Record<string, string> = {
  // Foundations
  colors: "aurora-tokens",
  tokens: "aurora-tokens",
  type: "aurora-tokens",
  typography: "aurora-tokens",
  spacing: "aurora-tokens",
  brand: "aurora-tokens",
  direction: "aurora-direction",

  // Controls
  button: "aurora-button",
  buttons: "aurora-button",
  "button-group": "aurora-button-group",
  badge: "aurora-badge",
  badges: "aurora-badge",
  switch: "aurora-switch",
  toggle: "aurora-toggle",
  "toggle-group": "aurora-toggle-group",
  avatar: "aurora-avatar",
  progress: "aurora-progress",
  spinner: "aurora-spinner",
  separator: "aurora-separator",
  toolbar: "aurora-toolbar",
  kbd: "aurora-kbd",

  // Form elements
  input: "aurora-input",
  field: "aurora-field",
  label: "aurora-label",
  "input-group": "aurora-input-group",
  "input-otp": "aurora-input-otp",
  "native-select": "aurora-native-select",
  select: "aurora-select",
  combobox: "aurora-combobox",
  checkbox: "aurora-checkbox",
  checkboxes: "aurora-checkbox",
  "radio-group": "aurora-radio-group",
  slider: "aurora-slider",
  "number-input": "aurora-number-input",
  textarea: "aurora-textarea",
  calendar: "aurora-calendar",
  "date-picker": "aurora-date-picker",
  tabs: "aurora-tabs",
  forms: "aurora-input",

  // Feedback
  alert: "aurora-callout",
  banner: "aurora-banner",
  banners: "aurora-banner",
  callout: "aurora-callout",
  toast: "aurora-toast",
  toasts: "aurora-toast",
  sonner: "aurora-toast",
  tooltip: "aurora-tooltip",
  empty: "aurora-empty-state",
  "empty-state": "aurora-empty-state",
  skeleton: "aurora-skeleton",
  "status-indicator": "aurora-status-indicator",
  shimmer: "aurora-ai-shimmer",
  confirmation: "aurora-ai-confirmation",

  // Navigation
  breadcrumb: "aurora-breadcrumb",
  pagination: "aurora-pagination",
  command: "aurora-command-palette",
  "navigation-menu": "aurora-navigation-menu",
  menubar: "aurora-menubar",

  // Data
  "stat-card": "aurora-stat-card",
  stats: "aurora-stat-card",
  tables: "aurora-table",
  table: "aurora-table",
  "data-table": "aurora-data-table",
  "filter-bar": "aurora-filter-bar",
  filters: "aurora-filter-bar",
  timeline: "aurora-timeline",
  "description-list": "aurora-description-list",
  "search-results": "aurora-search-results",
  listbox: "aurora-listbox",
  marketplace: "aurora-marketplace",

  // Overlays
  dialog: "aurora-dialog",
  modals: "aurora-dialog",
  "alert-dialog": "aurora-alert-dialog",
  accordion: "aurora-accordion",
  collapsible: "aurora-collapsible",
  "dropdown-menu": "aurora-dropdown-menu",
  dropdowns: "aurora-dropdown-menu",
  "context-menu": "aurora-context-menu",
  popover: "aurora-popover",
  "hover-card": "aurora-hover-card",
  sheet: "aurora-sheet",
  drawer: "aurora-sheet",
  "share-dialog": "aurora-share-dialog",

  // Chat & AI
  bubble: "aurora-bubble",
  "chat-attachment": "aurora-chat-attachment",
  "chat-block": "aurora-chat-block",
  marker: "aurora-marker",
  "message-primitive": "aurora-message",
  "message-scroller": "aurora-message-scroller",
  "prompt-input": "aurora-prompt-input",
  "ai-elements": "aurora-ai-elements",
  message: "aurora-ai-message",
  conversation: "aurora-ai-conversation",
  "model-selector": "aurora-ai-model-selector",
  persona: "aurora-ai-persona",
  "open-in-chat": "aurora-ai-open-in-chat",
  reasoning: "aurora-ai-reasoning",
  "tool-calls": "aurora-tool-calls",
  tool: "aurora-ai-tool",
  thinking: "aurora-thinking",
  "chain-of-thought": "aurora-ai-chain-of-thought",
  plan: "aurora-ai-plan",
  queue: "aurora-ai-queue",
  task: "aurora-ai-task",
  suggestion: "aurora-ai-suggestion",
  "code-block": "aurora-code-block",
  artifact: "aurora-artifact",
  terminal: "aurora-terminal",
  "permission-prompt": "aurora-permission-prompt",
  "ask-user-question": "aurora-ask-user-question",
  "permissions-dropdown": "aurora-permissions-dropdown",
  "command-palette": "aurora-command-palette",
  sidebar: "aurora-sidebar",

  // Runtime & execution
  agent: "aurora-ai-agent",
  checkpoint: "aurora-ai-checkpoint",
  commit: "aurora-ai-commit",
  context: "aurora-ai-context",
  "environment-variables": "aurora-ai-environment-variables",
  "package-info": "aurora-ai-package-info",
  "schema-display": "aurora-ai-schema-display",
  sandbox: "aurora-ai-sandbox",
  snippet: "aurora-ai-snippet",
  "jsx-preview": "aurora-ai-jsx-preview",
  "stack-trace": "aurora-ai-stack-trace",
  "test-results": "aurora-ai-test-results",
  panel: "aurora-ai-panel",
  controls: "aurora-ai-controls",
  canvas: "aurora-ai-canvas",
  connection: "aurora-ai-connection",
  edge: "aurora-ai-edge",
  node: "aurora-ai-node",

  // Media & voice
  "audio-player": "aurora-ai-audio-player",
  "mic-selector": "aurora-ai-mic-selector",
  "speech-input": "aurora-ai-speech-input",
  transcription: "aurora-ai-transcription",
  "voice-selector": "aurora-ai-voice-selector",

  // Content
  attachment: "aurora-attachment",
  attachments: "aurora-ai-attachments",
  sources: "aurora-ai-sources",
  "inline-citation": "aurora-ai-inline-citation",
  "file-picker": "aurora-file-picker",
  "file-tree": "aurora-file-tree",
  "code-editor": "aurora-code-editor",
  "code-workspace": "aurora-code-workspace",
  "web-preview": "aurora-web-preview",
  "aspect-ratio": "aurora-aspect-ratio",
  card: "aurora-card",
  carousel: "aurora-carousel",
  chart: "aurora-chart",
  image: "aurora-ai-image",
  item: "aurora-item",
  "resizable-panels": "aurora-resizable-panels",
  // `resizable` redirects to `resizable-panels` via SECTION_REDIRECTS in
  // registry-meta.ts — no slug-map alias needed; the redirect fires first.
  "scroll-area": "aurora-scroll-area",

  // Auth & errors
  login: "aurora-login",
  oauth: "aurora-oauth",
  "error-page": "aurora-error-page",
  "error-pages": "aurora-error-page",

  // Themes
  lightmode: "aurora-tokens",
  // CD-parity net-new (24)
  "chat-message": "aurora-chat-message",
  "chat-sidebar": "aurora-chat-sidebar",
  "color-picker": "aurora-color-picker",
  "component-card": "aurora-component-card",
  "copy-button": "aurora-copy-button",
  "multi-select": "aurora-multi-select",
  "operation-icon": "aurora-operation-icon",
  "progress-ring": "aurora-progress-ring",
  "range-slider": "aurora-range-slider",
  "rating": "aurora-rating",
  "segmented": "aurora-segmented",
  "spotlight": "aurora-spotlight",
  "status-dot": "aurora-status-dot",
  "stepper": "aurora-stepper",
  "tag-input": "aurora-tag-input",
  "action": "aurora-ai-action",
  "actions": "aurora-ai-actions",
  "ai-image-grid": "aurora-ai-ai-image-grid",
  "branch": "aurora-ai-branch",
  "loader": "aurora-ai-loader",
  "message-avatar": "aurora-ai-message-avatar",
  "message-content": "aurora-ai-message-content",
  "response": "aurora-ai-response",
  "source": "aurora-ai-source",

}

// Resolve a gallery slug to a registry item *name* (no registry.json lookup).
// Direct lookup first; fall back for canonical ai-{slug} routes
// (e.g. "ai-agent" → "agent").
export function slugToRegistry(slug: string): string | null {
  return (
    SLUG_TO_REGISTRY[slug] ??
    (slug.startsWith("ai-") ? SLUG_TO_REGISTRY[slug.slice(3)] : undefined) ??
    null
  )
}
