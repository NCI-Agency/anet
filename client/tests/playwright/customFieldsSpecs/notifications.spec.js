import { expect, test } from "@playwright/test"
// Note: number of assessments are based on the base data, if that changes, change this test as well

import HomePageObject from "../pages/home.page.js"

test.describe(() => {
  let Home
  test.beforeEach(async ({ page }) => {
    Home = new HomePageObject(page)
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
          state: "visible"
        })
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible"
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
          state: "visible"
        })
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible"
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
          state: "visible"
        })
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible"
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
          state: "visible"
        })
        await (
          await Home.getMyTasksLink()
        ).waitFor({
          state: "visible"
        })
        await expect(await Home.getMyCounterpartsNotifications()).toHaveCount(0)
        await expect(await Home.getMyTasksNotifications()).toHaveCount(0)
      })
    })
  })
})
