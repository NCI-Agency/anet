import Page from "../page"

class LocationFilter extends Page {
  async openLocationFilter() {
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

    const withinLocationButton = browser.$("a*=Within Location")
    await (await withinLocationButton).waitForDisplayed()
    await (await withinLocationButton).click()
  }

  async getLocationCount() {
    const openFilterButton = browser.$("input[name='locationUuid']")
    await (await openFilterButton).waitForDisplayed()
    await (await openFilterButton).click()

    await browser.waitUntil(
      async () =>
        await (await browser.$("#locationUuid-popover tbody")).isDisplayed()
    )
    const locationRows = await browser.$$("#locationUuid-popover tbody > tr")
    return locationRows.length
  }

  async openAllCollapsedLocations() {
    await browser.waitUntil(
      async () =>
        await (await browser.$("#locationUuid-popover tbody")).isDisplayed()
    )
    let expandibleLocations = await browser.$$(
      "#locationUuid-popover .bp6-icon-chevron-right"
    )
    while (expandibleLocations.length > 0) {
      const location = expandibleLocations[0]
      await (await location).click()
      expandibleLocations = await browser.$$(
        "#locationUuid-popover .bp6-icon-chevron-right"
      )
    }
  }

  async searchLocations(searchText) {
    const openFilterButton = browser.$("input[name='locationUuid']")
    await (await openFilterButton).waitForDisplayed()
    await (await openFilterButton).click()
    await browser.keys(searchText)
    await browser.pause(1000) // wait for the searchText to be processed
    await browser.waitUntil(
      async () =>
        await (await browser.$("#locationUuid-popover tbody")).isDisplayed()
    )
  }

  async closeLocationFilter() {
    const closeButton = browser.$(".bp6-icon.bp6-icon-cross")
    await (await closeButton).waitForDisplayed()
    await (await closeButton).click()
  }
}

export default new LocationFilter()
