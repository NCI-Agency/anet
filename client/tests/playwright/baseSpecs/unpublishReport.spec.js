import { expect, test } from "@playwright/test"
import MyReportsPageObject, { REPORT_STATES } from "../pages/myReports.page.js"
import EditReportPageObject from "../pages/report/editReport.page.js"
import ShowReportPageObject from "../pages/report/showReport.page.js"

test.describe(() => {
  let MyReports, EditReport, ShowReport
  test.beforeEach(async ({ page }) => {
    MyReports = new MyReportsPageObject(page)
    EditReport = new EditReportPageObject(page)
    ShowReport = new ShowReportPageObject(page)
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
