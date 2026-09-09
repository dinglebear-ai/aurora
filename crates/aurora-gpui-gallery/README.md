# Aurora GPUI Gallery

The gallery is the native integration surface for the Aurora GPUI crates. The
default build provides the searchable catalog, mini-agent workflow reducer, and
portable render components. Every published surface is demonstrated by the
compile-checked examples in its owning crate and indexed by
`published_component_examples()`.

Run the native window on macOS with the full Xcode toolchain installed:

```bash
cargo run -p aurora-gpui-gallery --features native-app --example native_gallery
```

Zed's macOS renderer compiles Metal shaders during the build. Command Line
Tools alone are insufficient; `xcrun metal` must be available.

The mini-agent flow models stable file selection, editor content, proposed
diffs, accept/reject decisions, agent activity, and terminal commands. It is
designed so keyboard, pointer, and accessibility callbacks from the component
crates dispatch the same identity-bearing actions.
