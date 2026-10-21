import { expect } from "@playwright/test"
import Home from "../pages/home.page.js"
import MyEvents from "../pages/myEvents.page.js"
import { test, waitFor } from "../support.js"

test.describe("Home page", () => {
  test.describe("When checking the navigation items", () => {
    test("Admin user should see a link to my events page", async () => {
      await Home.openAsAdminUser()
      await (await Home.getLinksMenuButton()).click()
      await waitFor(await Home.getMyEventsLink(), "visible")
      await expect(await Home.getMyEventsLink()).not.toHaveCount(0)
      await Home.logout()
    })
    test("Regular user should not see a link to my events page", async () => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      await expect(await Home.getMyEventsLink()).toHaveCount(0)
      await Home.logout()
    })
  })
})
test.describe("My events page", () => {
  test.beforeEach("Open the my events page", async () => {
    await MyEvents.openAsAdminUser()
  })
  test.afterEach("On the my events page…", async () => {
    await MyEvents.logout()
  })
  test.describe("When checking the content of the page", () => {
    test("Should see a table of the event series for the user", async () => {
      const myEventSeries = await MyEvents.getMyEventSeries()
      const myEventSeriesText = (
        await Promise.all(
          myEventSeries.map(async es => (await es.innerText()).trim())
        )
      ).join(" ; ")
      expect(myEventSeriesText).toContain("NMI PDT")
      expect(myEventSeriesText).not.toContain("Inactive event series")
    })
    test("Should see a table of the events for the user", async () => {
      const myEvents = await MyEvents.getMyEvents()
      const myEventsText = (
        await Promise.all(myEvents.map(async e => (await e.innerText()).trim()))
      ).join(" ; ")
      expect(myEventsText).toContain("My active NMI test event")
      expect(myEventsText).toContain("My active test event")
      expect(myEventsText).toContain("NMI PDT 2024-01")
      expect(myEventsText).not.toContain("My inactive NMI test event")
      expect(myEventsText).not.toContain("My inactive test event")
    })
    test("Should see a summary of the events for the user", async () => {
      await MyEvents.selectEventsSummary()
      // Validate some fields
      const nmiEventIdx = 5
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 1, 1)
      ).toHaveText("Name: NMI PDT 2024-01", {
        useInnerText: true
      })
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 2, 1)
      ).toHaveText("Type: Conference", {
        useInnerText: true
      })
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 5, 1)
      ).toHaveText("Owner Organization:\nEF 2.2", {
        useInnerText: true
      })
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 6, 1)
      ).toHaveText("Hosts:\nEF 2.2", {
        useInnerText: true
      })
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 7, 1)
      ).toHaveText("Admin Organization:\nEF 2.2", {
        useInnerText: true
      })
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 8, 1)
      ).toHaveText("Event Series this event belongs to:\nNMI PDT", {
        useInnerText: true
      })
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 9, 1)
      ).toHaveText(
        "Location where the event takes place:\nGeneral Hospital Point location",
        {
          useInnerText: true
        }
      )
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 10, 1)
      ).toHaveText("Objectives:\nEF 1\n»\nEF 1.2\n»\n1.2.B", {
        useInnerText: true
      })
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 11, 1)
      ).toHaveText("Organizations attending:\nEF 2.2", {
        useInnerText: true
      })
      await expect(
        await MyEvents.getEventSummarySpan(nmiEventIdx, 12, 1)
      ).toHaveText("People attending:\nCIV Erin Erinson", {
        useInnerText: true
      })
    })
    test("Should see a calendar of events", async () => {
      await MyEvents.selectEventsCalendar()
    })
    test("Should see a map of events", async () => {
      await MyEvents.selectEventsMap()
    })
  })
})
