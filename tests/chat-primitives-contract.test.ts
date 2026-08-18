import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const read = (path: string) => readFileSync(path, "utf8")
const registry = JSON.parse(read("registry.json")) as { items: Array<{ name: string; type: string; files?: Array<{ path: string }> }> }

const primitives = [
  ["aurora-message-scroller", "registry/aurora/ui/message-scroller.tsx"],
  ["aurora-message", "registry/aurora/ui/message.tsx"],
  ["aurora-bubble", "registry/aurora/ui/bubble.tsx"],
  ["aurora-chat-attachment", "registry/aurora/ui/attachment.tsx"],
  ["aurora-marker", "registry/aurora/ui/marker.tsx"],
] as const

test("Aurora publishes every shadcn chat primitive plus the interactive block", () => {
  for (const [name, path] of primitives) {
    const item = registry.items.find((candidate) => candidate.name === name)
    assert.ok(item, "missing registry item " + name)
    assert.equal(item.type, "registry:ui")
    assert.ok(item.files?.some((file) => file.path === path), name + " does not publish " + path)
  }

  const block = registry.items.find((candidate) => candidate.name === "aurora-chat-block")
  assert.ok(block)
  assert.equal(block.type, "registry:block")
  assert.ok(block.files?.some((file) => file.path === "registry/aurora/blocks/ai/chat/chat.tsx"))
})

test("interactive chat block composes all five primitive families and stays local-only", () => {
  const source = read("registry/aurora/blocks/ai/chat/chat.tsx")
  for (const primitiveModule of ["message-scroller", "message", "bubble", "attachment", "marker"]) {
    assert.ok(source.includes("@/registry/aurora/ui/" + primitiveModule), "chat block does not import " + primitiveModule)
  }
  for (const interaction of ["setInterval", "navigator.clipboard", "retryMessage", "addMockAttachment", "toggleLike", "editMessage", "stopResponse", "insertSlashCommand", "insertMention", "resetDemo"]) {
    assert.ok(source.includes(interaction), "chat block is missing " + interaction)
  }
  assert.equal(/\bfetch\s*\(/.test(source), false)
  assert.equal(/XMLHttpRequest/.test(source), false)
  assert.equal(/Math\.random\s*\(/.test(source), false)
})

test("new chat surfaces preserve Aurora conversation ergonomics", () => {
  const block = read("registry/aurora/blocks/ai/chat/chat.tsx")
  const bubble = read("registry/aurora/ui/bubble.tsx")
  const message = read("registry/aurora/ui/message.tsx")

  assert.ok(bubble.includes("max-w-[36ch]"), "user bubbles should preserve compact Aurora prose width")
  assert.ok(bubble.includes("rounded-[16px_16px_6px_16px]"), "user bubbles should keep Aurora asymmetric corners")
  assert.ok(message.includes("self-start"), "message avatars should align with Aurora identity rows")
  assert.ok(block.includes('variant={item.role === "user" ? "default" : "ghost"}'), "assistant messages should render without bubbles")
  assert.ok(block.includes("group-hover/message:opacity-100"), "timestamps and actions should stay subordinate until hover or focus")
  assert.ok(block.includes("aurora-chat-action-rail pointer-events-none h-0"), "hidden action rails should not reserve vertical transcript space")
  assert.ok(block.includes("max-w-[86%] sm:max-w-[36ch]"), "user bubbles should preserve their silhouette on narrow viewports")
  assert.ok(block.includes("aurora-chat-composer"), "composer should retain the unified Aurora focus surface")
  assert.ok(block.includes('aria-label="Edit message"'), "user messages should expose edit actions")
  assert.ok(block.includes("<ThumbsUp"), "assistant actions should include thumbs up beside copy and retry")
  assert.equal(block.includes(">Retry</Button>"), false, "copy and retry controls should stay icon-only")
  assert.ok(block.includes("showStopButton"), "streaming composer should swap Send for Stop when empty")
  assert.ok(block.includes("Send steering message"), "composer should allow steering while the assistant is replying")
  assert.ok(block.includes("SLASH_COMMANDS"), "composer should expose slash-command skills")
  assert.ok(block.includes("FILE_MENTIONS"), "composer should expose file mentions")
  assert.ok(block.includes('CompactSelect label="Model"'), "composer should expose a model selector")
  assert.ok(block.includes('CompactSelect label="Reasoning"'), "composer should expose a reasoning selector")
  assert.ok(block.includes('Snippet density="compact"'), "assistant turns should demonstrate snippets")
  assert.ok(block.includes('CodeBlock density="compact"'), "assistant turns should demonstrate code blocks")
  assert.ok(block.includes('Sources density="compact"'), "assistant turns should demonstrate sources and references")
  assert.ok(block.includes("absolute bottom-1 left-1"), "attachment control should live inside the input field")
  assert.ok(block.includes("absolute bottom-1 right-1"), "send or stop control should live inside the input field")
  assert.equal(/<Textarea[^>]*disabled=/.test(block), false, "the composer should remain editable while the assistant is replying")
  assert.equal(block.includes("aria-label={item.role === \"user\" ? \"You\" : \"Aurora\"}"), false, "user turns should not regain redundant identity avatars")
})

test("chat developer surfaces keep scrollable code keyboard reachable", () => {
  const snippet = read("registry/aurora/blocks/ai/elements/snippet.tsx")
  const codeBlock = read("registry/aurora/blocks/workspace/code-block/code-block.tsx")
  assert.ok(snippet.includes("tabIndex={tabIndex ?? 0}"), "scrollable snippets should be keyboard focusable")
  assert.ok(codeBlock.includes("tabIndex={0}"), "scrollable code blocks should be keyboard focusable")
})

test("each new chat primitive has a gallery demo", () => {
  const manifest = JSON.parse(read("lib/gallery-manifest.json")) as Record<string, string>
  assert.equal(manifest["message-scroller"], "message-scroller-demo")
  assert.equal(manifest["message-primitive"], "message-primitive-demo")
  assert.equal(manifest.bubble, "bubble-demo")
  assert.equal(manifest["chat-attachment"], "chat-attachment-demo")
  assert.equal(manifest.marker, "marker-demo")
  assert.equal(manifest["chat-block"], "chat-block-demo")
})
