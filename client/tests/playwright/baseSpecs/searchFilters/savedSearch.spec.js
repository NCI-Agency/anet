import { expect, test } from "@playwright/test"
import SavedSearchPageObject from "../../pages/searchFilters/savedSearch.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, SavedSearch
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    SavedSearch = new SavedSearchPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("When trying to save a search", () => {
    test("Should show a successful toast message when the search is unique", async () => {
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
    })
    test("Should show an information toast when the search is a duplicate", async () => {
      await SavedSearch.saveSearch()
      // wait for toast message
      await expect(
        page.getByRole("alert").filter({
          hasText: "There's already an identical saved search"
        })
      ).toBeVisible()
    })
    test("Should delete the saved search", async () => {
      await SavedSearch.open("/search/mine")
      await (await SavedSearch.getDeleteSavedSearchButton()).click()
      // wait for modal to appear
      await SavedSearch.confirmDelete()
      // wait for saved search to be deleted
      const noSavedSearches = await SavedSearch.getNoSavedSearches()
      await expect(noSavedSearches).toHaveText("No saved searches found.", {
        useInnerText: true
      })
    })
  })
})
