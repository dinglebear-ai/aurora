import { spawnSync } from "node:child_process"
import { delimiter, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const appDirectory = resolve(root, "apps/device-catalog")
const tauriArgs = process.argv.slice(2)

if (tauriArgs.length === 0) {
  console.error("Usage: node scripts/run-device-catalog-android.mjs <init|dev|build> [...args]")
  process.exit(2)
}

function rustupBinary(command) {
  const result = spawnSync("rustup", ["which", "--toolchain", "stable", command], {
    encoding: "utf8",
    shell: false,
  })
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || `rustup could not resolve ${command}`
    throw new Error(detail)
  }
  return result.stdout.trim()
}

const cargo = rustupBinary("cargo")
const rustc = rustupBinary("rustc")
const rustdoc = rustupBinary("rustdoc")
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
const environment = {
  ...process.env,
  CARGO: cargo,
  RUSTC: rustc,
  RUSTDOC: rustdoc,
  RUSTUP_TOOLCHAIN: "stable",
  PATH: [dirname(cargo), dirname(rustc), process.env.PATH ?? ""].filter(Boolean).join(delimiter),
}

delete environment.RUSTC_WRAPPER
delete environment.RUSTC_WORKSPACE_WRAPPER

console.log(`Using native Rust toolchain: ${cargo}`)
const result = spawnSync(pnpm, ["exec", "tauri", "android", ...tauriArgs], {
  cwd: appDirectory,
  env: environment,
  shell: false,
  stdio: "inherit",
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
