import assert from "node:assert/strict"
import test from "node:test"

import {
  readBrowserStorage,
  writeBrowserStorage,
  type BrowserStorage,
} from "../lib/browser-storage.ts"

function memoryStorage(): BrowserStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

test("browser storage helpers read and write optional preferences", () => {
  const storage = memoryStorage()
  assert.equal(readBrowserStorage(() => storage, "theme"), null)
  assert.equal(writeBrowserStorage(() => storage, "theme", "light"), true)
  assert.equal(readBrowserStorage(() => storage, "theme"), "light")
})

test("browser storage helpers tolerate blocked storage access", () => {
  const blocked = () => {
    throw new DOMException("Storage blocked", "SecurityError")
  }
  assert.equal(readBrowserStorage(blocked, "theme"), null)
  assert.equal(writeBrowserStorage(blocked, "theme", "dark"), false)
})

test("browser storage helpers tolerate method-level quota and security failures", () => {
  const storage: BrowserStorage = {
    getItem: () => { throw new DOMException("Blocked", "SecurityError") },
    setItem: () => { throw new DOMException("Full", "QuotaExceededError") },
  }
  assert.equal(readBrowserStorage(() => storage, "theme"), null)
  assert.equal(writeBrowserStorage(() => storage, "theme", "dark"), false)
})
