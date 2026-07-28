/// <reference types="vite/client" />

// `vite/client` supplies ImportMetaEnv and import.meta.env. Only the glob
// signature is restated here, because the app calls it with an array of
// include/exclude patterns and a generic module type.
interface ImportMeta {
  glob<E = string>(patterns: string[], options?: { eager?: boolean }): Record<string, () => Promise<E>>
}
