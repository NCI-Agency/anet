import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import MyOrgPageObject from "../pages/myOrg.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, MyOrg
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    MyOrg = new MyOrgPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("My Organization page", () => {
    test.beforeEach("Open the My Organization page", async () => {
      await Home.openAsAdminUser()
      await (await Home.getLinksMenuButton()).click()
      await (
        await Home.getMyOrgLink()
      ).waitFor({
        state: "attached",
        timeout: 10000
      })
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
        await (
          await MyOrg.getEngagementDateStatistics()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const daysWithEvent = await (
          await MyOrg.getEngagementDateStatistics()
        )
          .locator(".fc-event-title-container")
          .all()
        // There is at least one date with events in the calendar
        expect(daysWithEvent.length).toBeGreaterThan(0)

        // Location statistics map is being loaded
        await (
          await MyOrg.getLocationStatistics()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await MyOrg.getEngagementStatus()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        // There are 4 engagement status options
        const engagementStatusLegend = await (
          await MyOrg.getEngagementStatus()
        )
          .locator(".pieLegend")
          .first()
          .locator("span")
        await expect(engagementStatusLegend).toHaveCount(4)
        await (
          await MyOrg.getTasks()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        // There are 3 tasks on the x-axis
        const tasks = await (
          await MyOrg.getTasks()
        )
          .locator("svg g")
          .first()
          .locator(".bars-group")
          .all()
        expect(tasks).toHaveLength(3)
        let countTasksBars = 0
        for (const bar of tasks) {
          if (
            +(await (
              await bar.locator("rect").first()
            ).getAttribute("height")) > 0
          ) {
            countTasksBars++
          }
        }
        // There is at least one bar
        expect(countTasksBars).toBeGreaterThan(0)
        await (
          await MyOrg.getTrainingEvent()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        // There are 3 training event options
        const trainingEventLegend = await (
          await MyOrg.getTrainingEvent()
        )
          .locator(".pieLegend")
          .first()
          .locator("span")
        await expect(trainingEventLegend).toHaveCount(3)
        // Total number of reports is bigger than 0
        const trainingEventTotal = await (
          await MyOrg.getTrainingEvent()
        )
          .locator("svg g text")
          .first()
        await expect
          .poll(async () => +(await trainingEventTotal.textContent()).trim())
          .toBeGreaterThan(0)
        await (
          await MyOrg.getNumberTrained()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const numberTrained = await (
          await MyOrg.getNumberTrained()
        )
          .locator("div em")
          .first()
        await expect(numberTrained).toHaveText("Not specified", {
          useInnerText: true
        })
      })
    })
  })
})
