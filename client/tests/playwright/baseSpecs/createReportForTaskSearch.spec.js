import { expect, test } from "@playwright/test"
import CreateReportPageObject from "../pages/report/createReport.page.js"

test.describe(() => {
  let CreateReport
  test.beforeEach(async ({ page }) => {
    CreateReport = new CreateReportPageObject(page)
  })
  test("When creating a report with tasks", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 2)

    await test.step(
      "should offer option to search for all unassigned tasks",
      async () => {
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
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "should return one option 1.3.C",
      async () => {
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
          .getByText(`${testTask}`, { exact: false })
          .first()
        await expect(task13C).not.toHaveCount(0)
      },
      { timeout: stepTimeout }
    )
  })
})
