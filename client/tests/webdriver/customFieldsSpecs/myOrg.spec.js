import { expect } from "chai"
import Home from "../pages/home.page"
import MyOrg from "../pages/myOrg.page"

describe("My Organization page", () => {
  beforeEach("Open the My Organization page", () => {
    Home.openAsAdminUser()
    const myOrgUrl = Home.myOrgLink.getAttribute("href")
    MyOrg.openAsAdminUser(myOrgUrl)
  })

  afterEach("On the My Organization page...", () => {
    MyOrg.logout()
  })

  describe("When checking the report statistics part of the page", () => {
    it("Should see different types of fields statistics", () => {
      // Note: checks like length.above are being made because the wdio tests
      // might also be run after the jacocoTestReport, without resetting the
      // database, and in that case we have more reports in the statistics
      MyOrg.engagementDateStatistics.waitForDisplayed()
      const daysWithEvent = MyOrg.engagementDateStatistics.$$(
        ".fc-event-container"
      )
      // There is at least one date with events in the calendar
      expect(daysWithEvent).to.have.length.above(0)

      // Location statistics map is being loaded
      MyOrg.locationStatistics.waitForDisplayed()

      MyOrg.engagementStatus.waitForDisplayed()
      // There are 4 engagement status options
      const engagementStatusLegend = MyOrg.engagementStatus
        .$(".pieLegend")
        .$$("span")
      expect(engagementStatusLegend).to.have.length(4)

      MyOrg.tasks.waitForDisplayed()
      // There are 4 tasks on the x-axis
      const tasks = MyOrg.tasks.$("svg g").$$(".bars-group")
      expect(tasks).to.have.length(4)
      let countTasksBars = 0
      tasks.forEach(bar => {
        if (+bar.$("rect").getAttribute("height") > 0) {
          countTasksBars++
        }
      })
      // There is at least one bar
      expect(countTasksBars).to.be.above(0)

      MyOrg.trainingEvent.waitForDisplayed()
      // There are 3 training event options
      const trainingEventLegend = MyOrg.trainingEvent.$(".pieLegend").$$("span")
      expect(trainingEventLegend).to.have.length(3)
      // Total number of reports is bigger than 0
      const trainignEventTotal = MyOrg.trainingEvent.$("svg g text")
      expect(+trainignEventTotal.getText()).to.be.above(0)

      MyOrg.numberTrained.waitForDisplayed()
      const numberTrained = MyOrg.numberTrained.$("div em")
      expect(numberTrained.getText()).to.equal("Not specified")
    })
  })
})
