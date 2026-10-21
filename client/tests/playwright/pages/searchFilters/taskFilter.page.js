import { expect } from "@playwright/test"
import { currentPage, typeKeys } from "../../support.js"
import Page from "../page.js"

class TaskFilter extends Page {
  async addTaskFilter() {
    const searchLink = currentPage()
      .locator(".search-popover-target.bp6-popover-target")
      .first()
    await (await searchLink).click()
    // wait for filters to be shown

    const reportsButton = currentPage()
      .locator('.btn-group > button[value="REPORTS"]')
      .first()
    await (await reportsButton).click()
    // wait for filters to be updated

    const removeFilterButtons = currentPage().locator(
      '.form-group button[title="Remove this filter"]'
    )
    while (await removeFilterButtons.count()) {
      await removeFilterButtons.first().click()
    }
    // wait for filters to be updated

    const addFilterButton = currentPage().locator("#addFilterDropdown").first()
    await (await addFilterButton).click()
    // wait for filters to be shown

    const withinObjectiveButton = currentPage()
      .getByRole("button", {
        name: "Within Objective",
        exact: false
      })
      .first()
    await (await withinObjectiveButton).click()
  }

  async getTaskRows() {
    return currentPage().locator("#taskUuid-popover tbody > tr")
  }

  async openTaskFilter() {
    const openFilterButton = currentPage()
      .locator("input[name='taskUuid']")
      .first()
    await (await openFilterButton).click()
  }

  async openAllCollapsedTasks() {
    await expect(
      currentPage().locator("#taskUuid-popover tbody").first()
    ).toBeVisible()
    let expandibleTasks = await currentPage()
      .locator("#taskUuid-popover .bp6-icon-chevron-right")
      .all()
    while (expandibleTasks.length > 0) {
      const task = expandibleTasks[0]
      await (await task).click()
      expandibleTasks = await currentPage()
        .locator("#taskUuid-popover .bp6-icon-chevron-right")
        .all()
    }
  }

  async openFirstLevelCollapsedTasks() {
    await expect(
      currentPage().locator("#taskUuid-popover tbody").first()
    ).toBeVisible()
    const expandibleTasks = await currentPage()
      .locator("#taskUuid-popover .bp6-icon-chevron-right")
      .all()
    for (const task of expandibleTasks) {
      await (await task).click()
    }
  }

  async searchTasks(searchText) {
    await typeKeys(searchText)
    // wait for the searchText to be processed
    await expect(
      currentPage().locator("#taskUuid-popover tbody").first()
    ).toBeVisible()
  }

  async closeTaskFilter() {
    const closeButton = currentPage()
      .locator(".bp6-icon.bp6-icon-cross")
      .first()
    await (await closeButton).click()
  }

  async clickInclInactiveCheckbox() {
    const inclInactiveCheckbox = currentPage()
      .locator("#taskUuid-inclInactive")
      .first()
    await (await inclInactiveCheckbox).click()
  }
}

export default new TaskFilter()
