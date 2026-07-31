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
