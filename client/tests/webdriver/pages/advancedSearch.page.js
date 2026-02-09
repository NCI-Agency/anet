class AdvancedSearch {
  async getAdvancedSearchForm() {
    return browser.$(".advanced-search-form")
  }

  async getAdvancedSearchPopoverTrigger() {
    return browser.$(".advanced-search-form ~ span .asLink")
  }

  async getAdvancedSearchPopover() {
    return browser.$(".advanced-search")
  }

  async getAnetObjectSearchToggleButtons() {
    return (await this.getAdvancedSearchPopover()).$$(".btn-group > .btn")
  }

  async getObjectTypeButton(objectType) {
    return (await this.getAdvancedSearchPopover()).$(
      `.btn-group > .btn[value="${objectType}"]`
    )
  }

  async selectObjectType(objectType) {
    const button = await this.getObjectTypeButton(objectType)
    if (await button.isExisting()) {
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
    return (await this.getAdvancedSearchPopover()).$(
      '.advanced-search-content label[for="status"]'
    )
  }

  async getPendingVerificationFilter() {
    return (await this.getAdvancedSearchPopover()).$(
      '.advanced-search-content label[for="pendingVerification"]'
    )
  }

  async getAddFilterButtonText() {
    return (await this.getAdvancedSearchPopover()).$(
      "form > div:nth-child(3) > div:first-child button"
    )
  }

  async getAddFilterButton() {
    return (await this.getAdvancedSearchPopover()).$("#addFilterDropdown")
  }

  async getAddFilterPopover() {
    return (await this.getAdvancedSearchPopover()).$(
      'div[aria-labelledby="addFilterDropdown"] ul'
    )
  }

  async getSearchFilter(filter) {
    return (await this.getAddFilterPopover()).$(`.//a[text()="${filter}"]`)
  }

  async getFilterRowByLabel(labelText) {
    return (await this.getAdvancedSearchPopover()).$(
      `.//label[normalize-space()="${labelText}"]/ancestor::div[contains(@class,"form-group")]`
    )
  }

  async getRemoveButtonForFilter(labelText) {
    const row = await this.getFilterRowByLabel(labelText)
    return row.$(".remove-button")
  }

  async getSearchButton() {
    return (await this.getAdvancedSearchPopover()).$('button[type="submit"]')
  }
}

export default new AdvancedSearch()
