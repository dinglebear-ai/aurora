# Safe merge adapter for Aurora tooling

This package replaces both `deepmerge` and its bundled ESM mirror in the pnpm
resolution graph. It is not a renamed copy of the vulnerable implementation.
The merge engine is the maintained, exact-pinned `@fastify/deepmerge` package:
https://github.com/fastify/deepmerge (MIT; its license remains in the dependency).
Aurora owns this small AGPL-3.0-only API adapter.

Why: `deepmerge` 4.3.1 is affected by GHSA-gcqx-w48m-w2h4 and has no released
fix. The bundled mirror also contains that implementation. Fastify filters
`__proto__`, `constructor`, and `prototype` keys when both cloning and merging.
No advisory is ignored and no vulnerable version is disguised as patched.

The inspected shadcn 4.22 and Style Dictionary 5.5 consumers use default merges,
`arrayMerge`, and `isMergeableObject`. These options, enumerable symbols,
nonmutation, special objects, and `.all` are tested. Unsupported options fail
explicitly instead of silently changing consumer behavior. When upgrading those
consumers, inspect their merge calls and run the registry installation and token
generation contracts as well as `tests/safe-deepmerge.test.ts`.


## Compatibility patch

`patches/@fastify__deepmerge@3.2.4.patch` fixes one semantic difference in the
maintained engine: an opaque source (Date, RegExp, React element, or a value
rejected by `isMergeableObject`) must replace an existing object-valued key.
Fastify otherwise tests target mergeability and merges that source as an object.
The patch returns that source unchanged before object merging. Top-level array
pairs still honor `arrayMerge` even when a custom predicate excludes arrays;
nested source arrays rejected by that predicate replace the old value.
Dangerous-key filtering remains untouched. pnpm records the patch hash in the lockfile and
applies it during frozen local and Docker installs. Tests cover colliding keys
and the actual shadcn/Style Dictionary import paths, not just this source file.
