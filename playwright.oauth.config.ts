import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /oauth-document\.spec\.ts/,
  use: { ...devices["Desktop Chrome"], javaScriptEnabled: false },
  reporter: "line",
})
