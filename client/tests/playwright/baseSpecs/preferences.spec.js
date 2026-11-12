import { expect, test } from "@playwright/test"
import PreferencesPageObject from "../pages/preferences.page.js"

test.describe(() => {
  let Preferences
  test.beforeEach(async ({ page }) => {
    Preferences = new PreferencesPageObject(page)
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
