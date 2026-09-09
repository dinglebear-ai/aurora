# Aurora GPUI Registry

This dependency-free crate models Aurora GPUI components, their source files,
versioned dependencies, and provenance. Its planner produces deterministic,
topologically ordered install plans and rejects cycles, incompatible versions,
duplicate destination paths, and unsafe paths before installation.

```sh
cargo run -p aurora-gpui-registry --bin aurora-gpui -- list
cargo run -p aurora-gpui-registry --bin aurora-gpui -- plan devtools
cargo run -p aurora-gpui-registry --bin aurora-gpui -- emit > registry.txt
cargo run -p aurora-gpui-registry --bin aurora-gpui -- --manifest registry.txt validate
cargo run -p aurora-gpui-registry --bin aurora-gpui -- materialize . /tmp/aurora editor
cargo run -p aurora-gpui-registry --bin aurora-gpui -- materialize . /tmp/aurora --write editor
```

## Manifest v1

The line-oriented format begins with `aurora-registry-v1`. Each `component`
record is followed by zero or more `dependency`, `file`, and `provenance`
records, then `end`. Fields are pipe-separated; `%`, `|`, and newlines use
percent escapes. Components and emitted plans are sorted deterministically.

`plan` prints both dependency order and every source-to-destination copy.
`materialize` uses that same complete plan. It is a non-mutating dry run unless
`--write` is present, requires all sources to resolve within the source root,
and requires the destination's direct parent to already exist. Writes build the
complete result in a private sibling directory and publish it with one atomic
rename. Existing or symlinked destinations are refused, and a failed install
cleans its private stage without exposing partial output. Built-in records
enumerate each package manifest, Rust module, and example rather than relying
on directory-wide copying.
