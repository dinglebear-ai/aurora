export interface BrowserStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Read optional browser state without letting blocked storage break the UI. */
export function readBrowserStorage(
  getStorage: () => BrowserStorage,
  key: string
): string | null {
  try {
    return getStorage().getItem(key)
  } catch {
    return null
  }
}

/** Persist optional browser state. Returns false when storage is unavailable. */
export function writeBrowserStorage(
  getStorage: () => BrowserStorage,
  key: string,
  value: string
): boolean {
  try {
    getStorage().setItem(key, value)
    return true
  } catch {
    return false
  }
}
