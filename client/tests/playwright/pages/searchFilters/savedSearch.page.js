import { expect as pwExpect } from "@playwright/test"
import { currentPage, typeKeys, waitFor, waitUntil } from "../../support.js"
import Page from "../page.js"

class SavedSearch extends Page {
  async openOrganizationsFilter() {
    const searchLink = currentPage()
      .locator(".search-popover-target.bp6-popover-target")
      .first()
    await waitFor(await searchLink, "visible")
    await (await searchLink).click()
    // wait for filters to be shown

    const tasksButton = currentPage()
      .locator('.btn-group > button[value="TASKS"]')
      .first()
    await waitFor(await tasksButton, "visible")
    await (await tasksButton).click()
    // wait for filters to be updated

    const addFilterButton = currentPage().locator("#addFilterDropdown").first()
    await waitFor(await addFilterButton, "visible")
    await (await addFilterButton).click()
    // wait for filters to be shown

    const withinOrganizationButton = currentPage()
      .getByRole("button", {
        name: "Within Organization",
        exact: false
      })
      .first()
    await waitFor(await withinOrganizationButton, "visible")
    await (await withinOrganizationButton).click()
  }

  async addOrganizationToFilter(searchText) {
    const openFilterButton = currentPage()
      .locator("input[name='taskedOrgUuid']")
      .first()
    await waitFor(await openFilterButton, "visible")
    await (await openFilterButton).click()
    await typeKeys(searchText)
    await pwExpect(
      currentPage().locator("#taskedOrgUuid-popover tbody tr").first()
    ).toContainText(searchText, { useInnerText: true })
    // wait for the searchText to be processed
    await waitUntil(
      async () =>
        await (
          await currentPage().locator("#taskedOrgUuid-popover tbody").first()
        ).isVisible()
    )
    const orgCheckbox = currentPage()
      .locator("#taskedOrgUuid-popover tr .orgShortName")
      .first()
    await waitFor(await orgCheckbox, "visible")
    await (await orgCheckbox).click()
    await this.closeOrganizationsFilter()
  }

  async closeOrganizationsFilter() {
    const closeButton = currentPage()
      .locator(".bp6-icon.bp6-icon-cross")
      .first()
    await waitFor(await closeButton, "visible")
    await (await closeButton).click()
  }

  async submitSearch() {
    const searchButton = currentPage().locator("button[type='submit']").first()
    await waitFor(await searchButton, "visible")
    await (await searchButton).click()
  }

  async saveSearch() {
    const saveButton = currentPage().locator("#saveSearchButton").first()
    await waitFor(await saveButton, "visible")
    await (await saveButton).click()
  }

  async saveSearchModal() {
    const saveButton = currentPage()
      .locator("#saveSearchModalSubmitButton")
      .first()
    await waitFor(await saveButton, "visible")
    await (await saveButton).click()
  }

  async getToastMessages() {
    const toastMessages = await currentPage()
      .locator(".Toastify > div > div")
      .all()
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
    return currentPage().locator(".btn-danger").first()
  }

  async getDeleteConfirmButton() {
    return currentPage().locator('//button[text()="Yes, I am sure"]').first()
  }

  async confirmDelete() {
    await waitFor(await this.getDeleteConfirmButton(), "attached")
    await waitFor(await this.getDeleteConfirmButton(), "visible")
    await (await this.getDeleteConfirmButton()).click()
  }

  async getNoSavedSearches() {
    return currentPage().locator("fieldset p.mb-0").first()
  }
}

export default new SavedSearch()
