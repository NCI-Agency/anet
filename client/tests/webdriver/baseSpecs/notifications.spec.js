// Note: number of assessments are based on the base data, if that changes, change this test as well
import { expect } from "chai"
import Home from "../pages/home.page"

describe("Home page", () => {
  describe("When checking the notification numbers", () => {
    it("Should see that Erin has 1 counterpart with pending assessment and no tasks with pending assessments", () => {
      Home.open()
      Home.myCounterpartsLink.waitForDisplayed()
      Home.myTasksLink.waitForDisplayed()
      expect(Home.myCounterpartsNotifications.getText()).to.equal("1")
      // eslint-disable-next-line no-unused-expressions
      expect(Home.myTasksNotifications.isExisting()).to.be.false
    })
    it("Should see that Jack has no counterparts with pending assessment", () => {
      Home.open("/", "jack")
      Home.myCounterpartsLink.waitForDisplayed()
      Home.myTasksLink.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(Home.myCounterpartsNotifications.isExisting()).to.be.false
    })
    it("Should see that Jack has 1 task with pending assessments", () => {
      Home.open("/", "jack")
      Home.myCounterpartsLink.waitForDisplayed()
      Home.myTasksLink.waitForDisplayed()
      expect(Home.myTasksNotifications.getText()).to.equal("1")
    })
  })
})
