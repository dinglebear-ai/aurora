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
  for (const interaction of ["setInterval", "navigator.clipboard", "retryMessage", "addMockAttachment", "toggleLike", "resetDemo"]) {
    assert.ok(source.includes(interaction), "chat block is missing " + interaction)
  }
  assert.equal(/\bfetch\s*\(/.test(source), false)
  assert.equal(/XMLHttpRequest/.test(source), false)
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
