import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"

const ARTHURS_DRAFT_REPORT = "Test report with rich text"
const ERINS_DRAFT_REPORT = "Erin's Draft report, ready for submission"

describe("When checking the home page tiles", () => {
  afterEach("Should logout", async() => {
    await Home.logout()
  })

  describe("As admin", async() => {
    it("Should see correct number of pending reports when logged in as Arthur", async() => {
      await Home.openAsAdminUser()
      await (await Home.getHomeTilesContainer()).waitForExist()
      await (await Home.getHomeTilesContainer()).waitForDisplayed()
      // Depends on test data
      const pending = await (
        await Home.getReportsPendingMyApprovalCount()
      ).getText()
      expect(parseInt(pending, 10)).to.eq(2)
    })
  })

  describe("As admin", async() => {
    it("Should see correct number of draft reports when logged in as Arthur", async() => {
      await Home.openAsAdminUser()
      await (await Home.getHomeTilesContainer()).waitForExist()
      await (await Home.getHomeTilesContainer()).waitForDisplayed()
      // We should at least see Arthur's and Erin's own drafts (might be more if tests have run)
      const draft = await (await Home.getAllDraftReportsCount()).getText()
      expect(parseInt(draft, 10)).to.be.at.least(2)
      // Load drafts
      await (await Home.getAllDraftReports()).click()
      // Search for Erin's draft report
      await (await Home.getSearchBar()).setValue(ERINS_DRAFT_REPORT)
      await (await Home.getSubmitSearch()).click()
      await Search.selectReportTable()
      await browser.pause(500)
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (await Search.linkOfReportFound(ERINS_DRAFT_REPORT)).isExisting()
      ).to.be.true
    })
  })

  describe("As normal user", async() => {
    it("Should see correct number of draft reports when logged in as Erin", async() => {
      await Home.open()
      await (await Home.getHomeTilesContainer()).waitForExist()
      await (await Home.getHomeTilesContainer()).waitForDisplayed()
      // We should see Erin's own draft (there may be more, depending on the order of the tests)
      const draft = await (await Home.getMyDraftReportsCount()).getText()
      expect(parseInt(draft, 10)).to.be.at.least(1)
      // Load drafts
      await (await Home.getMyDraftReports()).click()
      await Search.selectReportTable()
      await browser.pause(500)
      // Erin's draft report should be there
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (await Search.linkOfReportFound(ERINS_DRAFT_REPORT)).isExisting()
      ).to.be.true
      // Search for Arthur's draft report
      await (await Home.getSearchBar()).setValue(ARTHURS_DRAFT_REPORT)
      await (await Home.getSubmitSearch()).click()
      await Search.selectReportTable()
      await browser.pause(500)
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await Search.linkOfReportFound(ARTHURS_DRAFT_REPORT)
        ).isExisting()
      ).to.be.false
    })
  })
})
