import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import Home from "../pages/home.page.js"
import MyOrg from "../pages/myOrg.page.js"
import { test, waitFor } from "../support.js"

test.describe("My Organization page", () => {
  test.beforeEach("Open the My Organization page", async () => {
    await Home.openAsAdminUser()
    await (await Home.getLinksMenuButton()).click()
    await waitFor(await Home.getMyOrgLink(), "attached")
    const myOrgUrl = await (
      await (await Home.getMyOrgLink()).locator("..")
    ).getAttribute("href")
    await MyOrg.openAsAdminUser(myOrgUrl)
  })
  test.afterEach("On the My Organization page…", async () => {
    await MyOrg.logout()
  })
  test.describe("When checking the report statistics part of the page", () => {
    test("Should see different types of fields statistics", async () => {
      await (await MyOrg.getReportStatisticsButton()).click()
      // Note: checks like length.above are being made because the browser tests
      // might also be run after the jacocoTestReport, without resetting the
      // database, and in that case we have more reports in the statistics
      await waitFor(await MyOrg.getEngagementDateStatistics(), "visible")
      const daysWithEvent = await (
        await MyOrg.getEngagementDateStatistics()
      )
        .locator(".fc-event-title-container")
        .all()
      // There is at least one date with events in the calendar
      expect(daysWithEvent).to.have.length.above(0)

      // Location statistics map is being loaded
      await waitFor(await MyOrg.getLocationStatistics(), "visible")
      await waitFor(await MyOrg.getEngagementStatus(), "visible")
      // There are 4 engagement status options
      const engagementStatusLegend = await (
        await MyOrg.getEngagementStatus()
      )
        .locator(".pieLegend")
        .first()
        .locator("span")
        .all()
      expect(engagementStatusLegend).to.have.length(4)
      await waitFor(await MyOrg.getTasks(), "visible")
      // There are 3 tasks on the x-axis
      const tasks = await (
        await MyOrg.getTasks()
      )
        .locator("svg g")
        .first()
        .locator(".bars-group")
        .all()
      expect(tasks).to.have.length(3)
      let countTasksBars = 0
      for (const bar of tasks) {
        if (
          +(await (await bar.locator("rect").first()).getAttribute("height")) >
          0
        ) {
          countTasksBars++
        }
      }
      // There is at least one bar
      expect(countTasksBars).to.be.above(0)
      await waitFor(await MyOrg.getTrainingEvent(), "visible")
      // There are 3 training event options
      const trainingEventLegend = await (
        await MyOrg.getTrainingEvent()
      )
        .locator(".pieLegend")
        .first()
        .locator("span")
        .all()
      expect(trainingEventLegend).to.have.length(3)
      // Total number of reports is bigger than 0
      const trainingEventTotal = await (
        await MyOrg.getTrainingEvent()
      )
        .locator("svg g text")
        .first()
      await pwExpect
        .poll(async () => +(await trainingEventTotal.textContent()).trim())
        .toBeGreaterThan(0)
      await waitFor(await MyOrg.getNumberTrained(), "visible")
      const numberTrained = await (
        await MyOrg.getNumberTrained()
      )
        .locator("div em")
        .first()
      await pwExpect(numberTrained).toHaveText("Not specified", {
        useInnerText: true
      })
    })
  })
})
