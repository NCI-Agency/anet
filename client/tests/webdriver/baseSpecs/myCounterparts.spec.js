import { expect } from "chai"
import Home from "../pages/home.page"
import MyCounterparts from "../pages/myCounterparts.page"

describe("Home page", () => {
  describe("When checking the navigation items", () => {
    it("Should see a link to my counterparts page when the user is an advisor", async() => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      await (await Home.getMyCounterpartsLink()).waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyCounterpartsLink()).isExisting()).to.be.true
      await Home.logout()
    })
  })
  describe("When checking the navigation items", () => {
    it("Should NOT see a link to my counterparts page when the user does not have a position", async() => {
      await Home.openAsPositionlessUser()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Home.getMyCounterpartsLink()).isExisting()).to.be
        .false
      await Home.logout()
    })
  })
})

describe("My counterparts page", () => {
  afterEach("On the my counterparts page…", async() => {
    await MyCounterparts.logout()
  })

  describe("When Erin is checking the content of the page", () => {
    it("Should see a table of the counterparts", async() => {
      await MyCounterparts.open()
      await (await MyCounterparts.getMyCounterparts()).waitForDisplayed()
      const myCounterpartsItems = await (
        await MyCounterparts.getMyCounterparts()
      ).$$("tr")
      // table has a header and 1 counterpart rows
      expect(myCounterpartsItems).to.have.length(2)
    })
  })

  describe("When Rebecca is checking the content of the page", () => {
    it("Should see an empty table of the counterparts", async() => {
      await MyCounterparts.openAsSuperuser()
      await (await MyCounterparts.getMyCounterparts()).waitForDisplayed()
      const myCounterpartsItems = await (
        await MyCounterparts.getMyCounterparts()
      ).$$("tr")
      expect(myCounterpartsItems).to.have.length(0)
    })
  })
})
