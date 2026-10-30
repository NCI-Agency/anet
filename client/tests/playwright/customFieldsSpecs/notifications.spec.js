import { expect, test } from "@playwright/test"
// Note: number of assessments are based on the base data, if that changes, change this test as well

import HomePageObject from "../pages/home.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("Home page", () => {
    test.describe("When checking the notification numbers", () => {
      test.afterEach("Should logout…", async () => {
        await Home.logout()
      })
      test("Should see that Erin has 1 counterpart and no tasks with pending assessments", async () => {
        await Home.open()
        await (await Home.getLinksMenuButton()).click()
        await (
          await Home.getMyCounterpartsLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await Home.getMyCounterpartsNotifications()).toHaveText(
          "1",
          {
            useInnerText: true
          }
        )
        await expect(await Home.getMyTasksNotifications()).toHaveCount(0)
      })
      test("Should see that Bob has no counterparts and 1 task with pending assessments", async () => {
        await Home.open("/", "bob")
        await (await Home.getLinksMenuButton()).click()
        await (
          await Home.getMyCounterpartsLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await Home.getMyCounterpartsNotifications()).toHaveCount(0)
        await expect(await Home.getMyTasksNotifications()).toHaveText("1", {
          useInnerText: true
        })
      })
      test("Should see that Henry has no counterpart and 2 tasks with pending assessments", async () => {
        await Home.open("/", "henry")
        await (await Home.getLinksMenuButton()).click()
        await (
          await Home.getMyCounterpartsLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await Home.getMyCounterpartsNotifications()).toHaveCount(0)
        await expect(await Home.getMyTasksNotifications()).toHaveText("2", {
          useInnerText: true
        })
      })
      test("Should see that Nick has no counterparts and no tasks with pending assessments", async () => {
        await Home.open("/", "nick")
        await (await Home.getLinksMenuButton()).click()
        await (
          await Home.getMyCounterpartsLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await Home.getMyCounterpartsNotifications()).toHaveCount(0)
        await expect(await Home.getMyTasksNotifications()).toHaveCount(0)
      })
    })
  })
})
