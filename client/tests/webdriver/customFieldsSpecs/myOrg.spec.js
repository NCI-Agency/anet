import { expect } from "chai"
import Home from "../pages/home.page"
import MyOrg from "../pages/myOrg.page"

describe("My Organization page", () => {
  beforeEach("Open the My Organization page", async () => {
    await Home.openAsAdminUser()
    await (await Home.getLinksMenuButton()).click()
    await (await Home.getMyOrgLink()).waitForExist()
    const myOrgUrl = await (
      await (await Home.getMyOrgLink()).parentElement()
    ).getAttribute("href")
    await MyOrg.openAsAdminUser(myOrgUrl)
  })

  afterEach("On the My Organization page…", async () => {
    await MyOrg.logout()
  })

  describe("When checking the report statistics part of the page", () => {
    it("Should see different types of fields statistics", async () => {
      await (await MyOrg.getReportStatisticsButton()).click()
      // Note: checks like length.above are being made because the wdio tests
      // might also be run after the jacocoTestReport, without resetting the
      // database, and in that case we have more reports in the statistics
      await (await MyOrg.getEngagementDateStatistics()).waitForDisplayed()
      const daysWithEvent = await (
        await MyOrg.getEngagementDateStatistics()
      ).$$(".fc-event-title-container")
      // There is at least one date with events in the calendar
      expect(daysWithEvent).to.have.length.above(0)

      // Location statistics map is being loaded
      await (await MyOrg.getLocationStatistics()).waitForDisplayed()

      await (await MyOrg.getEngagementStatus()).waitForDisplayed()
      // There are 4 engagement status options
      const engagementStatusLegend = await (await MyOrg.getEngagementStatus())
        .$(".pieLegend")
        .$$("span")
      expect(engagementStatusLegend).to.have.length(4)

      await (await MyOrg.getTasks()).waitForDisplayed()
      // There are 3 tasks on the x-axis
      const tasks = await (await MyOrg.getTasks()).$("svg g").$$(".bars-group")
      expect(tasks).to.have.length(3)
      let countTasksBars = 0
      for (const bar of tasks) {
        if (+(await (await bar.$("rect")).getAttribute("height")) > 0) {
          countTasksBars++
        }
      }
      // There is at least one bar
      expect(countTasksBars).to.be.above(0)

      await (await MyOrg.getTrainingEvent()).waitForDisplayed()
      // There are 3 training event options
      const trainingEventLegend = await (await MyOrg.getTrainingEvent())
        .$(".pieLegend")
        .$$("span")
      expect(trainingEventLegend).to.have.length(3)
      // Total number of reports is bigger than 0
      const trainignEventTotal = await (
        await MyOrg.getTrainingEvent()
      ).$("svg g text")
      expect(+(await trainignEventTotal.getText())).to.be.above(0)

      await (await MyOrg.getNumberTrained()).waitForDisplayed()
      const numberTrained = await (await MyOrg.getNumberTrained()).$("div em")
      expect(await numberTrained.getText()).to.equal("Not specified")
    })
  })
})
