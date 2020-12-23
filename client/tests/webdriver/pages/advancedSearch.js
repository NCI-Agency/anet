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
      "form > div:nth-child(4) > div:first-child"
    )
  }

  get addFilterButton() {
    return this.addFilterButtonText.$("button")
  }

  get addFilterPopover() {
    return this.addFilterButtonText.$(".bp3-popover-content")
  }
}

export default new AdvancedSearch()
