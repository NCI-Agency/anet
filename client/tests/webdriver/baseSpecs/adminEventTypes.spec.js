import { expect } from "chai"
import AdminEventTypes from "../pages/adminEventTypes.page"

describe("When on the admin event types page", () => {
  it("Should show related events", async () => {
    await AdminEventTypes.openAsAdminUser()
    await (await AdminEventTypes.getEventTypesTable()).waitForExist()
    await (await AdminEventTypes.getEventTypesTable()).waitForDisplayed()
    const rows = await AdminEventTypes.getEventTypesRows()
    let nrOfRowsWithRelatedEvents = 0
    for (const row of rows) {
      const count = await (
        await AdminEventTypes.getEventTypesRelatedEventsCount(row)
      ).getText()
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
