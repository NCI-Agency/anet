import { expect } from "@playwright/test"
import ShowAllEvents from "../pages/showAllEvents.page.js"
import { test } from "../support.js"

const EVENT_SERIES_NAMES = ["NMI PDT"]
const EVENT_NAMES = [
  "My active NMI test event",
  "My active test event",
  "NMI PDT 2024-01"
]
test.describe("Show All Events Page", () => {
  test.beforeEach(async () => {
    await ShowAllEvents.open()
  })
  test("Should display all event series", async () => {
    const eventSeries = await ShowAllEvents.getEventSeriesList()
    expect(eventSeries.length).toBeGreaterThanOrEqual(1)
    expect(eventSeries.length).toBeLessThanOrEqual(4)
    const eventSeriesNames = await ShowAllEvents.getEventSeriesNames()
    expect(eventSeriesNames).toEqual(expect.arrayContaining(EVENT_SERIES_NAMES))
  })
  test("Should display all events", async () => {
    const events = await ShowAllEvents.getEventsList()
    expect(events.length).toBeGreaterThanOrEqual(3)
    expect(events.length).toBeLessThanOrEqual(7)
    const eventNames = await ShowAllEvents.getEventNames()
    expect(eventNames).toEqual(expect.arrayContaining(EVENT_NAMES))
  })
})
