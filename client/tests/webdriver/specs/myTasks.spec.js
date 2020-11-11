import { expect } from "chai"
import Home from "../pages/home.page"
import MyTasks from "../pages/myTasks.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Should see a link to my tasks page when the user is an advisor", () => {
      Home.open()
      Home.myTasksLink.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(Home.myTasksLink.isExisting()).to.be.true
      Home.logout()
    })
  })
  describe("When checking the navigation items", () => {
    it("Should NOT see a link to my tasks page when the user does not have a position", () => {
      Home.openAsPositionlessUser()
      // eslint-disable-next-line no-unused-expressions
      expect(Home.myTasksLink.isExisting()).to.be.false
      // No Logout link, so just call logout directly
      browser.url("/api/logout")
    })
  })
})

describe("My tasks page", () => {
  beforeEach("Open the my tasks page", () => {
    MyTasks.open()
  })

  afterEach("On the my tasks page...", () => {
    MyTasks.logout()
  })

  describe("When checking the content of the page", () => {
    it("Should see a table of the tasks being tasked for the user's organization", () => {
      MyTasks.myOrgAssignedTasks.waitForDisplayed()
      const myOrgAssignedTasksItems = MyTasks.myOrgAssignedTasks.$$("tr")
      // table has a header and 5 task rows
      expect(myOrgAssignedTasksItems).to.have.length(6)
    })
    it("Should see a table of the tasks being the reposnibility of the current user", () => {
      MyTasks.myResponsibleTasks.waitForDisplayed()
      const myResponsibleTasksItems = MyTasks.myResponsibleTasks.$$("tr")
      expect(myResponsibleTasksItems).to.have.length(0)
    })
  })
})
