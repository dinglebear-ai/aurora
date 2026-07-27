import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "storybook-chromium",
      testMatch: /storybook\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:6006" },
    },
  ],
  webServer: {
    command: "pnpm exec storybook dev -p 6006 --host 127.0.0.1 --ci --no-open",
    url: "http://localhost:6006",
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    timeout: 120_000,
  },
})
