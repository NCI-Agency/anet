import { currentPage, typeKeys, waitFor, waitUntil } from "../../support.js"
import Page from "../page.js"

class TaskFilter extends Page {
  async addTaskFilter() {
    const searchLink = currentPage()
      .locator(".search-popover-target.bp6-popover-target")
      .first()
    await waitFor(await searchLink, "visible")
    await (await searchLink).click()
    // wait for filters to be shown

    const reportsButton = currentPage()
      .locator('.btn-group > button[value="REPORTS"]')
      .first()
    await waitFor(await reportsButton, "visible")
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
    await waitFor(await addFilterButton, "visible")
    await (await addFilterButton).click()
    // wait for filters to be shown

    const withinObjectiveButton = currentPage()
      .getByRole("button", {
        name: "Within Objective",
        exact: false
      })
      .first()
    await waitFor(await withinObjectiveButton, "visible")
    await (await withinObjectiveButton).click()
  }

  async getTaskCount() {
    await waitUntil(
      async () =>
        await (
          await currentPage().locator("#taskUuid-popover tbody").first()
        ).isVisible()
    )
    const taskRows = await currentPage()
      .locator("#taskUuid-popover tbody > tr")
      .all()
    return taskRows.length
  }

  async openTaskFilter() {
    const openFilterButton = currentPage()
      .locator("input[name='taskUuid']")
      .first()
    await waitFor(await openFilterButton, "visible")
    await (await openFilterButton).click()
  }

  async openAllCollapsedTasks() {
    await waitUntil(
      async () =>
        await (
          await currentPage().locator("#taskUuid-popover tbody").first()
        ).isVisible()
    )
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
    await waitUntil(
      async () =>
        await (
          await currentPage().locator("#taskUuid-popover tbody").first()
        ).isVisible()
    )
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
    await waitUntil(
      async () =>
        await (
          await currentPage().locator("#taskUuid-popover tbody").first()
        ).isVisible()
    )
  }

  async closeTaskFilter() {
    const closeButton = currentPage()
      .locator(".bp6-icon.bp6-icon-cross")
      .first()
    await waitFor(await closeButton, "visible")
    await (await closeButton).click()
  }

  async clickInclInactiveCheckbox() {
    const inclInactiveCheckbox = currentPage()
      .locator("#taskUuid-inclInactive")
      .first()
    await waitFor(await inclInactiveCheckbox, "visible")
    await (await inclInactiveCheckbox).click()
  }
}

export default new TaskFilter()
