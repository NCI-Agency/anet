import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import Home from "../pages/home.page.js"
import Search from "../pages/search.page.js"
import { test, waitFor } from "../support.js"

const ARTHURS_DRAFT_REPORT = "Test report with rich text"
const ERINS_DRAFT_REPORT = "Erin's Draft report, ready for submission"
const SEARCH_TITLE_TEXTS = [
  "Search for People filtered on Holding Position As: Administrator, Status: Active",
  "Search for Reports filtered on State: Approved or Published, Status: Active, Within Location: Kabul Hospital",
  "Search for Objectives filtered on Status: Active, Within Organization: EF 1"
]
test.describe("When checking the home page tiles", () => {
  test.afterEach("Should logout", async () => {
    await Home.logout(true)
  })
  test.describe("As admin", async () => {
    test("Should see correct number of pending reports when logged in as Arthur", async () => {
      await Home.openAsAdminUser()
      await waitFor(await Home.getHomeTilesContainer(), "attached")
      await waitFor(await Home.getHomeTilesContainer(), "visible")
      // Depends on test data
      const pending = (
        await (await Home.getReportsPendingMyApprovalCount()).innerText()
      ).trim()
      expect(parseInt(pending, 10)).to.eq(2)
    })
  })
  test.describe("As admin", async () => {
    test("Should see correct number of draft reports when logged in as Arthur", async () => {
      await Home.openAsAdminUser()
      await waitFor(await Home.getHomeTilesContainer(), "attached")
      await waitFor(await Home.getHomeTilesContainer(), "visible")
      // We should at least see Arthur's own draft (might be more if tests have run)
      const draft = (
        await (await Home.getMyDraftReportsCount()).innerText()
      ).trim()
      expect(parseInt(draft, 10)).to.be.at.least(1)
      // Load drafts
      await (await Home.getMyDraftReports()).click()
      await Search.selectReportTable()
      // Arthur's draft report should be there

      await pwExpect(
        await Search.linkOfReportFound(ARTHURS_DRAFT_REPORT)
      ).not.toHaveCount(0)
      // Search for Erin's draft report
      await (await Home.getSearchBar()).fill(String(ERINS_DRAFT_REPORT))
      await (await Home.getSubmitSearch()).click()
      await Search.selectReportTable()
      await pwExpect(
        await Search.linkOfReportFound(ERINS_DRAFT_REPORT)
      ).toHaveCount(0)
    })
    test("should see the correct number of saved searches when logged in as admin", async () => {
      await Home.openAsAdminUser()
      // wait for the saved searches to be loaded
      await waitFor(await Home.getSavedSearches(), "attached")
      await waitFor(await Home.getSavedSearches(), "visible")
      const savedSearches = await Home.getSavedSearchRows()
      await pwExpect.poll(async () => await savedSearches.length).toEqual(3)
      await pwExpect
        .poll(async () => await Home.getSavedSearchTitleText(savedSearches[0]))
        .toEqual(SEARCH_TITLE_TEXTS[0])
      await pwExpect
        .poll(async () => await Home.getSavedSearchTitleText(savedSearches[1]))
        .toEqual(SEARCH_TITLE_TEXTS[1])
      await pwExpect
        .poll(async () => await Home.getSavedSearchTitleText(savedSearches[2]))
        .toEqual(SEARCH_TITLE_TEXTS[2])
    })
  })
  test.describe("As normal user", async () => {
    test("Should see correct number of draft reports when logged in as Erin", async () => {
      await Home.open()
      await waitFor(await Home.getHomeTilesContainer(), "attached")
      await waitFor(await Home.getHomeTilesContainer(), "visible")
      // We should see Erin's own draft (there may be more, depending on the order of the tests)
      const draft = (
        await (await Home.getMyDraftReportsCount()).innerText()
      ).trim()
      expect(parseInt(draft, 10)).to.be.at.least(1)
      // Load drafts
      await (await Home.getMyDraftReports()).click()
      await Search.selectReportTable()
      // Erin's draft report should be there

      await pwExpect(
        await Search.linkOfReportFound(ERINS_DRAFT_REPORT)
      ).not.toHaveCount(0)
      // Search for Arthur's draft report
      await (await Home.getSearchBar()).fill(String(ARTHURS_DRAFT_REPORT))
      await (await Home.getSubmitSearch()).click()
      await Search.selectReportTable()
      await pwExpect(
        await Search.linkOfReportFound(ARTHURS_DRAFT_REPORT)
      ).toHaveCount(0)
    })
  })
})
