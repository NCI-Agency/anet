import { expect } from "@playwright/test"
import Page from "../page.js"

class SavedSearch extends Page {
  async openOrganizationsFilter() {
    const searchLink = this.page
      .locator(".search-popover-target.bp6-popover-target")
      .first()
    await (await searchLink).click()
    // wait for filters to be shown

    const tasksButton = this.page
      .locator('.btn-group > button[value="TASKS"]')
      .first()
    await (await tasksButton).click()
    // wait for filters to be updated

    const addFilterButton = this.page.locator("#addFilterDropdown").first()
    await (await addFilterButton).click()
    // wait for filters to be shown

    const withinOrganizationButton = this.page
      .getByRole("button", {
        name: "Within Organization",
        exact: false
      })
      .first()
    await (await withinOrganizationButton).click()
  }

  async addOrganizationToFilter(searchText) {
    const openFilterButton = this.page
      .locator("input[name='taskedOrgUuid']")
      .first()
    await (await openFilterButton).click()
    await this.page.keyboard.insertText(String(searchText))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
    await expect(
      this.page.locator("#taskedOrgUuid-popover tbody tr").first()
    ).toContainText(searchText, {
      useInnerText: true
    })
    // wait for the searchText to be processed
    await expect
      .poll(
        async () =>
          await (
            await this.page.locator("#taskedOrgUuid-popover tbody").first()
          ).isVisible(),
        {
          timeout: 10000
        }
      )
      .toBeTruthy()
    const orgCheckbox = this.page
      .locator("#taskedOrgUuid-popover tr .orgShortName")
      .first()
    await (await orgCheckbox).click()
    await this.closeOrganizationsFilter()
  }

  async closeOrganizationsFilter() {
    const closeButton = this.page.locator(".bp6-icon.bp6-icon-cross").first()
    await (await closeButton).click()
  }

  async submitSearch() {
    const searchButton = this.page.locator("button[type='submit']").first()
    await (await searchButton).click()
  }

  async saveSearch() {
    const saveButton = this.page.locator("#saveSearchButton").first()
    await (await saveButton).click()
  }

  async saveSearchModal() {
    const saveButton = this.page.locator("#saveSearchModalSubmitButton").first()
    await (await saveButton).click()
  }

  async getToastMessages() {
    const toastMessages = await this.page.locator(".Toastify > div > div").all()
    if (toastMessages.length === 0) {
      return []
    }
    return Promise.all(
      toastMessages.map(async toastMessage =>
        (await (await toastMessage).innerText()).trim()
      )
    )
  }

  async getDeleteSavedSearchButton() {
    return this.page.locator(".btn-danger").first()
  }

  async getDeleteConfirmButton() {
    return this.page.locator('//button[text()="Yes, I am sure"]').first()
  }

  async confirmDelete() {
    await (await this.getDeleteConfirmButton()).click()
  }

  async getNoSavedSearches() {
    return this.page.locator("fieldset p.mb-0").first()
  }
}
export default SavedSearch
