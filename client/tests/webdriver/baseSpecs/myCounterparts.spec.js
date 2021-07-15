import { expect } from "chai"
import Home from "../pages/home.page"
import MyCounterparts from "../pages/myCounterparts.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Should see a link to my counterparts page when the user is an advisor", () => {
      Home.open()
      Home.myCounterpartsLink.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(Home.myCounterpartsLink.isExisting()).to.be.true
      Home.logout()
    })
  })
  describe("When checking the navigation items", () => {
    it("Should NOT see a link to my counterparts page when the user does not have a position", () => {
      Home.openAsPositionlessUser()
      // eslint-disable-next-line no-unused-expressions
      expect(Home.myCounterpartsLink.isExisting()).to.be.false
      // No Logout link, so just call logout directly
      browser.url("/api/logout")
    })
  })
})

describe("My counterparts page", () => {
  afterEach("On the my counterparts page...", () => {
    MyCounterparts.logout()
  })

  describe("When Erin is checking the content of the page", () => {
    it("Should see an empty table of the counterparts", () => {
      MyCounterparts.open()
      MyCounterparts.myCounterparts.waitForDisplayed()
      const myCounterpartsItems = MyCounterparts.myCounterparts.$$("tr")
      // table has a header and 1 counterpart rows
      expect(myCounterpartsItems).to.have.length(2)
    })
  })

  describe("When Rebecca is checking the content of the page", () => {
    it("Should see a table of the counterparts", () => {
      MyCounterparts.openAsSuperUser()
      MyCounterparts.myCounterparts.waitForDisplayed()
      const myCounterpartsItems = MyCounterparts.myCounterparts.$$("tr")
      expect(myCounterpartsItems).to.have.length(0)
    })
  })
})
