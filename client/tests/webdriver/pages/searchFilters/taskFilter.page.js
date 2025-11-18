import Page from "../page"

class TaskFilter extends Page {
  async addTaskFilter() {
    const searchLink = await browser.$(
      ".search-popover-target.bp6-popover-target"
    )
    await searchLink.waitForDisplayed()
    await searchLink.click()

    const reportsButton = await browser.$(
      '.btn-group > button[value="REPORTS"]'
    )
    await reportsButton.waitForDisplayed()
    await reportsButton.click()

    const removeFilterButtons = await browser.$$(
      '.form-group button[title="Remove this filter"]'
    )
    for (const removeFilterButton of removeFilterButtons) {
      await removeFilterButton.waitForDisplayed()
      await removeFilterButton.click()
    }

    const addFilterButton = await browser.$("#addFilterDropdown")
    await addFilterButton.waitForDisplayed()
    await addFilterButton.click()

    const withinObjectiveButton = await browser.$("a*=Within Objective")
    await withinObjectiveButton.click()
  }

  async getTaskCount() {
    await browser.waitUntil(
      async () =>
        await (await browser.$("#taskUuid-popover tbody")).isDisplayed()
    )
    const taskRows = await browser.$$("#taskUuid-popover tbody > tr")
    return taskRows.length
  }

  async openTaskFilter() {
    const openFilterButton = await browser.$("input[name='taskUuid']")
    await openFilterButton.waitForDisplayed()
    await openFilterButton.click()
  }

  async openAllCollapsedTasks() {
    await browser.waitUntil(
      async () =>
        await (await browser.$("#taskUuid-popover tbody")).isDisplayed()
    )
    let expandibleTasks = await browser.$$(
      "#taskUuid-popover .bp6-icon-chevron-right"
    )
    while (expandibleTasks.length > 0) {
      const task = await expandibleTasks[0]
      await task.click()
      expandibleTasks = await browser.$$(
        "#taskUuid-popover .bp6-icon-chevron-right"
      )
    }
  }

  async openFirstLevelCollapsedTasks() {
    await browser.waitUntil(
      async () =>
        await (await browser.$("#taskUuid-popover tbody")).isDisplayed()
    )
    const expandibleTasks = await browser.$$(
      "#taskUuid-popover .bp6-icon-chevron-right"
    )
    for (const task of expandibleTasks) {
      await task.click()
    }
  }

  async searchTasks(searchText) {
    await browser.keys(searchText)
    await browser.pause(1000) // wait for the searchText to be processed
    await browser.waitUntil(
      async () =>
        await (await browser.$("#taskUuid-popover tbody")).isDisplayed()
    )
  }

  async closeTaskFilter() {
    const closeButton = await browser.$(".bp6-icon.bp6-icon-cross")
    await closeButton.waitForDisplayed()
    await closeButton.click()
  }

  async clickInclInactiveCheckbox() {
    const inclInactiveCheckbox = await browser.$("#taskUuid-inclInactive")
    await inclInactiveCheckbox.click()
  }
}

export default new TaskFilter()
