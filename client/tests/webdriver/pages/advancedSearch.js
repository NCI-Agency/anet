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
    return (await this.getAdvancedSearchPopover()).$(".bp5-popover-content")
  }

  async getSearchFilter(filter) {
    return (await this.getAdvancedSearchPopover()).$(
      `//div/a[text()='${filter}']`
    )
  }
}

export default new AdvancedSearch()
