import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import Home from "../pages/home.page.js"
import MyCounterparts from "../pages/myCounterparts.page.js"
import { test, waitFor } from "../support.js"

test.describe("Home page", () => {
  test.describe("When checking the navigation items", () => {
    test("Should see a link to my counterparts page when the user is an advisor", async () => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      await waitFor(await Home.getMyCounterpartsLink(), "visible")

      await pwExpect(await Home.getMyCounterpartsLink()).not.toHaveCount(0)
      await Home.logout()
    })
  })
  test.describe("When checking the navigation items", () => {
    test("Should NOT see a link to my counterparts page when the user does not have a position", async () => {
      await Home.openAsPositionlessUser()

      await pwExpect(await Home.getMyCounterpartsLink()).toHaveCount(0)
      await Home.logout()
    })
  })
})
test.describe("My counterparts page", () => {
  test.afterEach("On the my counterparts page…", async () => {
    await MyCounterparts.logout()
  })
  test.describe("When Erin is checking the content of the page", () => {
    test("Should see a table of the counterparts", async () => {
      await MyCounterparts.open()
      await waitFor(await MyCounterparts.getMyCounterparts(), "visible")
      const myCounterpartsItems = await (
        await MyCounterparts.getMyCounterparts()
      )
        .locator("tr")
        .all()
      // table has a header and 1 counterpart rows
      expect(myCounterpartsItems).to.have.length(2)
    })
  })
  test.describe("When Rebecca is checking the content of the page", () => {
    test("Should see an empty table of the counterparts", async () => {
      await MyCounterparts.openAsSuperuser()
      await waitFor(await MyCounterparts.getMyCounterparts(), "visible")
      const myCounterpartsItems = await (
        await MyCounterparts.getMyCounterparts()
      )
        .locator("tr")
        .all()
      expect(myCounterpartsItems).to.have.length(0)
    })
  })
})
