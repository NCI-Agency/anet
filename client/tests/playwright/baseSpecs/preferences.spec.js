import { expect } from "@playwright/test"
import Preferences from "../pages/preferences.page.js"
import { test } from "../support.js"

test.describe("When checking the preferences page", () => {
  test("Should see the two preferences that can be edited", async () => {
    await Preferences.open()
    await expect(await Preferences.getReportsEmailsPreference()).toBeVisible()
    await expect(
      await Preferences.getSubscriptionsEmailsPreference()
    ).toBeVisible()
  })
})
