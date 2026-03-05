import Page from "../page"

class TaskFilter extends Page {
  async addTaskFilter() {
    const searchLink = browser.$(".search-popover-target.bp6-popover-target")
    await (await searchLink).waitForDisplayed()
    await (await searchLink).click()

    const reportsButton = browser.$('.btn-group > button[value="REPORTS"]')
    await (await reportsButton).waitForDisplayed()
    await (await reportsButton).click()

    const removeFilterButtons = await browser.$$(
      '.form-group button[title="Remove this filter"]'
    )
    for (const removeFilterButton of removeFilterButtons) {
      await (await removeFilterButton).waitForDisplayed()
      await (await removeFilterButton).click()
    }

    const addFilterButton = browser.$("#addFilterDropdown")
    await (await addFilterButton).waitForDisplayed()
    await (await addFilterButton).click()

    const withinObjectiveButton = browser.$("a*=Within Objective")
    await (await withinObjectiveButton).waitForDisplayed()
    await (await withinObjectiveButton).click()
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
    const openFilterButton = browser.$("input[name='taskUuid']")
    await (await openFilterButton).waitForDisplayed()
    await (await openFilterButton).click()
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
      const task = expandibleTasks[0]
      await (await task).click()
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
      await (await task).click()
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
    const closeButton = browser.$(".bp6-icon.bp6-icon-cross")
    await (await closeButton).waitForDisplayed()
    await (await closeButton).click()
  }

  async clickInclInactiveCheckbox() {
    const inclInactiveCheckbox = browser.$("#taskUuid-inclInactive")
    await (await inclInactiveCheckbox).waitForDisplayed()
    await (await inclInactiveCheckbox).click()
  }
}

export default new TaskFilter()
