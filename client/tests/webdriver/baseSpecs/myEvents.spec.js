import { expect } from "chai"
import Home from "../pages/home.page"
import MyEvents from "../pages/myEvents.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Admin user should see a link to my events page", async () => {
      await Home.openAsAdminUser()
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyEventsLink()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyEventsLink()).isExisting()).to.be.true
      await Home.logout()
    })
    it("Regular user should not see a link to my events page", async () => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyEventsLink()).isExisting()).to.be.false
      await Home.logout()
    })
  })
})

describe("My events page", () => {
  beforeEach("Open the my events page", async () => {
    await MyEvents.openAsAdminUser()
  })

  afterEach("On the my events page…", async () => {
    await MyEvents.logout()
  })

  describe("When checking the content of the page", () => {
    it("Should see a table of the event series for the user", async () => {
      const myEventSeries = await MyEvents.getMyEventSeries()
      const myEventSeriesText = (
        await myEventSeries.map(async es => await es.getText())
      ).join(" ; ")
      expect(myEventSeriesText).to.include("NMI PDT")
      expect(myEventSeriesText).to.not.include("Inactive event series")
    })
    it("Should see a table of the events for the user", async () => {
      const myEvents = await MyEvents.getMyEvents()
      const myEventsText = (
        await myEvents.map(async e => await e.getText())
      ).join(" ; ")
      expect(myEventsText).to.include("My active NMI test event")
      expect(myEventsText).to.include("My active test event")
      expect(myEventsText).to.include("NMI PDT 2024-01")
      expect(myEventsText).to.not.include("My inactive NMI test event")
      expect(myEventsText).to.not.include("My inactive test event")
    })
    it("Should see a summary of the events for the user", async () => {
      await MyEvents.selectEventsSummary()
      // Validate some fields
      const nmiEventIdx = 3
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 1, 1)).getText()
      ).to.equal("Name: NMI PDT 2024-01")
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 2, 1)).getText()
      ).to.equal("Type: Conference")
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 5, 1)).getText()
      ).to.equal("Owner Organization: EF 2.2")
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 6, 1)).getText()
      ).to.equal("Host Organization: EF 2.2")
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 7, 1)).getText()
      ).to.equal("Admin Organization: EF 2.2")
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 8, 1)).getText()
      ).to.equal("Event Series this event belongs to: NMI PDT")
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 9, 1)).getText()
      ).to.equal(
        "Location where the event takes place: General Hospital 47.571772,-52.741935"
      )
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 10, 1)).getText()
      ).to.equal("Objectives: EF 1 » EF 1.2 » 1.2.B")
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 11, 1)).getText()
      ).to.equal("Organizations attending: EF 2.2")
      expect(
        await (await MyEvents.getEventSummarySpan(nmiEventIdx, 12, 1)).getText()
      ).to.equal("People attending: CIV ERINSON, Erin")
    })
    it("Should see a calendar of events", async () => {
      await MyEvents.selectEventsCalendar()
    })
    it("Should see a map of events", async () => {
      await MyEvents.selectEventsMap()
    })
  })
})
