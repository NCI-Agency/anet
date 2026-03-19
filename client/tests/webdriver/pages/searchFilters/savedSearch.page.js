import Page from "../page"

class SavedSearch extends Page {
  async openOrganizationsFilter() {
    const searchLink = browser.$(".search-popover-target.bp6-popover-target")
    await (await searchLink).waitForDisplayed()
    await (await searchLink).click()

    const reportsButton = browser.$('.btn-group > button[value="TASKS"]')
    await (await reportsButton).waitForDisplayed()
    await (await reportsButton).click()
    await browser.pause(1500) // wait for filters to be updated

    const addFilterButton = browser.$("#addFilterDropdown")
    await (await addFilterButton).waitForDisplayed()
    await (await addFilterButton).click()
    await browser.pause(1500) // wait for filters to be shown

    const withinOrganizationButton = browser.$("a*=Within Organization")
    await (await withinOrganizationButton).waitForDisplayed()
    await (await withinOrganizationButton).click()
  }

  async addOrganizationToFilter(searchText) {
    const openFilterButton = browser.$("input[name='taskedOrgUuid']")
    await (await openFilterButton).waitForDisplayed()
    await (await openFilterButton).click()

    await browser.keys(searchText)
    await browser.pause(1000) // wait for the searchText to be processed
    await browser.waitUntil(
      async () =>
        await (await browser.$("#taskedOrgUuid-popover tbody")).isDisplayed()
    )

    const orgCheckbox = browser.$("#taskedOrgUuid-popover tr .orgShortName")
    await (await orgCheckbox).waitForDisplayed()
    await (await orgCheckbox).click()

    await this.closeOrganizationsFilter()
  }

  async closeOrganizationsFilter() {
    const closeButton = browser.$(".bp6-icon.bp6-icon-cross")
    await (await closeButton).waitForDisplayed()
    await (await closeButton).click()
  }

  async submitSearch() {
    const searchButton = browser.$("button[type='submit']")
    await (await searchButton).waitForDisplayed()
    await (await searchButton).click()
  }

  async saveSearch() {
    const saveButton = browser.$("#saveSearchButton")
    await (await saveButton).waitForDisplayed()
    await (await saveButton).click()
  }

  async saveSearchModal() {
    const saveButton = browser.$("#saveSearchModalSubmitButton")
    await (await saveButton).waitForDisplayed()
    await (await saveButton).click()
  }

  async getToastMessages() {
    const toastMessages = await browser.$$(".Toastify > div > div")
    if (toastMessages.length === 0) {
      return []
    }
    return toastMessages.map(
      async toastMessage => await (await toastMessage).getText()
    )
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
