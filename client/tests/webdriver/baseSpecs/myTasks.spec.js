import { expect } from "chai"
import Home from "../pages/home.page"
import MyTasks from "../pages/myTasks.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Should see a link to my tasks page when the user is an advisor", async() => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyTasksLink()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyTasksLink()).isExisting()).to.be.true
      await Home.logout()
    })
  })
  describe("When checking the navigation items", () => {
    it("Should NOT see a link to my tasks page when the user does not have a position", async() => {
      await Home.openAsPositionlessUser()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyTasksLink()).isExisting()).to.be.false
      await Home.logout()
    })
  })
})

describe("My tasks page", () => {
  beforeEach("Open the my tasks page", async() => {
    await MyTasks.open()
  })

  afterEach("On the my tasks page…", async() => {
    await MyTasks.logout()
  })

  describe("When checking the content of the page", () => {
    it("Should see a table of the tasks being tasked for the user's organization", async() => {
      await (await MyTasks.getMyOrgAssignedTasks()).waitForDisplayed()
      const myOrgAssignedTasksItems = await (
        await MyTasks.getMyOrgAssignedTasks()
      ).$$("tr")
      // table has a header and 5 task rows
      expect(myOrgAssignedTasksItems).to.have.length(6)
    })
    it("Should see a table of the tasks being the responsibility of the current user", async() => {
      await (await MyTasks.getMyResponsibleTasks()).waitForDisplayed()
      const myResponsibleTasksItems = await (
        await MyTasks.getMyResponsibleTasks()
      ).$$("tr")
      expect(myResponsibleTasksItems).to.have.length(0)
    })
  })
})
