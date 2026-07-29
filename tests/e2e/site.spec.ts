import { expect, test, type Page } from "@playwright/test"

function captureRuntimeFailures(page: Page) {
  const failures: string[] = []
  page.on("pageerror", (error) => {
    // Chromium can report this when Next closes an obsolete RSC connection
    // during client navigation; it has no page/runtime impact.
    if (error.message === "Connection closed.") return
    failures.push(`pageerror: ${error.message}`)
  })
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText === "net::ERR_ABORTED" && request.url().includes("_rsc=")) return
    failures.push(`network: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "failed"}`)
  })
  return failures
}

for (const route of ["/", "/components", "/plugins", "/themes", "/gallery/buttons"]) {
  test(`${route} renders meaningful hydrated content without runtime failures`, async ({ page }) => {
    const failures = captureRuntimeFailures(page)
    const response = await page.goto(route, { waitUntil: "networkidle" })
    expect(response?.ok()).toBe(true)
    await expect(page.locator("body")).not.toBeEmpty()
    const primaryMain = page.locator("main").first()
    await expect(primaryMain).toBeVisible()
    await expect.poll(() => primaryMain.innerText(), { timeout: 30_000 }).toMatch(/\S[\s\S]{8,}/)
    await expect(page.locator("nextjs-portal, [data-nextjs-dialog-overlay]")).toHaveCount(0)
    expect(failures.filter((failure) => /hydration|uncaught|failed|error/i.test(failure))).toEqual([])
  })
}

test("root content negotiation serves HTML to browsers and registry JSON to shadcn", async ({ page, request }) => {
  const html = await page.goto("/")
  expect(html?.headers()["content-type"]).toContain("text/html")
  await expect(page.getByRole("heading", { name: /One palette/i })).toBeVisible()

  const registry = await request.get("/", {
    headers: {
      accept: "application/vnd.shadcn.v1+json",
      "user-agent": "shadcn/4 playwright-contract",
    },
  })
  expect(registry.ok()).toBe(true)
  expect(registry.headers()["content-type"]).toContain("application/json")
  const body = await registry.json()
  expect(body).toMatchObject({ name: "aurora", homepage: "https://aurora.dinglebear.ai" })
  expect(Array.isArray(body.items)).toBe(true)
})

test("primary navigation hydrates and changes routes client-side", async ({ page }) => {
  const failures = captureRuntimeFailures(page)
  await page.goto("/", { waitUntil: "networkidle" })
  await page.getByRole("link", { name: "Explore Themes" }).click()
  await expect(page).toHaveURL(/\/themes$/)
  await expect(page.getByRole("heading", { name: "Aurora Everywhere You Work" })).toBeVisible()
  expect(failures).toEqual([])
})

test("component catalog supports search, pagination, and a live drawer", async ({ page }) => {
  await page.goto("/components")
  const search = page.getByPlaceholder("Fuzzy-search components…")
  await search.fill("button")
  await expect(page.getByText("Buttons", { exact: true }).first()).toBeVisible()
  await page.getByRole("button", { name: "Open Buttons" }).click()
  await expect(page).toHaveURL(/c=buttons/)
})

test("tenant host routing and CSP contracts are enforced", async ({ request }) => {
  const tenant = await request.get("/", { headers: { host: "dinglebear.ai", accept: "text/html" } })
  expect(tenant.ok()).toBe(true)
  expect(await tenant.text()).toContain("dinglebear")
  const csp = tenant.headers()["content-security-policy"]
  expect(csp).toContain("script-src 'self'")
  expect(csp).toContain("form-action 'self'")
  // Loopback verification remains HTTP; WebKit otherwise upgrades every local
  // Next asset to HTTPS. The production-policy unit contract covers the public
  // host requirement for upgrade-insecure-requests.
  expect(csp).not.toContain("upgrade-insecure-requests")
})

test("missing gallery routes fail without a runtime crash", async ({ page }) => {
  const response = await page.goto("/gallery/not-a-real-component")
  expect(response?.status()).toBe(404)
  await expect(page.locator("body")).toContainText(/not found|404/i)
})

test("components initial load stays within transfer and responsiveness budgets", async ({ page }) => {
  await page.goto("/components", { waitUntil: "networkidle" })
  const resources = await page.evaluate(() => performance.getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/_next/static/"))
    .map((entry) => ({ name: entry.name, transferSize: (entry as PerformanceResourceTiming).transferSize })))
  const staticRequests = resources.length
  const transferred = resources.reduce((sum, resource) => sum + resource.transferSize, 0)
  expect(transferred).toBeGreaterThan(0)
  expect(staticRequests).toBeLessThanOrEqual(80)
  expect(transferred).toBeLessThanOrEqual(2_500_000)
  const responseMs = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const count = document.querySelector("[data-catalog-result-count]")
    const button = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent?.includes("Navigation"))
    if (!count || !button) return reject(new Error("Catalog response controls are missing"))
    const initial = count.textContent
    const started = performance.now()
    const observer = new MutationObserver(() => {
      if (count.textContent === initial) return
      observer.disconnect()
      resolve(performance.now() - started)
    })
    observer.observe(count, { childList: true, subtree: true, characterData: true })
    button.click()
    window.setTimeout(() => {
      observer.disconnect()
      reject(new Error("Catalog did not commit its filtered result state"))
    }, 1_000)
  }))
  expect(responseMs).toBeLessThan(1_000)
})
