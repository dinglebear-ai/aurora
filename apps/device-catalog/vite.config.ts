import path from "node:path"
import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const appDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(appDirectory, "../..")
const mobileHost = process.env.TAURI_DEV_HOST

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": repositoryRoot,
    },
  },
  publicDir: path.resolve(repositoryRoot, "public"),
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  clearScreen: false,
  server: {
    port: 5174,
    strictPort: true,
    host: mobileHost ?? "0.0.0.0",
    hmr: mobileHost
      ? {
          protocol: "ws",
          host: mobileHost,
          port: 1421,
        }
      : undefined,
    fs: {
      allow: [repositoryRoot],
    },
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}))
