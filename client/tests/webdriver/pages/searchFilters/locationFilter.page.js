import Page from "../page"

class LocationFilter extends Page {
  async openLocationFilter() {
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

    const withinLocationButton = await browser.$("a*=Within Location")
    await withinLocationButton.click()
  }

  async getLocationCount() {
    const openFilterButton = await browser.$("input[name='locationUuid']")
    await openFilterButton.waitForDisplayed()
    await openFilterButton.click()

    await browser.waitUntil(
      async() =>
        await (await browser.$("#locationUuid-popover tbody")).isDisplayed()
    )
    const locationRows = await browser.$$("#locationUuid-popover tbody > tr")
    return locationRows.length
  }

  async openAllCollapsedLocations() {
    await browser.waitUntil(
      async() =>
        await (await browser.$("#locationUuid-popover tbody")).isDisplayed()
    )
    let expandibleLocations = await browser.$$(
      "#locationUuid-popover .bp6-icon-chevron-right"
    )
    while (expandibleLocations.length > 0) {
      for (const location of expandibleLocations) {
        await location.click()
      }
      expandibleLocations = await browser.$$(
        "#locationUuid-popover .bp6-icon-chevron-right"
      )
    }
  }

  async searchLocations(searchText) {
    const openFilterButton = await browser.$("input[name='locationUuid']")
    await openFilterButton.waitForDisplayed()
    await openFilterButton.click()
    await browser.keys(searchText)
    await browser.pause(1000) // wait for the searchText to be processed
    await browser.waitUntil(
      async() =>
        await (await browser.$("#locationUuid-popover tbody")).isDisplayed()
    )
  }

  async closeLocationFilter() {
    const closeButton = await browser.$(".bp6-icon.bp6-icon-cross")
    await closeButton.waitForDisplayed()
    await closeButton.click()
  }
}

export default new LocationFilter()
