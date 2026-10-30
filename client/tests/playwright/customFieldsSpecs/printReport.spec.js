import { expect, test } from "@playwright/test"
import MyReportsPageObject, { REPORT_STATES } from "../pages/myReports.page.js"
import ShowReportPageObject from "../pages/report/showReport.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, MyReports, ShowReport
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    MyReports = new MyReportsPageObject(page)
    ShowReport = new ShowReportPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("Show print report page", () => {
    test.beforeEach("Open the show report page", async () => {
      await MyReports.open("arthur")
      await MyReports.selectReport(
        "A test report from Arthur",
        REPORT_STATES.PUBLISHED
      )
      await (await ShowReport.getCompactViewButton()).click()
      await (
        await ShowReport.getCompactView()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test.describe("When on the print report page", () => {
      test("Should display report custom fields", async () => {
        const engagementTypes =
          await ShowReport.getCompactFieldValue("Engagement types")
        expect(engagementTypes).toContain("Advise")
        const issueEchelon = await ShowReport.getCompactFieldValue(
          "Issue echelon to fix"
        )
        expect(issueEchelon).toBe("Ut enim ad minim veniam")
      })
    })
  })
})
