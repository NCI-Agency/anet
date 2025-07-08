import { expect } from "chai"
import CreateReport from "../pages/report/createReport.page"

describe("When creating a report with tasks", () => {
  it("should offer option to search for all unassigned tasks", async() => {
    await CreateReport.open()
    await (await CreateReport.getTasks()).click()
    await (await CreateReport.getTaskSearchPopover()).waitForExist()
    await (await CreateReport.getTaskSearchPopover()).waitForDisplayed()
    await (await CreateReport.getTaskSearchFilters()).waitForExist()
    await (await CreateReport.getTaskSearchFilters()).waitForDisplayed()
    const allUnassignedButton =
      await CreateReport.getAllUnassignedTasksFilterButton()
    // eslint-disable-next-line no-unused-expressions
    expect(await allUnassignedButton.isExisting()).to.be.true
  })
  it("should return one option 1.3.C", async() => {
    await CreateReport.open()
    await (await CreateReport.getTasks()).click()
    await (await CreateReport.getTaskSearchPopover()).waitForExist()
    await (await CreateReport.getTaskSearchPopover()).waitForDisplayed()
    await (await CreateReport.getTaskSearchFilters()).waitForExist()
    await (await CreateReport.getTaskSearchFilters()).waitForDisplayed()
    await (
      await CreateReport.getAllUnassignedTasksFilterButton()
    ).waitForExist()
    await (
      await CreateReport.getAllUnassignedTasksFilterButton()
    ).waitForDisplayed()
    await (await CreateReport.getAllUnassignedTasksFilterButton()).click()
    const task13C = (await CreateReport.getTasksTable()).$(
      ".bp6-popover-target=1.3.C"
    )
    // eslint-disable-next-line no-unused-expressions
    expect(await task13C.isExisting()).to.be.true
  })
})
