import { currentPage } from "../support.js"

class AdvancedSearch {
  async getAdvancedSearchForm() {
    return currentPage().locator(".advanced-search-form").first()
  }

  async getAdvancedSearchPopoverTrigger() {
    return currentPage().locator(".advanced-search-form ~ span .asLink").first()
  }

  async getAdvancedSearchPopover() {
    return currentPage().locator(".advanced-search").first()
  }

  async getAnetObjectSearchToggleButtons() {
    return (await this.getAdvancedSearchPopover())
      .locator(".btn-group > .btn")
      .all()
  }

  async getObjectTypeButton(objectType) {
    return (await this.getAdvancedSearchPopover())
      .locator(`.btn-group > .btn[value="${objectType}"]`)
      .first()
  }

  async selectObjectType(objectType) {
    const button = await this.getObjectTypeButton(objectType)
    if ((await button.count()) > 0) {
      const isDisabled =
        (await button.getAttribute("disabled")) !== null ||
        !(await button.isEnabled())
      if (isDisabled) {
        return
      }
      await button.click()
    }
  }

  async getCommonSearchFilter() {
    return (await this.getAdvancedSearchPopover())
      .locator('.advanced-search-content label[for="status"]')
      .first()
  }

  async getPendingVerificationFilter() {
    return (await this.getAdvancedSearchPopover())
      .locator('.advanced-search-content label[for="pendingVerification"]')
      .first()
  }

  async getAddFilterButtonText() {
    return (await this.getAdvancedSearchPopover())
      .locator("form > div:nth-child(3) > div:first-child button")
      .first()
  }

  async getAddFilterButton() {
    return (await this.getAdvancedSearchPopover())
      .locator("#addFilterDropdown")
      .first()
  }

  async getAddFilterPopover() {
    return (await this.getAdvancedSearchPopover())
      .locator('div[aria-labelledby="addFilterDropdown"] ul')
      .first()
  }

  async getSearchFilter(filter) {
    return (await this.getAddFilterPopover())
      .locator(`xpath=.//a[text()="${filter}"]`)
      .first()
  }

  async getFilterRowByLabel(labelText) {
    return (await this.getAdvancedSearchPopover())
      .locator(
        `xpath=.//label[normalize-space()="${labelText}"]/ancestor::div[contains(@class,"form-group")]`
      )
      .first()
  }

  async getRemoveButtonForFilter(labelText) {
    const row = await this.getFilterRowByLabel(labelText)
    return row.locator(".remove-button").first()
  }

  async getSearchButton() {
    return (await this.getAdvancedSearchPopover())
      .locator('button[type="submit"]')
      .first()
  }
}

export default new AdvancedSearch()
