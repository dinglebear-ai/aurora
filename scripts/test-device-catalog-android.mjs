import { spawn, spawnSync } from "node:child_process"
import { createWriteStream, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import WebSocket from "ws"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const outputDirectory = resolve(root, "outputs/device-catalog/android")
const args = process.argv.slice(2)
const skipBuild = args.includes("--skip-build")
const keepEmulator = args.includes("--keep-emulator")
const requestedAvd = argumentValue("--avd") ?? process.env.AURORA_ANDROID_AVD
const requestedSerial = argumentValue("--serial") ?? process.env.AURORA_ANDROID_SERIAL
const androidHome = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT
const adb = androidHome ? resolve(androidHome, "platform-tools/adb") : "adb"
const emulator = androidHome ? resolve(androidHome, "emulator/emulator") : "emulator"
const packageName = "tv.tootie.aurora.catalog.debug"
const activityName = "tv.tootie.aurora.catalog.MainActivity"
const deviceTimeoutMs = positiveIntegerEnvironment("AURORA_ANDROID_DEVICE_TIMEOUT_MS", 240_000)
const bootTimeoutMs = positiveIntegerEnvironment("AURORA_ANDROID_BOOT_TIMEOUT_MS", 300_000)
let stage = "initialize"
let startedEmulator = false
let emulatorProcess
let emulatorExit
let emulatorLogStream
let serial
let cdp

mkdirSync(outputDirectory, { recursive: true })
for (const artifact of ["failure.json", "report.json", "emulator.log", "logcat.txt", "launch.png", "platform.png", "registry.png"]) {
  rmSync(resolve(outputDirectory, artifact), { force: true })
}

async function main() {
  try {
  if (!skipBuild) {
    stage = "build-apk"
    runInherited(process.execPath, [
      resolve(root, "scripts/run-device-catalog-android.mjs"),
      "build",
      "--debug",
      "--target",
      "x86_64",
      "--apk",
      "--ci",
    ])
  }

  stage = "resolve-device"
  serial = requestedSerial ?? connectedDevices()[0]
  if (!serial) {
    const available = run(emulator, ["-list-avds"]).split(/\r?\n/).filter(Boolean)
    const avd = requestedAvd ?? (available.includes("axon_test") ? "axon_test" : available[0])
    if (!avd) throw new Error("No Android device is connected and no AVD is available")
    stage = "start-emulator"
    emulatorLogStream = createWriteStream(resolve(outputDirectory, "emulator.log"), { flags: "w" })
    emulatorProcess = spawn(emulator, [
      "-avd", avd,
      "-no-window",
      "-no-audio",
      "-no-boot-anim",
      "-no-snapshot",
      "-no-metrics",
      "-gpu", process.env.AURORA_ANDROID_GPU ?? "swiftshader_indirect",
    ], { detached: false, stdio: ["ignore", "pipe", "pipe"] })
    emulatorProcess.stdout?.pipe(emulatorLogStream)
    emulatorProcess.stderr?.pipe(process.stderr)
    emulatorProcess.stderr?.pipe(emulatorLogStream)
    emulatorProcess.once("exit", (code, signal) => { emulatorExit = { code, signal } })
    startedEmulator = true
    stage = "wait-for-device"
    serial = await waitForAndroidDevice()
  }

  stage = "wait-for-boot"
  await waitForBoot(serial)
  const apk = resolve(root, "apps/device-catalog/src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk")
  if (!existsSync(apk)) throw new Error(`Android APK was not produced at ${apk}`)

  stage = "install-apk"
  runAdb(["install", "-r", apk])
  runAdb(["logcat", "-c"])
  runAdb(["shell", "am", "force-stop", packageName])
  stage = "launch-app"
  const launch = runAdb(["shell", "am", "start", "-W", "-n", `${packageName}/${activityName}`])
  const pid = await waitForValue(() => runAdb(["shell", "pidof", packageName], { allowFailure: true }).trim(), 30_000)
  await delay(1_500)
  captureScreenshot("launch.png")

  stage = "attach-webview"
  runAdb(["forward", "--remove", "tcp:9223"], { allowFailure: true })
  runAdb(["forward", "tcp:9223", `localabstract:webview_devtools_remote_${pid}`])
  const target = await waitForValue(async () => {
    try {
      const response = await fetch("http://127.0.0.1:9223/json/list", { signal: AbortSignal.timeout(1_000) })
      if (!response.ok) return null
      const targets = await response.json()
      return targets.find((candidate) => candidate.type === "page") ?? null
    } catch {
      return null
    }
  }, 20_000)

  cdp = await CdpClient.connect(target.webSocketDebuggerUrl)
  await cdp.call("Runtime.enable")
  await cdp.call("Log.enable")
  stage = "verify-initial-render"
  const initial = await waitForValue(async () => {
    const value = await cdp.evaluate(`(() => ({
      title: document.title,
      readyState: document.readyState,
      registryItems: document.querySelectorAll('[data-catalog-item-id]').length,
      selectedId: document.querySelector('[data-catalog-root]')?.getAttribute('data-catalog-selected-id'),
      tauriRuntime: Boolean(window.__TAURI_INTERNALS__),
      viewport: { width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio },
      safeAreaPadding: (() => {
        const theme = document.querySelector('.catalog-theme')
        return theme ? getComputedStyle(theme).padding : null
      })(),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pathname: location.pathname,
    }))()`)
    return value?.registryItems === 176 ? value : null
  }, 20_000)

  stage = "verify-android-back"
  const promptSelected = await cdp.evaluate(`(() => {
    const item = document.querySelector('[data-catalog-item-id="aurora-prompt-input"]')
    item?.click()
    return Boolean(item)
  })()`)
  await waitForValue(async () => {
    const selected = await cdp.evaluate("document.querySelector('[data-catalog-root]')?.getAttribute('data-catalog-selected-id')")
    return selected === "aurora-prompt-input" ? selected : null
  }, 10_000)
  runAdb(["shell", "input", "keyevent", "4"])
  const backSelectedId = await waitForValue(async () => {
    const selected = await cdp.evaluate("document.querySelector('[data-catalog-root]')?.getAttribute('data-catalog-selected-id')")
    return selected === "aurora-button" ? selected : null
  }, 10_000)

  stage = "verify-platform-mode"
  await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((element) => element.textContent?.trim() === 'Platform')
    button?.click()
    return Boolean(button)
  })()`)
  const platform = await waitForValue(async () => {
    const value = await cdp.evaluate(`(() => ({
      mode: document.querySelector('[data-catalog-root]')?.getAttribute('data-catalog-mode'),
      cards: document.querySelectorAll('.catalog-capability-grid > *').length,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pathname: location.pathname,
    }))()`)
    return value?.cards === 7 ? value : null
  }, 10_000)
  captureScreenshot("platform.png")

  stage = "restore-registry-mode"
  await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((element) => element.textContent?.trim() === 'Registry')
    button?.click()
    return Boolean(button)
  })()`)
  const restored = await waitForValue(async () => {
    const value = await cdp.evaluate(`(() => ({
      mode: document.querySelector('[data-catalog-root]')?.getAttribute('data-catalog-mode'),
      selectedId: document.querySelector('[data-catalog-root]')?.getAttribute('data-catalog-selected-id'),
      registryItems: document.querySelectorAll('[data-catalog-item-id]').length,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))()`)
    return value?.mode === "registry" ? value : null
  }, 10_000)
  captureScreenshot("registry.png")

  stage = "collect-logs"
  const logs = runAdb(["logcat", "-d", "-v", "threadtime"], { maxBuffer: 50 * 1024 * 1024 })
  writeFileSync(resolve(outputDirectory, "logcat.txt"), logs)
  const fatalLines = logs
    .split(/\r?\n/)
    .filter((line) => line.includes(packageName) && /AndroidRuntime|FATAL EXCEPTION|Fatal signal|Process .* has died/i.test(line))
  const chromiumWarnings = logs.split(/\r?\n/).filter((line) => /chromium:.*(?:WARNING|ERROR)/i.test(line)).slice(-100)
  const failures = []
  if (!initial.tauriRuntime) failures.push("Tauri runtime was not detected")
  if (initial.registryItems !== 176) failures.push(`Expected 176 registry items, found ${initial.registryItems}`)
  if (initial.overflowX > 1) failures.push(`Initial horizontal overflow: ${initial.overflowX}px`)
  if (!promptSelected || backSelectedId !== "aurora-button") failures.push("Android back navigation did not restore the previous catalog route")
  if (platform.cards !== 7 || platform.mode !== "capabilities") failures.push("Platform capability lab did not render seven checks")
  if (platform.overflowX > 1 || restored.overflowX > 1) failures.push("Android WebView has horizontal overflow")
  if (restored.registryItems !== 176) failures.push("Registry mode did not restore all catalog entries")
  if (fatalLines.length > 0) failures.push(`Android fatal logs: ${fatalLines.join(" | ")}`)
  if (cdp.runtimeErrors.length > 0) failures.push(`WebView runtime errors: ${cdp.runtimeErrors.join(" | ")}`)

  stage = "write-report"
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? "passed" : "failed",
    stage: "complete",
    device: { serial, model: runAdb(["shell", "getprop", "ro.product.model"]).trim() },
    apk: { path: apk, bytes: Number(run("stat", ["-c", "%s", apk]).trim()) },
    launch,
    target: { title: target.title, url: target.url },
    initial,
    backNavigation: { promptSelected, restoredId: backSelectedId },
    platform,
    restored,
    runtimeErrors: cdp.runtimeErrors,
    chromiumWarnings,
    fatalLines,
    failures,
  }
  writeFileSync(resolve(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
  if (failures.length > 0) throw new Error(failures.join("\n"))
} finally {
    try { cdp?.close() } catch {}
    try { runAdb(["forward", "--remove", "tcp:9223"], { allowFailure: true, timeout: 5_000 }) } catch {}
    await stopEmulator()
    emulatorLogStream?.end()
  }
}

function argumentValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function positiveIntegerEnvironment(name, fallback) {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`)
  return value
}

function connectedDevices() {
  return run(adb, ["devices"])
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts[0] && parts[1] === "device")
    .map((parts) => parts[0])
}

async function waitForAndroidDevice() {
  return waitForValue(() => {
    if (emulatorExit) {
      throw new Error(`Android emulator exited before ADB became ready (code=${emulatorExit.code}, signal=${emulatorExit.signal})`)
    }
    return connectedDevices()[0] ?? null
  }, deviceTimeoutMs)
}

async function waitForBoot(deviceSerial) {
  serial = deviceSerial
  await waitForValue(() => runAdb(["shell", "getprop", "sys.boot_completed"], { allowFailure: true }).trim() === "1" ? "1" : null, bootTimeoutMs)
}

function runAdb(commandArgs, options = {}) {
  if (!serial && !commandArgs.includes("devices")) throw new Error("Android serial is not resolved")
  return run(adb, serial ? ["-s", serial, ...commandArgs] : commandArgs, options)
}

async function stopEmulator() {
  if (!startedEmulator || keepEmulator || !emulatorProcess) return

  try { runAdb(["emu", "kill"], { allowFailure: true, timeout: 5_000 }) } catch {}
  if (emulatorExit) return

  emulatorProcess.kill("SIGTERM")
  if (await waitForEmulatorExit(5_000)) return

  emulatorProcess.kill("SIGKILL")
  await waitForEmulatorExit(5_000)
  emulatorProcess.stdout?.destroy()
  emulatorProcess.stderr?.destroy()
}

function waitForEmulatorExit(timeoutMs) {
  if (emulatorExit || !emulatorProcess) return Promise.resolve(true)
  return new Promise((resolvePromise) => {
    const onExit = () => {
      clearTimeout(timer)
      resolvePromise(true)
    }
    const timer = setTimeout(() => {
      emulatorProcess?.off("exit", onExit)
      resolvePromise(Boolean(emulatorExit))
    }, timeoutMs)
    emulatorProcess.once("exit", onExit)
  })
}

function captureScreenshot(filename) {
  const result = spawnSync(adb, ["-s", serial, "exec-out", "screencap", "-p"], { maxBuffer: 20 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(result.stderr?.toString() || `Failed to capture ${filename}`)
  writeFileSync(resolve(outputDirectory, filename), result.stdout)
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: options.maxBuffer ?? 20 * 1024 * 1024,
    timeout: options.timeout,
    env: process.env,
  })
  if (result.error) throw result.error
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n") || `${command} exited with ${result.status}`)
  }
  return result.stdout ?? ""
}

function runInherited(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { cwd: root, env: process.env, stdio: "inherit" })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`)
}

async function waitForValue(read, timeoutMs) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const value = await read()
    if (value) return value
    await delay(250)
  }
  throw new Error(`Condition did not become true within ${timeoutMs}ms`)
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

function diagnostic(command, commandArgs) {
  try {
    return run(command, commandArgs, { allowFailure: true }).trim()
  } catch (error) {
    return `unavailable: ${error instanceof Error ? error.message : String(error)}`
  }
}

function writeFailureReport(error) {
  const normalized = error instanceof Error ? error : new Error(String(error))
  const failure = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: "failed",
    stage,
    error: { name: normalized.name, message: normalized.message, stack: normalized.stack },
    environment: {
      androidHome: androidHome ?? null,
      adb,
      emulator,
      requestedAvd: requestedAvd ?? null,
      requestedSerial: requestedSerial ?? null,
      deviceTimeoutMs,
      bootTimeoutMs,
    },
    diagnostics: {
      devices: diagnostic(adb, ["devices", "-l"]),
      avds: diagnostic(emulator, ["-list-avds"]),
      disk: diagnostic("df", ["-h", root]),
    },
  }
  writeFileSync(resolve(outputDirectory, "failure.json"), `${JSON.stringify(failure, null, 2)}\n`)
  console.error(`[device-catalog/android] ${stage} failed: ${normalized.stack ?? normalized.message}`)
}

class CdpClient {
  constructor(socket) {
    this.socket = socket
    this.pending = new Map()
    this.nextId = 0
    this.runtimeErrors = []
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString())
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result ?? {})
        return
      }
      if (message.method === "Runtime.exceptionThrown") {
        this.runtimeErrors.push(message.params?.exceptionDetails?.text ?? "Runtime exception")
      }
      if (message.method === "Log.entryAdded" && message.params?.entry?.level === "error") {
        this.runtimeErrors.push(message.params.entry.text)
      }
    })
  }

  static async connect(url) {
    const socket = new WebSocket(url)
    await new Promise((resolvePromise, reject) => {
      socket.once("open", resolvePromise)
      socket.once("error", reject)
    })
    return new CdpClient(socket)
  }

  call(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const result = await this.call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description
        ?? result.exceptionDetails.exception?.value
        ?? result.exceptionDetails.text
        ?? "CDP evaluation failed"
      throw new Error(String(detail))
    }
    return result.result?.value
  }

  close() {
    this.socket.close()
  }
}

try {
  await main()
} catch (error) {
  writeFailureReport(error)
  process.exitCode = 1
}
