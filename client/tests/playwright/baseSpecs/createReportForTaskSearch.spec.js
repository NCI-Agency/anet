import { expect, test } from "@playwright/test"
import { useSerialScenario } from "../pages/page.js"
import CreateReportPageObject from "../pages/report/createReport.page.js"

test.describe(() => {
  let CreateReport
  useSerialScenario(page => {
    CreateReport = new CreateReportPageObject(page)
  })
  test.describe("When creating a report with tasks", () => {
    test("should offer option to search for all unassigned tasks", async () => {
      await CreateReport.open()
      await (await CreateReport.getTasks()).click()
      await (
        await CreateReport.getTaskSearchPopover()
      ).waitFor({
        state: "visible"
      })
      await (
        await CreateReport.getTaskSearchFilters()
      ).waitFor({
        state: "visible"
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
        state: "visible"
      })
      await (
        await CreateReport.getTaskSearchFilters()
      ).waitFor({
        state: "visible"
      })
      await (await CreateReport.getAllUnassignedTasksFilterButton()).click()
      const task13C = (await CreateReport.getTasksTable())
        .getByText(`${testTask}`)
        .first()
      await expect(task13C).not.toHaveCount(0)
    })
  })
})
