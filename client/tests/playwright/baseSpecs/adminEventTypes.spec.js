import { expect, test } from "@playwright/test"
import AdminEventTypesPageObject from "../pages/adminEventTypes.page.js"

test.describe(() => {
  let page, AdminEventTypes
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    AdminEventTypes = new AdminEventTypesPageObject(page)
  })
  test.describe("When on the admin event types page", () => {
    test("Should show related events", async () => {
      await AdminEventTypes.openAsAdminUser()
      await (
        await AdminEventTypes.getEventTypesTable()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      const rows = await AdminEventTypes.getEventTypesRows()
      let nrOfRowsWithRelatedEvents = 0
      for (const row of rows) {
        const count = (
          await (
            await AdminEventTypes.getEventTypesRelatedEventsCount(row)
          ).innerText()
        ).trim()
        if (count > 0) {
          nrOfRowsWithRelatedEvents += 1
          await expect(
            await AdminEventTypes.getEventTypesRelatedEventsButton(row)
          ).toBeVisible()
        }
      }
      expect(nrOfRowsWithRelatedEvents).toBeGreaterThanOrEqual(3)
    })
  })
})
