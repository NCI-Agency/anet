import { test as base, expect } from "@playwright/test"

// Page objects are shared within a worker; tests in each file run sequentially.
// Each spec receives its own browser context from Playwright.
let activePage
export const test = base.extend({
  scenario: [
    async ({ browser }, provide) => {
      const scenario = { context: undefined, page: undefined, file: undefined }
      try {
        await provide(scenario)
      } finally {
        await scenario.context?.close()
      }
    },
    { scope: "worker" }
  ],
  page: async ({ scenario, browser }, provide, testInfo) => {
    // Existing multi-step scenarios share a page within each spec.
    // Reset browser state when the worker moves to another spec file.
    if (scenario.file !== testInfo.file) {
      await scenario.context?.close()
      scenario.context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: testInfo.project.use.viewport,
        ignoreHTTPSErrors: true
      })
      scenario.page = await scenario.context.newPage()
      scenario.file = testInfo.file
    }
    await provide(scenario.page)
  },
  bindPage: [
    async ({ page }, provide) => {
      activePage = page
      try {
        await provide()
      } finally {
        activePage = undefined
      }
    },
    { auto: true }
  ]
})

export function currentPage() {
  if (!activePage) {
    throw new Error("Page objects must be used inside a Playwright test")
  }
  return activePage
}

export async function waitFor(locator, state, options = {}) {
  const { reverse = false, timeout = 10000 } = options
  if (state === "clickable") {
    await expect(locator).toBeVisible({ timeout })
    await expect(locator).toBeEnabled({ timeout })
    return
  }
  await locator.waitFor({
    state: reverse ? (state === "attached" ? "detached" : "hidden") : state,
    timeout
  })
}

export async function waitUntil(callback, options = {}) {
  await expect
    .poll(callback, {
      timeout: options.timeout || 10000,
      message: options.timeoutMsg
    })
    .toBeTruthy()
}

export async function isClickable(locator) {
  try {
    await locator.click({ trial: true, timeout: 1000 })
    return true
  } catch {
    return false
  }
}

export async function typeKeys(value) {
  const keyboard = currentPage().keyboard
  if (Array.isArray(value)) {
    for (const key of value) {
      await keyboard.press(key)
    }
  } else {
    await keyboard.insertText(String(value))
    const focused = currentPage().locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
  }
}

export async function mapSequential(items, callback) {
  const results = []
  for (let index = 0; index < items.length; index++) {
    results.push(await callback(items[index], index))
  }
  return results
}
