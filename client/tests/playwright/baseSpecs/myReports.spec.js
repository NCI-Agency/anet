import { expect, test } from "@playwright/test"
import MyReportsPageObject, { REPORT_STATES } from "../pages/myReports.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, MyReports
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    MyReports = new MyReportsPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("Show My Reports page", () => {
    test.beforeEach("Open the My Reports page", async () => {
      await MyReports.open("arthur")
    })
    test.describe("When on the My Reports page", () => {
      test("We should see a table with all reports", async () => {
        await MyReports.selectReportsTable(REPORT_STATES.PUBLISHED)
        // Report 1 does not have attachments, report 2 has
        const reportNoAttachments = 1
        const reportAttachments = 2

        // Validate all columns in row
        await expect(
          await MyReports.getReportsTableSpan(reportNoAttachments, 1)
        ).toHaveText("CIV Arthur Dmin", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsTableSpan(reportNoAttachments, 2)
        ).toHaveText("ANET Administrators", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsTableSpan(reportNoAttachments, 3)
        ).toHaveText("A test report to be unpublished from Arthur", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsTableSpan(
            reportNoAttachments,
            5,
            ".bp6-icon-paperclip"
          )
        ).toHaveCount(0)

        // Validate report with attachments

        await expect(
          await MyReports.getReportsTableSpan(
            reportAttachments,
            5,
            ".bp6-icon-paperclip"
          )
        ).not.toHaveCount(0)
        await expect(
          await MyReports.getReportsTableCell(reportAttachments, 5)
        ).toHaveAttribute("title", "The report has 1 attachment(s)")
      })
      test("We should see a summary with all reports", async () => {
        await MyReports.selectReportsSummary(REPORT_STATES.PUBLISHED)
        // Summary 1 does not have attachments, summary 2 has
        const reportNoAttachments = 1
        const reportAttachments = 2

        // Validate all summary fields
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 2, 1)
        ).toHaveText("CIV Arthur Dmin", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 2, 2)
        ).toHaveText("(\nANET Administrators\n)", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 2, 4)
        ).toHaveText("CIV Shardul Sharton", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 2, 5)
        ).toHaveText("(\nMoI | Ministry of Interior\n)", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 3, 1)
        ).toHaveText("Location:\nGeneral Hospital Point location", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 4, 1)
        ).toHaveText(
          "Engagement purpose: A test report to be unpublished from Arthur",
          {
            useInnerText: true
          }
        )
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 5, 1)
        ).toHaveText("Key outcomes: have reports in organizations", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 6, 1)
        ).toHaveText(
          "Next steps: I need to edit this report so unpublish it please",
          {
            useInnerText: true
          }
        )
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 7, 1)
        ).toHaveText("Atmospherics: Positive", {
          useInnerText: true
        })
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 8, 1)
        ).toHaveText(
          "Objectives:\nEF 1\n»\nEF 1.2\n»\n1.2.A\nEF 1\n»\nEF 1.2\n»\n1.2.B",
          {
            useInnerText: true
          }
        )
        await expect(
          await MyReports.getReportsSummarySpan(reportNoAttachments, 9, 1)
        ).toHaveCount(0)

        // Validate report with attachments

        await expect(
          await (
            await MyReports.getReportsSummarySpan(reportAttachments, 9, 1)
          )
            .locator("span.bp6-icon-paperclip")
            .first()
        ).not.toHaveCount(0)
        await expect(
          await MyReports.getReportsSummarySpan(reportAttachments, 9, 1)
        ).toHaveText("1 attachment(s)", {
          useInnerText: true
        })
      })
    })
  })
})
