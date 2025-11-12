import Page from "../page"

class SavedSearch extends Page {
  async openOrganizationsFilter() {
    const searchLink = await browser.$(
      ".search-popover-target.bp6-popover-target"
    )
    await searchLink.waitForDisplayed()
    await searchLink.click()

    const reportsButton = await browser.$('.btn-group > button[value="TASKS"]')
    await reportsButton.waitForDisplayed()
    await reportsButton.click()
    await browser.pause(1000) // wait for filters to be updated

    const addFilterButton = await browser.$("#addFilterDropdown")
    await addFilterButton.waitForDisplayed()
    await addFilterButton.click()
    await browser.pause(1000) // wait for filters to be shown

    const withinOrganizationButton = await browser.$("a*=Within Organization")
    await withinOrganizationButton.waitForDisplayed()
    await withinOrganizationButton.click()
  }

  async addOrganizationToFilter(searchText) {
    const openFilterButton = await browser.$("input[name='taskedOrgUuid']")
    await openFilterButton.waitForDisplayed()
    await openFilterButton.click()

    await browser.keys(searchText)
    await browser.pause(1000) // wait for the searchText to be processed
    await browser.waitUntil(
      async () =>
        await (await browser.$("#taskedOrgUuid-popover tbody")).isDisplayed()
    )

    const orgCheckbox = await browser.$(
      "#taskedOrgUuid-popover tr .orgShortName"
    )
    await orgCheckbox.waitForDisplayed()
    await orgCheckbox.click()

    await this.closeOrganizationsFilter()
  }

  async closeOrganizationsFilter() {
    const closeButton = await browser.$(".bp6-icon.bp6-icon-cross")
    await closeButton.waitForDisplayed()
    await closeButton.click()
  }

  async submitSearch() {
    const searchButton = await browser.$("button[type='submit']")
    await searchButton.waitForDisplayed()
    await searchButton.click()
  }

  async saveSearch() {
    const saveButton = await browser.$("#saveSearchButton")
    await saveButton.waitForDisplayed()
    await saveButton.click()
  }

  async saveSearchModal() {
    const saveButton = await browser.$("#saveSearchModalSubmitButton")
    await saveButton.waitForDisplayed()
    await saveButton.click()
  }

  async getToastMessages() {
    const toastMessages = await browser.$$(".Toastify > div > div")
    if (toastMessages.length === 0) {
      return []
    }
    return toastMessages.map(async toastMessage => await toastMessage.getText())
  }

  async getDeleteSavedSearchButton() {
    return browser.$(".btn-danger")
  }

  async getDeleteConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  async confirmDelete() {
    await (await this.getDeleteConfirmButton()).waitForExist()
    await (await this.getDeleteConfirmButton()).waitForDisplayed()
    await (await this.getDeleteConfirmButton()).click()
  }

  async getNoSavedSearches() {
    return browser.$("fieldset p.mb-0")
  }
}

export default new SavedSearch()
