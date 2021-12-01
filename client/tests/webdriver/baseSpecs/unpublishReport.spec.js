import { expect } from "chai"
import MyReports from "../pages/myReports.page"
import EditReport from "../pages/report/editReport.page"
import ShowReport from "../pages/report/showReport.page"

describe("When unpublishing a report", () => {
  beforeEach("Open the show report page", () => {
    MyReports.open()
    MyReports.selectReport("A test report to be unpublished from Arthur")
  })
  describe("When on the show page of a report", () => {
    it("Should unpublish the report successfully", () => {
      const unpublishedReportUuid = ShowReport.uuid
      EditReport.unpublishReport(unpublishedReportUuid)
      expect(EditReport.alertSuccess.getText()).to.equal("Report unpublished")
    })
  })
})
