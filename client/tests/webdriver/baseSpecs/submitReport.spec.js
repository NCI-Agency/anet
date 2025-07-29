import { expect } from "chai"
import ShowReport from "../pages/report/showReport.page"

const DRAFT_REPORT_UUID = "530b735e-1134-4daa-9e87-4491c888a4f7"

describe("Submit report", () => {
  afterEach("Should logout", async () => {
    await ShowReport.logout()
  })

  describe("As author", async () => {
    it("Should be able to open Draft report", async () => {
      await ShowReport.open(DRAFT_REPORT_UUID)
      await ShowReport.waitForShowReportToLoad()
      expect(await ShowReport.getUuid()).to.equal(DRAFT_REPORT_UUID)
      expect(await ShowReport.getReportStatusText()).to.equal(
        ShowReport.REPORT_IS_DRAFT
      )
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowReport.getSubmitButton()).isExisting()).to.be.true
    })
  })

  describe("As superuser", async () => {
    it("Should not be able to submit Draft report", async () => {
      await ShowReport.openAsSuperuser(DRAFT_REPORT_UUID)
      await ShowReport.waitForShowReportToLoad()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowReport.getSubmitButton()).isExisting()).to.be
        .false
    })
  })

  describe("As admin", async () => {
    it("Should be able to submit Draft report", async () => {
      await ShowReport.openAsAdminUser(DRAFT_REPORT_UUID)
      await ShowReport.waitForShowReportToLoad()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await ShowReport.getSubmitButton()).isExisting()).to.be.true
      // Submit the report
      await (await ShowReport.getSubmitButton()).click()
      // Should be successful
      await browser.pause(1000) // Wait for status text to be updated
      expect(await ShowReport.getReportStatusText()).to.equal(
        ShowReport.REPORT_IS_PENDING_APPROVALS
      )
    })
  })

  describe("As author", async () => {
    it("Should be able to set report back to Draft", async () => {
      await ShowReport.open(DRAFT_REPORT_UUID)
      await ShowReport.waitForShowReportToLoad()
      expect(await ShowReport.getReportStatusText()).to.equal(
        ShowReport.REPORT_IS_PENDING_APPROVALS
      )
      // Edit the report
      await (await ShowReport.getEditReportButton()).click()
      // Save the report
      await (await ShowReport.getPreviewAndSubmitButton()).click()
      // Should be successful
      await ShowReport.waitForShowReportToLoad()
      expect(await ShowReport.getReportStatusText()).to.equal(
        ShowReport.REPORT_IS_DRAFT
      )
    })
  })
})
