import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import MyTasksPageObject from "../pages/myTasks.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, MyTasks
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    MyTasks = new MyTasksPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("Home page", () => {
    test.describe("When checking the navigation items", () => {
      test("Should see a link to my tasks page when the user is an advisor", async () => {
        await Home.open()
        await (await Home.getLinksMenuButton()).click()
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await Home.getMyTasksLink()).not.toHaveCount(0)
        await Home.logout()
      })
    })
    test.describe("When checking the navigation items", () => {
      test("Should NOT see a link to my tasks page when the user does not have a position", async () => {
        await Home.openAsPositionlessUser()
        await expect(await Home.getMyTasksLink()).toHaveCount(0)
        await Home.logout()
      })
    })
  })
  test.describe("My tasks page", () => {
    test.beforeEach("Open the my tasks page", async () => {
      await MyTasks.open()
    })
    test.afterEach("On the my tasks page…", async () => {
      await MyTasks.logout()
    })
    test.describe("When checking the content of the page", () => {
      test("Should see a table of the tasks being tasked for the user's organization", async () => {
        await (
          await MyTasks.getMyOrgAssignedTasks()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const myOrgAssignedTasksItems = await (
          await MyTasks.getMyOrgAssignedTasks()
        ).locator("tr")
        // table has a header and 4 task rows
        await expect(myOrgAssignedTasksItems).toHaveCount(5)
      })
      test("Should see a table of the tasks being the responsibility of the current user", async () => {
        await (
          await MyTasks.getMyResponsibleTasks()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const myResponsibleTasksItems = await (
          await MyTasks.getMyResponsibleTasks()
        ).locator("tr")
        await expect(myResponsibleTasksItems).toHaveCount(0)
      })
    })
  })
})
