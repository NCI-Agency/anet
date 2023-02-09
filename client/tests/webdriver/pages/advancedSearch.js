class AdvancedSearch {
  getAdvancedSearchForm() {
    return browser.$(".advanced-search-form")
  }

  getAdvancedSearchPopoverTrigger() {
    return browser.$(".advanced-search-form ~ span .asLink")
  }

  getAdvancedSearchPopover() {
    return browser.$(".advanced-search")
  }

  getAnetObjectSearchToggleButtons() {
    return this.getAdvancedSearchPopover().$$(".btn-group > .btn")
  }

  getCommonSearchFilter() {
    return this.getAdvancedSearchPopover().$(
      '.advanced-search-content label[for="status"]'
    )
  }

  getPendingVerificationFilter() {
    return this.getAdvancedSearchPopover().$(
      '.advanced-search-content label[for="pendingVerification"]'
    )
  }

  getAddFilterButtonText() {
    return this.getAdvancedSearchPopover().$(
      "form > div:nth-child(3) > div:first-child button"
    )
  }

  getAddFilterButton() {
    return this.getAdvancedSearchPopover().$("#addFilterDropdown")
  }

  getAddFilterPopover() {
    return this.getAdvancedSearchPopover().$(".bp4-popover2-content")
  }

  getSearchFilter(filter) {
    return this.getAdvancedSearchPopover().$(`//div/a[text()='${filter}']`)
  }
}

export default new AdvancedSearch()
