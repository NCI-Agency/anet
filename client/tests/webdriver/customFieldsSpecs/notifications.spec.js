// Note: number of assessments are based on the base data, if that changes, change this test as well
import { expect } from "chai"
import Home from "../pages/home.page"

describe("Home page", () => {
  describe("When checking the notification numbers", () => {
    afterEach("On the create authorization group page...", () => {
      Home.logout()
    })

    it("Should see that Erin has 1 counterpart and no tasks with pending assessments", () => {
      Home.open()
      Home.getLinksMenuButton().click()
      Home.getMyCounterpartsLink().waitForDisplayed()
      Home.getMyTasksLink().waitForDisplayed()
      browser.pause(1000)
      expect(Home.getMyCounterpartsNotifications().getText()).to.equal("1")
      // eslint-disable-next-line no-unused-expressions
      expect(Home.getMyTasksNotifications().isExisting()).to.be.false
    })
    it("Should see that Bob has no counterparts and 1 task with pending assessments", () => {
      Home.open("/", "bob")
      Home.getLinksMenuButton().click()
      Home.getMyCounterpartsLink().waitForDisplayed()
      Home.getMyTasksLink().waitForDisplayed()
      browser.pause(1000)
      // eslint-disable-next-line no-unused-expressions
      expect(Home.getMyCounterpartsNotifications().isExisting()).to.be.false
      expect(Home.getMyTasksNotifications().getText()).to.equal("1")
    })
    it("Should see that Jack has no counterpart and 1 task with pending assessments", () => {
      Home.open("/", "jack")
      Home.getLinksMenuButton().click()
      Home.getMyCounterpartsLink().waitForDisplayed()
      Home.getMyTasksLink().waitForDisplayed()
      browser.pause(1000)
      // eslint-disable-next-line no-unused-expressions
      expect(Home.getMyCounterpartsNotifications().isExisting()).to.be.false
      expect(Home.getMyTasksNotifications().getText()).to.equal("1")
    })
    it("Should see that Nick has no counterparts and no tasks with pending assessments", () => {
      Home.open("/", "nick")
      Home.getLinksMenuButton().click()
      Home.getMyCounterpartsLink().waitForDisplayed()
      Home.getMyTasksLink().waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(Home.getMyCounterpartsNotifications().isExisting()).to.be.false
      expect(Home.getMyTasksNotifications().isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */
    })
  })
})
