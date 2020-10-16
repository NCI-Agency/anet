import { expect } from "chai"
import Home from "../pages/home.page"
import MyCounterparts from "../pages/myCounterparts.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Should see a link to my counterparts page when the user is an advisor", () => {
      Home.open()
      Home.myCounterpartsLink.waitForDisplayed()
    })
  })
  describe("When checking the navigation items", () => {
    it("Should NOT see a link to my counterparts page when the user does not have a position", () => {
      Home.openAsPositionlessUser()
      expect(Home.myCounterpartsLink.isExisting()).to.equal(false)
    })
  })
})

describe("My counterparts page", () => {
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
