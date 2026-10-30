import { expect, test } from "@playwright/test"
import SavedSearchPageObject from "../../pages/searchFilters/savedSearch.page.js"

test.describe(() => {
  let page, SavedSearch
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    SavedSearch = new SavedSearchPageObject(page)
  })
  test("When trying to save a search", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 3)

    await test.step(
      "Should show a successful toast message when the search is unique",
      async () => {
        await SavedSearch.open()
        await SavedSearch.openOrganizationsFilter()
        await SavedSearch.addOrganizationToFilter("EF 1 | Planning")
        await SavedSearch.submitSearch()
        await SavedSearch.saveSearch()
        // wait for modal to appear
        await SavedSearch.saveSearchModal()
        // wait for toast message
        await expect(
          page.getByRole("alert").filter({
            hasText: "Search saved"
          })
        ).toBeVisible()
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should show an information toast when the search is a duplicate",
      async () => {
        await SavedSearch.saveSearch()
        // wait for toast message
        await expect(
          page.getByRole("alert").filter({
            hasText: "There's already an identical saved search"
          })
        ).toBeVisible()
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should delete the saved search",
      async () => {
        await SavedSearch.open("/search/mine")
        await (await SavedSearch.getDeleteSavedSearchButton()).click()
        // wait for modal to appear
        await SavedSearch.confirmDelete()
        // wait for saved search to be deleted
        const noSavedSearches = await SavedSearch.getNoSavedSearches()
        await expect(noSavedSearches).toHaveText("No saved searches found.", {
          useInnerText: true
        })
      },
      { timeout: stepTimeout }
    )
  })
})
