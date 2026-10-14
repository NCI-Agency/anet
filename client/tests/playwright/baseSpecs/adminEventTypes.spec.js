import { expect } from "chai"
import AdminEventTypes from "../pages/adminEventTypes.page.js"
import { test, waitFor } from "../support.js"

test.describe("When on the admin event types page", () => {
  test("Should show related events", async () => {
    await AdminEventTypes.openAsAdminUser()
    await waitFor(await AdminEventTypes.getEventTypesTable(), "attached")
    await waitFor(await AdminEventTypes.getEventTypesTable(), "visible")
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
        // eslint-disable-next-line no-unused-expressions
        expect(await AdminEventTypes.getEventTypesRelatedEventsButton(row)).to
          .exist
      }
    }
    expect(nrOfRowsWithRelatedEvents).to.be.at.least(3)
  })
})
