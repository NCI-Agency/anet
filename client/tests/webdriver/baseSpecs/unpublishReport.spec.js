import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import EditReport from "../pages/report/editReport.page"
import ShowReport from "../pages/report/showReport.page"

describe("When unpublishing a report", () => {
  beforeEach("Open the show report page", async () => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A test report to be unpublished from Arthur",
      REPORT_STATES.PUBLISHED
    )
  })
  describe("When on the show page of a report", () => {
    it("Should unpublish the report successfully", async () => {
      const unpublishedReportUuid = await ShowReport.getUuid()
      await EditReport.unpublishReport(unpublishedReportUuid)
      expect(await (await EditReport.getAlertSuccess()).getText()).to.equal(
        "Report unpublished"
      )
    })
  })
})
