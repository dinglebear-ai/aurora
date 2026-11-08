import createMerge from "@fastify/deepmerge"
const supportedOptions = new Set(["arrayMerge", "isMergeableObject"])
const reactElements = new Set([Symbol.for("react.element"), Symbol.for("react.transitional.element")])

function isMergeableObject(value) {
  return createMerge.isMergeableObject(value) && !reactElements.has(value.$$typeof)
}

// Only the API exercised by shadcn and Style Dictionary is supported. An upstream
// consumer adding options must fail visibly and extend the compatibility tests.
function deepmerge(target, source, options = {}) {
  for (const key of Object.keys(options)) {
    if (!supportedOptions.has(key)) throw new TypeError(`Unsupported deepmerge option: ${key}`)
    if (typeof options[key] !== "function") throw new TypeError(`deepmerge ${key} must be a function`)
  }
  const merge = createMerge({
    symbols: true,
    isMergeableObject: options.isMergeableObject ?? isMergeableObject,
    ...(options.arrayMerge ? {
      mergeArray: ({ clone, isMergeableObject: mergeable }) => (left, right) => options.arrayMerge(left, right, {
        ...options,
        isMergeableObject: mergeable,
        cloneUnlessOtherwiseSpecified: (value) => clone(value),
      }),
    } : {}),
  })
  return merge(target, source)
}

deepmerge.all = (values, options) => {
  if (!Array.isArray(values)) throw new TypeError("first argument should be an array")
  return values.reduce((target, source) => deepmerge(target, source, options), {})
}

// Node 24 supports the module.exports interop export for synchronous require().
export { deepmerge as default, deepmerge as "module.exports" }
