import { expect } from "chai"
import ShowAllEvents from "../pages/showAllEvents.page.js"

const EVENT_SERIES_NAMES = ["NMI PDT"]
const EVENT_NAMES = [
  "My active NMI test event",
  "My active test event",
  "NMI PDT 2024-01"
]

describe("Show All Events Page", () => {
  beforeEach(async () => {
    await ShowAllEvents.open()
  })

  it("Should display all event series", async () => {
    const eventSeries = await ShowAllEvents.getEventSeriesList()
    expect(eventSeries.length).to.be.within(1, 4)
    const eventSeriesNames = await ShowAllEvents.getEventSeriesNames()
    expect(eventSeriesNames).to.include.members(EVENT_SERIES_NAMES)
  })

  it("Should display all events", async () => {
    const events = await ShowAllEvents.getEventsList()
    expect(events.length).to.be.within(3, 7)
    const eventNames = await ShowAllEvents.getEventNames()
    expect(eventNames).to.include.members(EVENT_NAMES)
  })
})
