import Page from "../page"

class TaskFilter extends Page {
  async openTaskFilter() {
    const searchLink = await browser.$(
      ".search-popover-target.bp5-popover-target"
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
    const openFilterButton = await browser.$("input[name='taskUuid']")
    await openFilterButton.waitForDisplayed()
    await openFilterButton.click()

    await browser.waitUntil(
      async() =>
        await (await browser.$("#taskUuid-popover tbody")).isDisplayed()
    )
    const taskRows = await browser.$$("#taskUuid-popover tbody > tr")
    return taskRows.length
  }

  async openAllCollpasedTasks() {
    await browser.waitUntil(
      async() =>
        await (await browser.$("#taskUuid-popover tbody")).isDisplayed()
    )
    let expandibleTasks = await browser.$$(
      "#taskUuid-popover .bp5-icon-chevron-right"
    )
    while (expandibleTasks.length > 0) {
      for (const task of expandibleTasks) {
        await task.click()
      }
      expandibleTasks = await browser.$$(
        "#taskUuid-popover .bp5-icon-chevron-right"
      )
    }
  }

  async searchTasks(searchText) {
    const openFilterButton = await browser.$("input[name='taskUuid']")
    await openFilterButton.waitForDisplayed()
    await openFilterButton.click()
    await browser.keys(searchText)
    await browser.waitUntil(
      async() =>
        await (await browser.$("#taskUuid-popover tbody")).isDisplayed()
    )
  }

  async closeTaskFilter() {
    await browser.pause(2000)
    const closeButton = await browser.$(".bp5-icon.bp5-icon-cross")
    await closeButton.waitForDisplayed()
    await closeButton.click()
    await browser.pause(2000)
  }
}

export default new TaskFilter()
