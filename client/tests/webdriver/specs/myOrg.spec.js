import { expect } from "chai"
import Home from "../pages/home.page"
import MyOrg from "../pages/myOrg.page"

describe("My organization page", () => {
  beforeEach("Open the my organization page", () => {
    Home.openAsAdminUser()
    const myOrgUrl = Home.myOrgLink.getAttribute("href")
    MyOrg.openAsAdminUser(myOrgUrl)
  })

  describe("When checking the report statistics part of the page", () => {
    it("Should see different types of fields statistics", () => {
      MyOrg.engagementDateStatistics.waitForDisplayed()
      const daysWithEvent = MyOrg.engagementDateStatistics.$$(
        ".fc-event-container"
      )
      expect(daysWithEvent.length).to.equal(1)

      MyOrg.locationStatistics.waitForDisplayed()

      MyOrg.engagementStatus.waitForDisplayed()
      const engagementStatusLegend = MyOrg.engagementStatus
        .$(".pieLegend")
        .$$("span")
      expect(engagementStatusLegend.length).to.equal(4)

      MyOrg.tasks.waitForDisplayed()
      const tasksBars = MyOrg.tasks.$("svg g").$$(".bars-group")
      expect(tasksBars.length).to.equal(4)
      let countTasksBars = 0
      tasksBars.forEach(bar => {
        if (bar.$("rect").getAttribute("data-tip").includes("<p>1</p>")) {
          countTasksBars++
        }
      })
      expect(countTasksBars).to.equal(3)

      MyOrg.trainingEvent.waitForDisplayed()
      const trainingEventLegend = MyOrg.trainingEvent.$(".pieLegend").$$("span")
      expect(trainingEventLegend.length).to.equal(3)
      const trainignEventTotal = MyOrg.trainingEvent.$("svg g text")
      expect(trainignEventTotal.getText()).to.equal("1")

      MyOrg.numberTrained.waitForDisplayed()
      const numberTrained = MyOrg.numberTrained.$("div em")
      expect(numberTrained.getText()).to.equal("Not specified")
    })
  })
})
