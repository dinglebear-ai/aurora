/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite env variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  glob<E = string>(patterns: string[], options?: { eager?: boolean }): Record<string, () => Promise<E>>
}
