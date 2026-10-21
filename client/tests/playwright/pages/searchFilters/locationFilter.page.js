import { expect } from "@playwright/test"
import { currentPage, typeKeys } from "../../support.js"
import Page from "../page.js"

class LocationFilter extends Page {
  async openLocationFilter() {
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

    const withinLocationButton = currentPage()
      .getByRole("button", {
        name: "Within Location",
        exact: false
      })
      .first()
    await (await withinLocationButton).click()
  }

  async openLocationPopover() {
    await currentPage().locator("input[name='locationUuid']").click()
  }

  async getLocationRows() {
    return currentPage().locator("#locationUuid-popover tbody > tr")
  }

  async openAllCollapsedLocations() {
    await expect(
      currentPage().locator("#locationUuid-popover tbody").first()
    ).toBeVisible()
    let expandibleLocations = await currentPage()
      .locator("#locationUuid-popover .bp6-icon-chevron-right")
      .all()
    while (expandibleLocations.length > 0) {
      const location = expandibleLocations[0]
      await (await location).click()
      expandibleLocations = await currentPage()
        .locator("#locationUuid-popover .bp6-icon-chevron-right")
        .all()
    }
  }

  async searchLocations(searchText) {
    const openFilterButton = currentPage()
      .locator("input[name='locationUuid']")
      .first()
    await (await openFilterButton).click()
    await typeKeys(searchText)
    // wait for the searchText to be processed
    await expect(
      currentPage().locator("#locationUuid-popover tbody").first()
    ).toBeVisible()
  }

  async closeLocationFilter() {
    const closeButton = currentPage()
      .locator(".bp6-icon.bp6-icon-cross")
      .first()
    await (await closeButton).click()
  }
}

export default new LocationFilter()
