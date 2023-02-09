import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import EditReport from "../pages/report/editReport.page"
import ShowReport from "../pages/report/showReport.page"

describe("When unpublishing a report", () => {
  beforeEach("Open the show report page", () => {
    MyReports.open("arthur")
    MyReports.selectReport(
      "A test report to be unpublished from Arthur",
      REPORT_STATES.PUBLISHED
    )
  })
  describe("When on the show page of a report", () => {
    it("Should unpublish the report successfully", () => {
      const unpublishedReportUuid = ShowReport.uuid
      EditReport.unpublishReport(unpublishedReportUuid)
      expect(EditReport.getAlertSuccess().getText()).to.equal(
        "Report unpublished"
      )
    })
  })
})
