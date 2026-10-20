import { expect as pwExpect } from "@playwright/test"
// Note: number of assessments are based on the base data, if that changes, change this test as well

import Home from "../pages/home.page.js"
import { test, waitFor } from "../support.js"

test.describe("Home page", () => {
  test.describe("When checking the notification numbers", () => {
    test.afterEach("Should logout…", async () => {
      await Home.logout()
    })
    test("Should see that Erin has 1 counterpart and no tasks with pending assessments", async () => {
      await Home.open()
      await (await Home.getLinksMenuButton()).click()
      await waitFor(await Home.getMyCounterpartsLink(), "visible")
      await waitFor(await Home.getMyTasksLink(), "visible")
      await pwExpect(await Home.getMyCounterpartsNotifications()).toHaveText(
        "1",
        {
          useInnerText: true
        }
      )

      await pwExpect(await Home.getMyTasksNotifications()).toHaveCount(0)
    })
    test("Should see that Bob has no counterparts and 1 task with pending assessments", async () => {
      await Home.open("/", "bob")
      await (await Home.getLinksMenuButton()).click()
      await waitFor(await Home.getMyCounterpartsLink(), "visible")
      await waitFor(await Home.getMyTasksLink(), "visible")

      await pwExpect(await Home.getMyCounterpartsNotifications()).toHaveCount(0)
      await pwExpect(await Home.getMyTasksNotifications()).toHaveText("1", {
        useInnerText: true
      })
    })
    test("Should see that Henry has no counterpart and 2 tasks with pending assessments", async () => {
      await Home.open("/", "henry")
      await (await Home.getLinksMenuButton()).click()
      await waitFor(await Home.getMyCounterpartsLink(), "visible")
      await waitFor(await Home.getMyTasksLink(), "visible")

      await pwExpect(await Home.getMyCounterpartsNotifications()).toHaveCount(0)
      await pwExpect(await Home.getMyTasksNotifications()).toHaveText("2", {
        useInnerText: true
      })
    })
    test("Should see that Nick has no counterparts and no tasks with pending assessments", async () => {
      await Home.open("/", "nick")
      await (await Home.getLinksMenuButton()).click()
      await waitFor(await Home.getMyCounterpartsLink(), "visible")
      await waitFor(await Home.getMyTasksLink(), "visible")

      await pwExpect(await Home.getMyCounterpartsNotifications()).toHaveCount(0)
      await pwExpect(await Home.getMyTasksNotifications()).toHaveCount(0)
    })
  })
})
