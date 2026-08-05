import { defineConfig } from "@playwright/test"

const baseURL = "http://127.0.0.1:4176"

export default defineConfig({
  testDir: "./tests/device-catalog",
  fullyParallel: true,
  workers: 4,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  outputDir: "outputs/device-catalog/test-results",
  reporter: [
    ["list"],
    ["./tests/device-catalog/reporter.ts"],
  ],
  use: {
    baseURL,
    headless: true,
    colorScheme: "dark",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --dir apps/device-catalog preview --host 127.0.0.1 --port 4176",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
