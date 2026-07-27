import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("Button Storybook controls expose every supported public option", () => {
  const story = read("stories/aurora/button.stories.tsx")
  assert.ok(story.includes('options: ["aurora", "neutral", "rose", "success", "warn", "ghost", "destructive", "plain"]'))
  assert.ok(story.includes('options: ["sm", "default", "lg", "icon", "unstyled"]'))
  assert.equal(story.includes('"violet"'), false)
})

test("Card Storybook metrics match the checked-in registry inventory", () => {
  const registry = JSON.parse(read("registry.json")) as {
    items: Array<{ type: string }>
  }
  const story = read("stories/aurora/card.stories.tsx")
  const ui = registry.items.filter((item) => item.type === "registry:ui").length
  const blocks = registry.items.filter((item) => item.type === "registry:block").length

  assert.ok(story.includes('label="Items" value="' + registry.items.length + '"'))
  assert.ok(story.includes('label="UI" value="' + ui + '"'))
  assert.ok(story.includes('label="Blocks" value="' + blocks + '"'))
})
