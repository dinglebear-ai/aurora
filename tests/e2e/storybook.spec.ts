import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

type StoryContract = {
  id: string
  assert: (page: Page) => Promise<unknown>
}

const stories: StoryContract[] = [
  {
    id: "aurora-interaction-contracts--combobox-keyboard",
    assert: async (page) => expect(page.getByRole("button", { name: /Beta/i })).toBeFocused(),
  },
  {
    id: "aurora-interaction-contracts--radio-group-keyboard",
    assert: async (page) => expect(page.getByRole("radio", { name: "Beta" })).toBeChecked(),
  },
  {
    id: "aurora-interaction-contracts--multi-select-keyboard",
    assert: async (page) => expect(page.getByRole("option", { name: "Beta" })).toHaveAttribute("aria-selected", "true"),
  },
  {
    id: "aurora-interaction-contracts--popover-focus-and-escape",
    assert: async (page) => {
      const trigger = page.getByRole("button", { name: "Open" })
      // Storybook starts play functions after the iframe is ready. On a cold,
      // contended runner that can outlive Playwright's default assertion
      // timeout, so wait for a marker set only after every play assertion.
      await expect(trigger).toHaveAttribute("data-interaction-complete", "true", { timeout: 30_000 })
      await expect(trigger).toHaveAttribute("aria-expanded", "false")
      await expect(trigger).toBeFocused()
    },
  },
  {
    id: "aurora-ui-overlays--modal",
    assert: async (page) => expect(page.getByRole("dialog", { name: "Edit registry" })).toBeVisible(),
  },
  {
    id: "aurora-ui-overlays--destructive-confirmation",
    assert: async (page) => expect(page.getByRole("alertdialog", { name: "Delete token set?" })).toBeVisible(),
  },
  {
    id: "aurora-ui-overlays--side-sheet",
    assert: async (page) => expect(page.getByRole("dialog", { name: "Component inspector" })).toBeVisible(),
  },
  {
    id: "aurora-ui-disclosure-and-menus--accordion-states",
    assert: async (page) => expect(page.getByRole("button", { name: "Load design tokens" })).toHaveAttribute("aria-expanded", "true"),
  },
  {
    id: "aurora-ui-disclosure-and-menus--collapsible-details",
    assert: async (page) => expect(page.getByRole("button", { name: "Generated registry artifacts" })).toHaveAttribute("aria-expanded", "true"),
  },
  {
    id: "aurora-ui-disclosure-and-menus--action-menu",
    assert: async (page) => expect(page.getByRole("menuitem", { name: /Open preview/ })).toBeVisible(),
  },
  {
    id: "aurora-ui-disclosure-and-menus--accessible-tooltip",
    assert: async (page) => expect(page.getByRole("tooltip")).toBeVisible(),
  },
  {
    id: "aurora-ui-progress-and-metadata--registry-metadata",
    assert: async (page) => expect(page.getByText("aurora-prompt-input")).toBeVisible(),
  },
  {
    id: "aurora-ui-progress-and-metadata--release-timeline",
    assert: async (page) => expect(page.getByText("Visual checks running")).toBeVisible(),
  },
  {
    id: "aurora-ui-progress-and-metadata--publishing-stepper",
    assert: async (page) => expect(page.getByLabel("Preview: Current step")).toBeVisible(),
  },
]

for (const story of stories) {
  test(`${story.id} completes its interaction and strict axe contract`, async ({ page }) => {
    const runtimeErrors: string[] = []
    page.on("pageerror", (error) => runtimeErrors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text())
    })
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: "networkidle" })
    await expect(page.locator("#storybook-root")).toBeVisible()
    await story.assert(page)
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
    expect(results.violations).toEqual([])
    expect(runtimeErrors).toEqual([])
  })
}
