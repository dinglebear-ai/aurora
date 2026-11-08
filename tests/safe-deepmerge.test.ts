import assert from "node:assert/strict"
import { createRequire } from "node:module"
import test from "node:test"
import { pathToFileURL } from "node:url"

const require = createRequire(import.meta.url)
const merge = require("../packages/safe-deepmerge/index.mjs")

test("safe merge clones nested values, concatenates arrays and preserves enumerable symbols", () => {
  const symbol = Symbol("token")
  const left = { nested: { one: 1 }, values: [{ a: 1 }], [symbol]: { old: true } }
  const right = { nested: { two: 2 }, values: [{ b: 2 }], [symbol]: { next: true } }
  const result = merge(left, right)
  assert.deepEqual(result, { nested: { one: 1, two: 2 }, values: [{ a: 1 }, { b: 2 }], [symbol]: { old: true, next: true } })
  assert.notEqual(result.nested, left.nested)
  assert.notEqual(result.values[0], left.values[0])
  assert.deepEqual(left.nested, { one: 1 })
  assert.deepEqual(right.nested, { two: 2 })
})

test("safe merge preserves dates, regular expressions and React elements", () => {
  const date = new Date(0)
  const regex = /token/
  const element = { $$typeof: Symbol.for("react.transitional.element"), props: {} }
  const result = merge({}, { date, regex, element })
  assert.equal(result.date, date)
  assert.equal(result.regex, regex)
  assert.equal(result.element, element)
})

test("safe merge supports shadcn array replacement and clone callback", () => {
  const source = { plugins: [{ name: "new" }] }
  const result = merge({ plugins: ["old"] }, source, {
    arrayMerge: (_target: unknown[], values: unknown[], options: { cloneUnlessOtherwiseSpecified: (value: unknown) => unknown }) =>
      values.map((value) => options.cloneUnlessOtherwiseSpecified(value)),
  })
  assert.deepEqual(result, source)
  assert.notEqual(result.plugins[0], source.plugins[0])
})

test("safe merge supports Style Dictionary plain-object selection and array deduplication", () => {
  class Token { value: string; constructor(value: string) { this.value = value } }
  const token = new Token("cyan")
  const result = merge({ transforms: ["name"], token: new Token("old") }, { transforms: ["name", "color"], token }, {
    isMergeableObject: (value: unknown) => Array.isArray(value) || (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype),
    arrayMerge: (target: unknown[], source: unknown[]) => Array.from(new Set([...target, ...source])),
  })
  assert.deepEqual(result.transforms, ["name", "color"])
  assert.equal(result.token, token)
})

test("safe merge blocks prototype poisoning from source, target and nested arrays", () => {
  const attack = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"prototype":{"polluted":true},"safe":1}')
  for (const result of [merge({}, attack), merge(attack, {}), merge({}, { nested: attack }).nested, merge([], [attack])[0]]) {
    assert.equal(Object.getPrototypeOf(result), Object.prototype)
    assert.equal(result.polluted, undefined)
    for (const key of ["__proto__", "constructor", "prototype"]) assert.equal(Object.hasOwn(result, key), false)
    assert.equal(result.safe, 1)
  }
  assert.equal(Object.hasOwn(Object.prototype, "polluted"), false)
})

test("safe merge supports null-prototype inputs without inheriting malicious keys", () => {
  const source = Object.assign(Object.create(null), JSON.parse('{"__proto__":{"polluted":true},"safe":{"value":1}}'))
  const result = merge(Object.create(null), source)
  assert.deepEqual(result, { safe: { value: 1 } })
  assert.equal(Object.getPrototypeOf(result), Object.prototype)
})

test("safe merge all retains options and rejects unsupported API extensions", () => {
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 })
  assert.deepEqual(merge.all([{ values: [1] }, { values: [2] }], { arrayMerge: (_target: unknown[], source: unknown[]) => source }), { values: [2] })
  assert.throws(() => merge.all({}), /first argument/)
  assert.throws(() => merge({}, {}, { customMerge: () => undefined }), /Unsupported deepmerge option/)
  assert.throws(() => merge({}, {}, { arrayMerge: false }), /must be a function/)
})


test("safe merge replaces colliding object values with opaque source values", () => {
  const date = new Date(0)
  const regex = /token/
  const element = { $$typeof: Symbol.for("react.transitional.element"), props: { value: "new" } }
  for (const value of [date, regex, element]) {
    assert.equal(merge({ nested: { old: true } }, { nested: value }).nested, value)
  }
  class Token { value = "new" }
  const token = new Token()
  assert.equal(merge({ nested: { old: true } }, { nested: token }, {
    isMergeableObject: (value: unknown) => Array.isArray(value) || (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype),
  }).nested, token)
})

test("actual shadcn and Style Dictionary ESM imports resolve the secure adapter", async () => {
  const consumers = [
    ["shadcn", "deepmerge"],
    ["style-dictionary", "@bundled-es-modules/deepmerge"],
  ]
  for (const [consumer, dependency] of consumers) {
    const consumerRequire = createRequire(require.resolve(consumer))
    const resolved = consumerRequire.resolve(dependency)
    const { default: actualMerge } = await import(pathToFileURL(resolved).href)
    const date = new Date(0)
    assert.equal(actualMerge({ value: { old: true } }, { value: date }).value, date)
    const result = actualMerge({}, JSON.parse('{"__proto__":{"polluted":true},"safe":1}'))
    assert.deepEqual(result, { safe: 1 })
    assert.equal(Object.getPrototypeOf(result), Object.prototype)
  }
})


test("custom plain-object predicate preserves top-level and nested array contracts", () => {
  const options = {
    isMergeableObject: (value: unknown) => value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype,
    arrayMerge: (target: unknown[], source: unknown[]) => Array.from(new Set([...target, ...source])),
  }
  assert.deepEqual(merge([1], [1, 2], options), [1, 2])
  const source = [2]
  const result = merge({ values: [1] }, { values: source }, options)
  assert.equal(result.values, source)
  assert.deepEqual(result.values, [2])
})
