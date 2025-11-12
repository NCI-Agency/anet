import { expect } from "chai"
import SavedSearch from "../../pages/searchFilters/savedSearch.page"

describe("When trying to save a search", () => {
  it("Should show a successful toast message when the search is unique", async () => {
    await SavedSearch.open()
    await SavedSearch.openOrganizationsFilter()
    await SavedSearch.addOrganizationToFilter("EF 1 | Planning")
    await SavedSearch.submitSearch()
    await SavedSearch.saveSearch()
    await browser.pause(1000) // wait for modal to appear
    await SavedSearch.saveSearchModal()
    await browser.pause(1000) // wait for toast message
    const toastMessages = await SavedSearch.getToastMessages()

    expect(toastMessages).to.include("Search saved")
  })
  it("Should show an information toast when the search is a duplicate", async () => {
    await SavedSearch.saveSearch()
    await browser.pause(1000) // wait for toast message
    const toastMessages = await SavedSearch.getToastMessages()

    expect(toastMessages).to.include(
      "There's already an identical saved search"
    )
  })
  it("Should delete the saved search", async () => {
    await SavedSearch.open("/search/mine")
    await (await SavedSearch.getDeleteSavedSearchButton()).click()
    await browser.pause(1000) // wait for modal to appear
    await SavedSearch.confirmDelete()
    await browser.pause(1000) // wait for saved search to be deleted
    const noSavedSearches = await SavedSearch.getNoSavedSearches()
    expect(await noSavedSearches.getText()).to.equal("No saved searches found.")
  })
})
