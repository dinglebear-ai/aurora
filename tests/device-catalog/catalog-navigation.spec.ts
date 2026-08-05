import { expect, test } from "@playwright/test"

test("deep links restore item, viewport, theme, and filters", async ({ page }) => {
  await page.goto("/aurora-prompt-input?device=phone&theme=light&readiness=adaptive&q=prompt", { waitUntil: "domcontentloaded" })
  const root = page.locator("[data-catalog-root]")
  await expect(root).toHaveAttribute("data-catalog-selected-id", "aurora-prompt-input")
  await expect(root).toHaveAttribute("data-catalog-device", "phone")
  await expect(root).toHaveClass(/light/)
  await expect(page.getByRole("textbox", { name: "Search catalog" })).toHaveValue("prompt")
  await expect(page.getByRole("combobox", { name: "Filter by mobile readiness" })).toHaveValue("adaptive")
  await page.locator("[data-catalog-preview-ready='true']").first().waitFor()
})

test("browser history restores previous catalog selections and platform mode", async ({ page }) => {
  await page.goto("/aurora-button", { waitUntil: "domcontentloaded" })
  const root = page.locator("[data-catalog-root]")
  await expect(root).toHaveAttribute("data-catalog-selected-id", "aurora-button")

  await page.locator("[data-catalog-item-id='aurora-prompt-input']").click()
  await expect(root).toHaveAttribute("data-catalog-selected-id", "aurora-prompt-input")
  await expect(page).toHaveURL(/\/aurora-prompt-input$/)

  await page.goBack()
  await expect(root).toHaveAttribute("data-catalog-selected-id", "aurora-button")
  await expect(page).toHaveURL(/\/aurora-button$/)

  await page.getByRole("radio", { name: "Platform" }).click()
  await expect(root).toHaveAttribute("data-catalog-mode", "capabilities")
  await expect(page).toHaveURL(/\/platform$/)
  await expect(page.locator(".catalog-capability-grid > *")).toHaveCount(7)

  await page.goBack()
  await expect(root).toHaveAttribute("data-catalog-mode", "registry")
  await expect(root).toHaveAttribute("data-catalog-selected-id", "aurora-button")
})

test("desktop catalog exposes the shared Gallery navigation and content scroll panes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto("/aurora-marketplace-block", { waitUntil: "domcontentloaded" })
  await page.locator("[data-catalog-preview-ready='true']").first().waitFor()

  const sidebar = page.locator(".aurora-gallery-nav-body")
  const main = page.locator(".aurora-gallery-main")
  await expect(sidebar).toBeVisible()
  await expect(main).toBeVisible()

  const before = await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    shellHeight: document.querySelector<HTMLElement>(".aurora-gallery-shell")?.clientHeight ?? 0,
    viewportHeight: window.innerHeight,
    sidebar: {
      clientHeight: document.querySelector<HTMLElement>(".aurora-gallery-nav-body")?.clientHeight ?? 0,
      scrollHeight: document.querySelector<HTMLElement>(".aurora-gallery-nav-body")?.scrollHeight ?? 0,
    },
    main: {
      clientHeight: document.querySelector<HTMLElement>(".aurora-gallery-main")?.clientHeight ?? 0,
      scrollHeight: document.querySelector<HTMLElement>(".aurora-gallery-main")?.scrollHeight ?? 0,
    },
  }))

  expect(before.bodyOverflow).toBe("hidden")
  expect(before.shellHeight).toBe(before.viewportHeight)
  expect(before.sidebar.scrollHeight).toBeGreaterThan(before.sidebar.clientHeight)
  expect(before.main.scrollHeight).toBeGreaterThan(before.main.clientHeight)

  await sidebar.evaluate((element) => { element.scrollTop = 400 })
  await main.evaluate((element) => { element.scrollTop = 300 })
  await expect.poll(() => sidebar.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
})

test("mobile catalog uses document scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 })
  await page.goto("/aurora-marketplace-block?device=phone", { waitUntil: "domcontentloaded" })
  await page.locator("[data-catalog-preview-ready='true']").first().waitFor()

  const metrics = await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflowY,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }))
  expect(metrics.bodyOverflow).not.toBe("hidden")
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)

  await page.evaluate(() => window.scrollTo(0, 500))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})
