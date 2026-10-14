import { expect as pwExpect } from "@playwright/test"
import MyReports, { REPORT_STATES } from "../pages/myReports.page.js"
import EditReport from "../pages/report/editReport.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import { test } from "../support.js"

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
      await pwExpect(await EditReport.getAlertSuccess()).toHaveText(
        "Report unpublished",
        {
          useInnerText: true
        }
      )
    })
  })
})
