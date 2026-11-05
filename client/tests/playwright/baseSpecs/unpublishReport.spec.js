import { expect, test } from "@playwright/test"
import MyReportsPageObject, { REPORT_STATES } from "../pages/myReports.page.js"
import EditReportPageObject from "../pages/report/editReport.page.js"
import ShowReportPageObject from "../pages/report/showReport.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, MyReports, EditReport, ShowReport
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    MyReports = new MyReportsPageObject(page)
    EditReport = new EditReportPageObject(page)
    ShowReport = new ShowReportPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  test.describe("When unpublishing a report", () => {
    test.beforeEach("Open the show report page", async () => {
      await MyReports.open("arthur")
      await MyReports.selectReport(
        "A test report to be unpublished from Arthur",
        REPORT_STATES.PUBLISHED
      )
    })
    test.describe("When on the show page of a report", () => {
      test("Should unpublish the report successfully", async () => {
        const unpublishedReportUuid = await ShowReport.getUuid()
        await EditReport.unpublishReport(unpublishedReportUuid)
        await expect(await EditReport.getAlertSuccess()).toHaveText(
          "Report unpublished",
          {
            useInnerText: true
          }
        )
      })
    })
  })
})
