import { expect, test } from "@playwright/test"
import PreferencesPageObject from "../pages/preferences.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Preferences
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Preferences = new PreferencesPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("When checking the preferences page", () => {
    test("Should see the two preferences that can be edited", async () => {
      await Preferences.open()
      await expect(await Preferences.getReportsEmailsPreference()).toBeVisible()
      await expect(
        await Preferences.getSubscriptionsEmailsPreference()
      ).toBeVisible()
    })
  })
})
