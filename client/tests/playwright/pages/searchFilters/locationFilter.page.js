import { expect } from "@playwright/test"
import Page from "../page.js"

class LocationFilter extends Page {
  async openLocationFilter() {
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

    const withinLocationButton = this.page
      .getByRole("button", {
        name: "Within Location",
        exact: false
      })
      .first()
    await (await withinLocationButton).click()
  }

  async openLocationPopover() {
    await this.page.locator("input[name='locationUuid']").click()
  }

  async getLocationRows() {
    return this.page.locator("#locationUuid-popover tbody > tr")
  }

  async openAllCollapsedLocations() {
    await expect(
      this.page.locator("#locationUuid-popover tbody").first()
    ).toBeVisible()
    let expandibleLocations = await this.page
      .locator("#locationUuid-popover .bp6-icon-chevron-right")
      .all()
    while (expandibleLocations.length > 0) {
      const location = expandibleLocations[0]
      await (await location).click()
      expandibleLocations = await this.page
        .locator("#locationUuid-popover .bp6-icon-chevron-right")
        .all()
    }
  }

  async searchLocations(searchText) {
    const openFilterButton = this.page
      .locator("input[name='locationUuid']")
      .first()
    await (await openFilterButton).click()
    await this.page.keyboard.insertText(String(searchText))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    } // wait for the searchText to be processed
    await expect(
      this.page.locator("#locationUuid-popover tbody").first()
    ).toBeVisible()
  }

  async closeLocationFilter() {
    const closeButton = this.page.locator(".bp6-icon.bp6-icon-cross").first()
    await (await closeButton).click()
  }
}
export default LocationFilter
