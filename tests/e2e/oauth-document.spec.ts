import { test, expect } from "@playwright/test"
import { readFile } from "node:fs/promises"

for (const theme of ["dark", "light"] as const) {
  for (const state of ["consent", "success", "expired", "error"]) {
    test(`${state} renders without JavaScript in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      const css = await readFile("public/oauth-document/oauth.css", "utf8")
      const html = (await readFile(`public/oauth-document/${state}.html`, "utf8"))
        .replaceAll("{{TITLE}}", "Labby Authorization")
        .replaceAll("{{MESSAGE}}", "Return to the app to continue.")
        .replaceAll("{{ACTION}}", "https://provider.example/authorize")
        .replace("{{STYLE}}", css)
      await page.setContent(html)
      await expect(page.getByRole("heading", { name: "Labby Authorization" })).toBeVisible()
      await expect(page.locator("main")).toHaveCSS("color", theme === "dark" ? "rgb(230, 244, 251)" : "rgb(7, 19, 28)")
      if (state === "consent") {
        await page.keyboard.press("Tab")
        await expect(page.getByRole("link", { name: "Continue" })).toBeFocused()
        await expect(page.getByRole("link")).toHaveAttribute("href", "https://provider.example/authorize")
      } else {
        await expect(page.getByRole("link")).toHaveCount(0)
      }
      await page.setViewportSize({ width: 320, height: 640 })
      await expect(page.locator("section")).toBeInViewport()
      await page.screenshot({ path: `test-results/oauth-${state}-${theme}.png` })
    })
  }
}
