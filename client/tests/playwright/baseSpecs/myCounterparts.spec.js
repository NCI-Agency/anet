import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import MyCounterpartsPageObject from "../pages/myCounterparts.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, MyCounterparts
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    MyCounterparts = new MyCounterpartsPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("Home page", () => {
    test.describe("When checking the navigation items", () => {
      test("Should see a link to my counterparts page when the user is an advisor", async () => {
        await Home.open()
        await (await Home.getLinksMenuButton()).click()
        await (
          await Home.getMyCounterpartsLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await Home.getMyCounterpartsLink()).not.toHaveCount(0)
        await Home.logout()
      })
    })
    test.describe("When checking the navigation items", () => {
      test("Should NOT see a link to my counterparts page when the user does not have a position", async () => {
        await Home.openAsPositionlessUser()
        await expect(await Home.getMyCounterpartsLink()).toHaveCount(0)
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
        await (
          await MyCounterparts.getMyCounterparts()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const myCounterpartsItems = await (
          await MyCounterparts.getMyCounterparts()
        ).locator("tr")
        // table has a header and 1 counterpart rows
        await expect(myCounterpartsItems).toHaveCount(2)
      })
    })
    test.describe("When Rebecca is checking the content of the page", () => {
      test("Should see an empty table of the counterparts", async () => {
        await MyCounterparts.openAsSuperuser()
        await (
          await MyCounterparts.getMyCounterparts()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const myCounterpartsItems = await (
          await MyCounterparts.getMyCounterparts()
        ).locator("tr")
        await expect(myCounterpartsItems).toHaveCount(0)
      })
    })
  })
})
