class AdvancedSearch {
  get advancedSearchForm() {
    return browser.$(".advanced-search-form")
  }

  get advancedSearchPopoverTrigger() {
    return browser.$(".advanced-search-form ~ span .asLink")
  }

  get advancedSearchPopover() {
    return browser.$(".advanced-search")
  }

  get anetObjectSearchToggleButtons() {
    return this.advancedSearchPopover.$$(".btn-group > .btn")
  }

  get commonSearchFilter() {
    return this.advancedSearchPopover.$(
      '.advanced-search-content label[for="status"]'
    )
  }

  get pendingVerificationFilter() {
    return this.advancedSearchPopover.$(
      '.advanced-search-content label[for="pendingVerification"]'
    )
  }

  get addFilterButtonText() {
    return this.advancedSearchPopover.$(
      "form > div:nth-child(3) > div:first-child button"
    )
  }

  get addFilterButton() {
    return this.advancedSearchPopover.$("#addFilterDropdown")
  }

  get addFilterPopover() {
    return this.advancedSearchPopover.$(".bp4-popover2-content")
  }

  getSearchFilter(filter) {
    return this.advancedSearchPopover.$(`//div/a[text()='${filter}']`)
  }
}

export default new AdvancedSearch()
