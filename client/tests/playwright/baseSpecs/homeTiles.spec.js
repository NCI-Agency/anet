import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import SearchPageObject from "../pages/search.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, Search
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    Search = new SearchPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
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
        await (
          await Home.getHomeTilesContainer()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        // Depends on test data
        const pending = (
          await (await Home.getReportsPendingMyApprovalCount()).innerText()
        ).trim()
        expect(parseInt(pending, 10)).toBe(2)
      })
    })
    test.describe("As admin", async () => {
      test("Should see correct number of draft reports when logged in as Arthur", async () => {
        await Home.openAsAdminUser()
        await (
          await Home.getHomeTilesContainer()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        // We should at least see Arthur's own draft (might be more if tests have run)
        const draft = (
          await (await Home.getMyDraftReportsCount()).innerText()
        ).trim()
        expect(parseInt(draft, 10)).toBeGreaterThanOrEqual(1)
        // Load drafts
        await (await Home.getMyDraftReports()).click()
        await Search.selectReportTable()
        // Arthur's draft report should be there

        await expect(
          await Search.linkOfReportFound(ARTHURS_DRAFT_REPORT)
        ).not.toHaveCount(0)
        // Search for Erin's draft report
        await (await Home.getSearchBar()).fill(String(ERINS_DRAFT_REPORT))
        await (await Home.getSubmitSearch()).click()
        await Search.selectReportTable()
        await expect(
          await Search.linkOfReportFound(ERINS_DRAFT_REPORT)
        ).toHaveCount(0)
      })
      test("should see the correct number of saved searches when logged in as admin", async () => {
        await Home.openAsAdminUser()
        // wait for the saved searches to be loaded
        await (
          await Home.getSavedSearches()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        const savedSearches = await Home.getSavedSearchRows()
        await expect(savedSearches).toHaveCount(3)
        await expect(
          savedSearches.nth(0).locator(".asLink").first()
        ).toHaveText(SEARCH_TITLE_TEXTS[0], {
          useInnerText: true
        })
        await expect(
          savedSearches.nth(1).locator(".asLink").first()
        ).toHaveText(SEARCH_TITLE_TEXTS[1], {
          useInnerText: true
        })
        await expect(
          savedSearches.nth(2).locator(".asLink").first()
        ).toHaveText(SEARCH_TITLE_TEXTS[2], {
          useInnerText: true
        })
      })
    })
    test.describe("As normal user", async () => {
      test("Should see correct number of draft reports when logged in as Erin", async () => {
        await Home.open()
        await (
          await Home.getHomeTilesContainer()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        // We should see Erin's own draft (there may be more, depending on the order of the tests)
        const draft = (
          await (await Home.getMyDraftReportsCount()).innerText()
        ).trim()
        expect(parseInt(draft, 10)).toBeGreaterThanOrEqual(1)
        // Load drafts
        await (await Home.getMyDraftReports()).click()
        await Search.selectReportTable()
        // Erin's draft report should be there

        await expect(
          await Search.linkOfReportFound(ERINS_DRAFT_REPORT)
        ).not.toHaveCount(0)
        // Search for Arthur's draft report
        await (await Home.getSearchBar()).fill(String(ARTHURS_DRAFT_REPORT))
        await (await Home.getSubmitSearch()).click()
        await Search.selectReportTable()
        await expect(
          await Search.linkOfReportFound(ARTHURS_DRAFT_REPORT)
        ).toHaveCount(0)
      })
    })
  })
})
