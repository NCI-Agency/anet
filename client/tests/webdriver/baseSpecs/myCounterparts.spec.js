import { expect } from "chai"
import Home from "../pages/home.page"
import MyCounterparts from "../pages/myCounterparts.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Should see a link to my counterparts page when the user is an advisor", () => {
      Home.open()
      Home.getLinksMenuButton().click()
      Home.getMyCounterpartsLink().waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(Home.getMyCounterpartsLink().isExisting()).to.be.true
      Home.logout()
    })
  })
  describe("When checking the navigation items", () => {
    it("Should NOT see a link to my counterparts page when the user does not have a position", () => {
      Home.openAsPositionlessUser()
      // eslint-disable-next-line no-unused-expressions
      expect(Home.getMyCounterpartsLink().isExisting()).to.be.false
      Home.logout()
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
      MyCounterparts.getMyCounterparts().waitForDisplayed()
      const myCounterpartsItems = MyCounterparts.getMyCounterparts().$$("tr")
      // table has a header and 1 counterpart rows
      expect(myCounterpartsItems).to.have.length(2)
    })
  })

  describe("When Rebecca is checking the content of the page", () => {
    it("Should see a table of the counterparts", () => {
      MyCounterparts.openAsSuperUser()
      MyCounterparts.getMyCounterparts().waitForDisplayed()
      const myCounterpartsItems = MyCounterparts.getMyCounterparts().$$("tr")
      expect(myCounterpartsItems).to.have.length(0)
    })
  })
})
