import { expect, test } from "@playwright/test"
import CreateReportPageObject from "../pages/report/createReport.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, CreateReport
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    CreateReport = new CreateReportPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("When creating a report with tasks", () => {
    test("should offer option to search for all unassigned tasks", async () => {
      await CreateReport.open()
      await (await CreateReport.getTasks()).click()
      await (
        await CreateReport.getTaskSearchPopover()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (
        await CreateReport.getTaskSearchFilters()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      const allUnassignedButton =
        await CreateReport.getAllUnassignedTasksFilterButton()
      await expect(allUnassignedButton).not.toHaveCount(0)
    })
    test("should return one option 1.3.C", async () => {
      const testTask = "1.3.C"
      await CreateReport.open()
      await (await CreateReport.getTasks()).click()
      await (await CreateReport.getTasks()).fill(String(testTask))
      await (
        await CreateReport.getTaskSearchPopover()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (
        await CreateReport.getTaskSearchFilters()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (await CreateReport.getAllUnassignedTasksFilterButton()).click()
      const task13C = (await CreateReport.getTasksTable())
        .locator(`//span[contains(text(),"${testTask}")]`)
        .first()
      await expect(task13C).not.toHaveCount(0)
    })
  })
})
