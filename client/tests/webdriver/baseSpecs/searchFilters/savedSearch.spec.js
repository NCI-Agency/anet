import { expect } from "chai"
import SavedSearch from "../../pages/searchFilters/savedSearch"

describe("When trying to save a search", () => {
  it("Should show a successfull toast message when the search is unique", async () => {
    await SavedSearch.open()
    await SavedSearch.openOrganizationsFilter()
    await SavedSearch.addOrganizationToFilter("EF 1 | Planning")
    await SavedSearch.submitSearch()
    await SavedSearch.saveSearch()
    await SavedSearch.saveSearchModal()
    await browser.pause(1000)
    const toastMessages = await SavedSearch.getToastMessages()

    expect(toastMessages).to.include("Search saved")
  })
  it("Should show an information toast when the search is a duplicate", async () => {
    await SavedSearch.saveSearch()
    await browser.pause(1000)
    const toastMessages = await SavedSearch.getToastMessages()

    expect(toastMessages).to.include(
      "There's already an identical saved search"
    )
  })
})
