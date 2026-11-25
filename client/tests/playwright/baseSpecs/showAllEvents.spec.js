import { expect, test } from "@playwright/test"
import { useSerialScenario } from "../pages/page.js"
import ShowAllEventsPageObject from "../pages/showAllEvents.page.js"

test.describe(() => {
  let ShowAllEvents
  useSerialScenario(page => {
    ShowAllEvents = new ShowAllEventsPageObject(page)
  })
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
      await expect
        .poll(() => ShowAllEvents.eventSeriesNames.allInnerTexts())
        .toEqual(expect.arrayContaining(EVENT_SERIES_NAMES))
      await expect
        .poll(() => ShowAllEvents.eventSeries.count())
        .toBeGreaterThanOrEqual(1)
      await expect
        .poll(() => ShowAllEvents.eventSeries.count())
        .toBeLessThanOrEqual(4)
    })
    test("Should display all events", async () => {
      await expect
        .poll(() => ShowAllEvents.eventNames.allInnerTexts())
        .toEqual(expect.arrayContaining(EVENT_NAMES))
      await expect
        .poll(() => ShowAllEvents.events.count())
        .toBeGreaterThanOrEqual(3)
      await expect
        .poll(() => ShowAllEvents.events.count())
        .toBeLessThanOrEqual(7)
    })
  })
})
