import { expect } from "@playwright/test"
import CreateReport from "../pages/report/createReport.page.js"
import { test, waitFor } from "../support.js"

test.describe("When creating a report with tasks", () => {
  test("should offer option to search for all unassigned tasks", async () => {
    await CreateReport.open()
    await (await CreateReport.getTasks()).click()
    await waitFor(await CreateReport.getTaskSearchPopover(), "visible")
    await waitFor(await CreateReport.getTaskSearchFilters(), "visible")
    const allUnassignedButton =
      await CreateReport.getAllUnassignedTasksFilterButton()
    await expect(allUnassignedButton).not.toHaveCount(0)
  })
  test("should return one option 1.3.C", async () => {
    const testTask = "1.3.C"
    await CreateReport.open()
    await (await CreateReport.getTasks()).click()
    await (await CreateReport.getTasks()).fill(String(testTask))
    await waitFor(await CreateReport.getTaskSearchPopover(), "visible")
    await waitFor(await CreateReport.getTaskSearchFilters(), "visible")
    await (await CreateReport.getAllUnassignedTasksFilterButton()).click()
    const task13C = (await CreateReport.getTasksTable())
      .locator(`//span[contains(text(),"${testTask}")]`)
      .first()
    await expect(task13C).not.toHaveCount(0)
  })
})
