// Note: number of assessments are based on the base data, if that changes, change this test as well
import { expect } from "chai"
import Home from "../pages/home.page"

describe("Home page", () => {
  describe("When checking the notification numbers", () => {
    afterEach("Should logout...", async() => {
      await Home.logout()
    })

    it("Should see that Erin has 1 counterpart and no tasks with pending assessments", async() => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyCounterpartsLink()).waitForDisplayed()
      await (await Home.getMyTasksLink()).waitForDisplayed()
      await browser.pause(1000)
      expect(
        await (await Home.getMyCounterpartsNotifications()).getText()
      ).to.equal("1")
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyTasksNotifications()).isExisting()).to.be
        .false
    })
    it("Should see that Bob has no counterparts and 1 task with pending assessments", async() => {
      await Home.open("/", "bob")
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyCounterpartsLink()).waitForDisplayed()
      await (await Home.getMyTasksLink()).waitForDisplayed()
      await browser.pause(1000)
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyCounterpartsNotifications()).isExisting())
        .to.be.false
      expect(await (await Home.getMyTasksNotifications()).getText()).to.equal(
        "1"
      )
    })
    it("Should see that Jack has no counterpart and 1 task with pending assessments", async() => {
      await Home.open("/", "jack")
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyCounterpartsLink()).waitForDisplayed()
      await (await Home.getMyTasksLink()).waitForDisplayed()
      await browser.pause(1000)
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyCounterpartsNotifications()).isExisting())
        .to.be.false
      expect(await (await Home.getMyTasksNotifications()).getText()).to.equal(
        "1"
      )
    })
    it("Should see that Nick has no counterparts and no tasks with pending assessments", async() => {
      await Home.open("/", "nick")
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyCounterpartsLink()).waitForDisplayed()
      await (await Home.getMyTasksLink()).waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(await (await Home.getMyCounterpartsNotifications()).isExisting())
        .to.be.false
      expect(await (await Home.getMyTasksNotifications()).isExisting()).to.be
        .false
      /* eslint-enable no-unused-expressions */
    })
  })
})
