import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"

describe("Show My Reports page", () => {
  beforeEach("Open the My Reports page", async() => {
    await MyReports.open("arthur")
  })
  describe("When on the My Reports page", () => {
    it("We should see a table with all reports", async() => {
      await MyReports.selectReportsTable(REPORT_STATES.PUBLISHED)
      // Report 1 does not have attachments, report 2 has
      const reportNoAttachments = 1
      const reportAttachments = 2

      // Validate all columns in row
      expect(
        await (
          await MyReports.getReportsTableSpan(reportNoAttachments, 1)
        ).getText()
      ).to.equal("CIV DMIN, Arthur")
      expect(
        await (
          await MyReports.getReportsTableSpan(reportNoAttachments, 2)
        ).getText()
      ).to.equal("ANET Administrators")
      expect(
        await (
          await MyReports.getReportsTableSpan(reportNoAttachments, 3)
        ).getText()
      ).to.equal("A test report to be unpublished from Arthur")
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await MyReports.getReportsTableSpan(
            reportNoAttachments,
            5,
            ".bp4-icon-paperclip"
          )
        ).isExisting()
      ).to.be.false

      // Validate report with attachments
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await MyReports.getReportsTableSpan(
            reportAttachments,
            5,
            ".bp4-icon-paperclip"
          )
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await MyReports.getReportsTableCell(reportAttachments, 5)
        ).getAttribute("title")
      ).to.equal("The report has 1 attachment(s)")
    })

    it("We should see a summary with all reports", async() => {
      await MyReports.selectReportsSummary(REPORT_STATES.PUBLISHED)
      // Summary 1 does not have attachments, summary 2 has
      const reportNoAttachments = 1
      const reportAttachments = 2

      // Validate all summary fields
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 2, 1)
        ).getText()
      ).to.equal("CIV DMIN, Arthur")
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 2, 2)
        ).getText()
      ).to.equal("(ANET Administrators)")
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 2, 4)
        ).getText()
      ).to.equal("CIV SHARTON, Shardul")
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 2, 5)
        ).getText()
      ).to.equal("(MoI | Ministry of Interior)")
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 3, 1)
        ).getText()
      ).to.equal(
        "Location: General Hospital 47.571772,-52.741935 Point location"
      )
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 4, 1)
        ).getText()
      ).to.equal(
        "Engagement purpose: A test report to be unpublished from Arthur"
      )
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 5, 1)
        ).getText()
      ).to.equal("Key outcomes: have reports in organizations")
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 6, 1)
        ).getText()
      ).to.equal(
        "Next steps: I need to edit this report so unpublish it please"
      )
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 7, 1)
        ).getText()
      ).to.equal("Atmospherics: Positive")
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 8, 1)
        ).getText()
      ).to.equal("Efforts: EF 1 » EF 1.2 » 1.2.AEF 1 » EF 1.2 » 1.2.B")
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportNoAttachments, 9, 1)
        ).isExisting()
      ).to.be.false

      // Validate report with attachments
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await (
            await MyReports.getReportsSummarySpan(reportAttachments, 9, 1)
          ).$("span.bp4-icon-paperclip")
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await MyReports.getReportsSummarySpan(reportAttachments, 9, 1)
        ).getText()
      ).to.equal("1 attachment(s)")
    })
  })
})
