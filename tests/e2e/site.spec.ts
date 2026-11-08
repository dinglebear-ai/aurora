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

for (const route of ["/", "/gallery", "/plugins", "/themes", "/gallery/buttons"]) {
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

test("site shell exposes skip navigation and the active route", async ({ page }) => {
  await page.goto("/gallery", { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { level: 1, name: /Components/ })).toHaveCount(1)
  await expect(page.locator('a[href="/gallery"][aria-current="page"]')).toHaveCount(1)

  await page.keyboard.press("Tab")
  const skipLink = page.getByRole("link", { name: "Skip to Content" })
  await expect(skipLink).toBeFocused()
  await skipLink.press("Enter")
  await expect(page.locator("#main-content")).toBeFocused()
})

test("gallery catalog supports search, pagination, and a live drawer", async ({ page }) => {
  await page.goto("/gallery")
  const search = page.getByRole("textbox", { name: "Search Components" })
  await expect(page.getByRole("group", { name: "Component Categories" })).toBeVisible()
  await search.fill("button")
  await expect(page.getByText("Buttons", { exact: true }).first()).toBeVisible()
  await page.getByRole("button", { name: "Open Buttons" }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("button")
  await expect.poll(() => new URL(page.url()).searchParams.get("c")).toBe("buttons")
})

test("legacy components route preserves catalog state when redirecting to gallery", async ({ page }) => {
  await page.goto("/components?q=button&c=buttons&flavor=android")
  const url = new URL(page.url())
  expect(url.pathname).toBe("/gallery")
  expect(url.searchParams.get("q")).toBe("button")
  expect(url.searchParams.get("c")).toBe("buttons")
  expect(url.searchParams.get("flavor")).toBe("android")
})

test("gallery loads bounded batches explicitly and preserves keyboard focus", async ({ page }) => {
  await page.goto("/gallery", { waitUntil: "networkidle" })
  await expect(page.locator(".aurora-gallery-nav")).toHaveCount(0)
  await expect(page.getByRole("textbox", { name: "Search Components" })).toBeVisible()

  const geometry = await page.evaluate(() => ({
    viewport: window.innerHeight,
    document: document.documentElement.scrollHeight,
  }))
  expect(geometry.document).toBeGreaterThan(geometry.viewport)

  const initialTiles = await page.locator(".aurora-catalog-tile").count()
  expect(initialTiles).toBe(48)

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await expect(page.locator(".aurora-catalog-tile")).toHaveCount(initialTiles)

  await page.getByRole("button", { name: /Show 48 More/ }).click()
  await expect(page.locator(".aurora-catalog-tile")).toHaveCount(initialTiles + 48)
  await expect(page.locator(".aurora-catalog-tile").nth(initialTiles).getByRole("button")).toBeFocused()
  await expect(page.getByRole("status").filter({ hasText: /48 components added/ })).toBeAttached()
})

test("gallery drawer traps focus, announces navigation, and restores focus", async ({ page }) => {
  await page.goto("/gallery", { waitUntil: "networkidle" })
  const firstTile = page.locator(".aurora-catalog-tile").first().getByRole("button")
  await firstTile.focus()
  await firstTile.press("Enter")

  const drawer = page.getByRole("dialog")
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole("heading")).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect.poll(() => drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  const lastVisibleButton = drawer.getByRole("button").last()
  await lastVisibleButton.focus()
  await page.keyboard.press("Tab")
  await expect.poll(() => drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await drawer.getByRole("heading").focus()
  const originalTitle = await drawer.getByRole("heading").textContent()
  await drawer.getByRole("button", { name: /^Next:/ }).first().click()
  await expect(drawer.getByRole("heading")).not.toHaveText(originalTitle ?? "")
  await expect(drawer.getByRole("status")).toContainText(/item \d+ of \d+/)

  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
  await expect(firstTile).toBeFocused()
})

test("gallery viewer uses full-width internal navigation on mobile", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"))
  await page.goto("/gallery", { waitUntil: "networkidle" })
  await page.locator(".aurora-catalog-tile").first().getByRole("button").click()

  const drawer = page.getByRole("dialog")
  await expect(drawer).toBeVisible()
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  const drawerBox = await drawer.boundingBox()
  expect(drawerBox).not.toBeNull()
  expect((drawerBox?.width ?? 0) / viewportWidth).toBeGreaterThan(0.9)
  await expect(page.locator(".aurora-catalog-drawer-arrow").first()).toBeHidden()

  const mobileNav = page.locator(".aurora-catalog-drawer-mobile-nav")
  await expect(mobileNav).toBeVisible()
  const before = await drawer.getByRole("heading").textContent()
  await mobileNav.getByRole("button", { name: /^Next:/ }).click()
  await expect(drawer.getByRole("heading")).not.toHaveText(before ?? "")
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test("chat autocomplete popovers accept real pointer clicks above the transcript", async ({ page }) => {
  await page.goto("/gallery/chat-block")
  const input = page.getByRole("textbox", { name: "Message" })

  await input.click()
  await input.pressSequentially("/rev", { delay: 20 })
  const skills = page.getByRole("listbox", { name: "Skills and slash commands" })
  await expect(skills).toBeVisible()
  await skills.getByRole("option").filter({ hasText: "/review" }).click()
  await expect(input).toHaveValue("/review ")

  await input.press("ControlOrMeta+A")
  await input.press("Backspace")
  await input.pressSequentially("@chat", { delay: 20 })
  const files = page.getByRole("listbox", { name: "File mentions" })
  await expect(files).toBeVisible()
  await files.getByRole("option").filter({ hasText: "chat.tsx" }).click()
  await expect(input).toHaveValue("@chat.tsx ")
})

test("chat has a dedicated unclipped mobile layout on touch viewports", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"))
  await page.goto("/gallery/chat-block")

  const actionRail = page.locator(".aurora-chat-action-rail").first()
  await expect(actionRail).toHaveCSS("pointer-events", "auto")
  const opacity = Number(await actionRail.evaluate((element) => getComputedStyle(element).opacity))
  expect(opacity).toBeGreaterThan(0.5)
  const railBox = await actionRail.boundingBox()
  expect(railBox?.height ?? 0).toBeGreaterThanOrEqual(17)

  const timestamp = actionRail.locator("span").first()
  const timestampBox = await timestamp.boundingBox()
  expect(timestampBox).not.toBeNull()
  if (railBox && timestampBox) {
    expect(timestampBox.y).toBeGreaterThanOrEqual(railBox.y - 0.5)
    expect(timestampBox.y + timestampBox.height).toBeLessThanOrEqual(railBox.y + railBox.height + 0.5)
  }

  const bubble = page.locator('[data-slot="bubble"][data-align="end"]').first()
  const message = bubble.locator('xpath=ancestor::*[@data-slot="message"][1]')
  const bubbleWidth = (await bubble.boundingBox())?.width ?? 0
  const messageWidth = (await message.boundingBox())?.width ?? 1
  expect(bubbleWidth / messageWidth).toBeLessThan(0.9)

  const viewport = page.locator('[data-slot="message-scroller-viewport"]')
  const horizontalOverflow = await viewport.evaluate((element) => element.scrollWidth - element.clientWidth)
  expect(horizontalOverflow).toBeLessThanOrEqual(1)
  await viewport.evaluate((element) => {
    element.scrollTop = Math.max(1, (element.scrollHeight - element.clientHeight) / 2)
    element.dispatchEvent(new Event("scroll"))
  })
  const activeScrollButton = page.locator('[data-slot="message-scroller-button"][data-active="true"]').first()
  await expect(activeScrollButton).toBeVisible()
  const scrollButtonBox = await activeScrollButton.boundingBox()
  const viewportBox = await viewport.boundingBox()
  if (scrollButtonBox && viewportBox) expect(scrollButtonBox.x).toBeGreaterThan(viewportBox.x + viewportBox.width / 2)

  const composer = page.locator(".aurora-chat-composer")
  const composerBox = await composer.boundingBox()
  const modelBox = await page.getByRole("combobox", { name: "Model" }).boundingBox()
  const reasoningBox = await page.getByRole("combobox", { name: "Reasoning" }).boundingBox()
  expect(composerBox).not.toBeNull()
  expect(modelBox).not.toBeNull()
  expect(reasoningBox).not.toBeNull()
  if (composerBox && modelBox && reasoningBox) {
    expect(modelBox.x).toBeGreaterThanOrEqual(composerBox.x)
    expect(reasoningBox.x + reasoningBox.width).toBeLessThanOrEqual(composerBox.x + composerBox.width + 0.5)
  }
})

test("chat composer presents one progressive responsive control surface", async ({ page }, testInfo) => {
  await page.goto("/gallery/chat-block")
  const composer = page.locator(".aurora-chat-composer")
  const input = page.getByRole("textbox", { name: "Message" })
  const attach = page.getByRole("button", { name: "Add mock attachment" })
  const send = page.getByRole("button", { name: "Send message" })
  const model = page.getByRole("combobox", { name: "Model" })
  const reasoning = page.getByRole("combobox", { name: "Reasoning" })

  const idleBorder = await composer.evaluate((element) => getComputedStyle(element).borderColor)
  await input.focus()
  await expect(input).toBeFocused()
  // Focus styles transition asynchronously; wait for the visible state, not a single frame.
  await expect.poll(() => composer.evaluate((element) => getComputedStyle(element).borderColor))
    .not.toBe(idleBorder)

  const inputBox = await input.boundingBox()
  const attachBox = await attach.boundingBox()
  const sendBox = await send.boundingBox()
  expect(inputBox).not.toBeNull()
  expect(attachBox).not.toBeNull()
  expect(sendBox).not.toBeNull()
  if (inputBox && attachBox && sendBox) {
    expect(Math.abs((attachBox.y + attachBox.height / 2) - (inputBox.y + inputBox.height / 2))).toBeLessThanOrEqual(1)
    expect(Math.abs((sendBox.y + sendBox.height / 2) - (inputBox.y + inputBox.height / 2))).toBeLessThanOrEqual(1)
  }

  await expect(send).not.toHaveClass(/aurora-btn--filled/)
  await input.fill("Steer this conversation")
  await expect(send).toHaveClass(/aurora-btn--filled/)

  const composerBox = await composer.boundingBox()
  const modelBox = await model.boundingBox()
  const reasoningBox = await reasoning.boundingBox()
  if (composerBox && modelBox && reasoningBox) {
    expect(modelBox.x).toBeGreaterThanOrEqual(composerBox.x)
    expect(reasoningBox.x + reasoningBox.width).toBeLessThanOrEqual(composerBox.x + composerBox.width + 0.5)
  }

  const hints = page.locator(".aurora-chat-hints")
  if (testInfo.project.name.includes("mobile")) await expect(hints).toBeHidden()
  else {
    await expect(hints).toBeVisible()
    const hintsBox = await hints.boundingBox()
    if (hintsBox && reasoningBox) expect(hintsBox.x).toBeGreaterThan(reasoningBox.x + reasoningBox.width)
  }
})

test("rich chat turns keep hover actions inside paint-contained message items", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"))
  await page.goto("/gallery/chat-block")

  const assertContainedRail = async (anchor: ReturnType<typeof page.getByText>) => {
    const item = anchor.locator('xpath=ancestor::*[@data-slot="message-scroller-item"][1]')
    const message = item.locator('[data-slot="message"]').first()
    await message.hover()
    const itemBox = await item.boundingBox()
    const messageBox = await message.boundingBox()
    const rail = item.locator(".aurora-chat-action-rail")
    const railBox = await rail.boundingBox()
    const timestampBox = await rail.locator("span").first().boundingBox()
    const buttonBoxes = await rail.locator("button").evaluateAll((buttons) => buttons.map((button) => {
      const rect = button.getBoundingClientRect()
      return { y: rect.y, bottom: rect.bottom }
    }))
    expect(itemBox).not.toBeNull()
    expect(messageBox).not.toBeNull()
    expect(railBox).not.toBeNull()
    expect(timestampBox).not.toBeNull()
    if (messageBox && railBox) expect(railBox.y - (messageBox.y + messageBox.height)).toBeCloseTo(3, 0)
    if (itemBox && timestampBox) expect(timestampBox.y + timestampBox.height).toBeLessThanOrEqual(itemBox.y + itemBox.height + 0.5)
    if (itemBox) for (const box of buttonBoxes) expect(box.bottom).toBeLessThanOrEqual(itemBox.y + itemBox.height + 0.5)
  }

  await assertContainedRail(page.getByText("References", { exact: true }))
  const reasoning = page.getByRole("button", { name: /Reasoned for 2s/i })
  await reasoning.click()
  await assertContainedRail(reasoning)
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

test("gallery initial load stays within transfer and responsiveness budgets", async ({ page }) => {
  await page.goto("/gallery", { waitUntil: "networkidle" })
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
