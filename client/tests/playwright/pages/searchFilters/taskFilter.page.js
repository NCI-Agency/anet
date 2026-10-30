import { expect } from "@playwright/test"
import Page from "../page.js"

class TaskFilter extends Page {
  async addTaskFilter() {
    const searchLink = this.page
      .locator(".search-popover-target.bp6-popover-target")
      .first()
    await (await searchLink).click()
    // wait for filters to be shown

    const reportsButton = this.page
      .locator('.btn-group > button[value="REPORTS"]')
      .first()
    await (await reportsButton).click()
    // wait for filters to be updated

    const removeFilterButtons = this.page.locator(
      '.form-group button[title="Remove this filter"]'
    )
    while (await removeFilterButtons.count()) {
      await removeFilterButtons.first().click()
    }
    // wait for filters to be updated

    const addFilterButton = this.page.locator("#addFilterDropdown").first()
    await (await addFilterButton).click()
    // wait for filters to be shown

    const withinObjectiveButton = this.page
      .getByRole("button", {
        name: "Within Objective",
        exact: false
      })
      .first()
    await (await withinObjectiveButton).click()
  }

  async getTaskRows() {
    return this.page.locator("#taskUuid-popover tbody > tr")
  }

  async openTaskFilter() {
    const openFilterButton = this.page.locator("input[name='taskUuid']").first()
    await (await openFilterButton).click()
  }

  async openAllCollapsedTasks() {
    await expect(
      this.page.locator("#taskUuid-popover tbody").first()
    ).toBeVisible()
    let expandibleTasks = await this.page
      .locator("#taskUuid-popover .bp6-icon-chevron-right")
      .all()
    while (expandibleTasks.length > 0) {
      const task = expandibleTasks[0]
      await (await task).click()
      expandibleTasks = await this.page
        .locator("#taskUuid-popover .bp6-icon-chevron-right")
        .all()
    }
  }

  async openFirstLevelCollapsedTasks() {
    await expect(
      this.page.locator("#taskUuid-popover tbody").first()
    ).toBeVisible()
    const expandibleTasks = await this.page
      .locator("#taskUuid-popover .bp6-icon-chevron-right")
      .all()
    for (const task of expandibleTasks) {
      await (await task).click()
    }
  }

  async searchTasks(searchText) {
    await this.page.keyboard.insertText(String(searchText))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    } // wait for the searchText to be processed
    await expect(
      this.page.locator("#taskUuid-popover tbody").first()
    ).toBeVisible()
  }

  async closeTaskFilter() {
    const closeButton = this.page.locator(".bp6-icon.bp6-icon-cross").first()
    await (await closeButton).click()
  }

  async clickInclInactiveCheckbox() {
    const inclInactiveCheckbox = this.page
      .locator("#taskUuid-inclInactive")
      .first()
    await (await inclInactiveCheckbox).click()
  }
}
export default TaskFilter
