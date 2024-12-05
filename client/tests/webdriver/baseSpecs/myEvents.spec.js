import { expect } from "chai"
import Home from "../pages/home.page"
import MyEvents from "../pages/myEvents.page"
import Page from "../pages/page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Admin user should see a link to my events page", async() => {
      await Home.openAsAdminUser()
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyEventsLink()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyEventsLink()).isExisting()).to.be.true
      await Home.logout()
    })
    it("Regular user should not see a link to my events page", async() => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyEventsLink()).isExisting()).to.be.false
      await Home.logout()
    })
  })
})

describe("My events page", () => {
  beforeEach("Open the my events page", async() => {
    await MyEvents.openAs(Page.DEFAULT_CREDENTIALS.adminUser)
  })

  afterEach("On the my events page…", async() => {
    await MyEvents.logout()
  })

  describe("When checking the content of the page", () => {
    it("Should see a table of the event series for the user", async() => {
      expect(
        await (await MyEvents.getMyEventSeries(1, 1, 1)).getText()
      ).to.contains("NMI PDT")
    })
    it("Should see a table of the events for the user", async() => {
      expect(await (await MyEvents.getMyEvents(1, 1, 1)).getText()).to.contains(
        "NMI PDT 2024-01"
      )
    })
    it("Should see a summary of the events for the user", async() => {
      await MyEvents.selectEventsSummary()
      // Validate some fields
      expect(
        await (await MyEvents.getEventSummarySpan(1, 1, 1)).getText()
      ).to.equal("Name: NMI PDT 2024-01")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 2, 1)).getText()
      ).to.equal("Type: Conference")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 5, 1)).getText()
      ).to.contains("Host Organization")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 5, 1)).getText()
      ).to.contains("EF 2.2")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 6, 1)).getText()
      ).to.contains("Admin Organization")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 6, 1)).getText()
      ).to.contains("EF 2.2")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 7, 1)).getText()
      ).to.contains("Event Series this event belongs to")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 7, 1)).getText()
      ).to.contains("NMI PDT")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 8, 1)).getText()
      ).to.contains("Location where the event takes place:")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 8, 1)).getText()
      ).to.contains("General Hospital")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 9, 1)).getText()
      ).to.contains("Objectives:")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 9, 1)).getText()
      ).to.contains("1.2.B")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 10, 1)).getText()
      ).to.contains("Organizations attending:")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 10, 1)).getText()
      ).to.contains("EF 2.2")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 11, 1)).getText()
      ).to.contains("People attending:")
      expect(
        await (await MyEvents.getEventSummarySpan(1, 11, 1)).getText()
      ).to.contains("ERINSON")
    })
    it("Should see a calendar of events", async() => {
      await MyEvents.selectEventsCalendar()
    })
    it("Should see a map of events", async() => {
      await MyEvents.selectEventsMap()
    })
  })
})
