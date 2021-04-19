import { expect } from "chai"
import MyReports from "../pages/myReports.page"
import EditReport from "../pages/report/editReport.page"
import ShowReport from "../pages/report/showReport.page"

describe("When unpublishing a report", () => {
  beforeEach("Open the show report page", () => {
    MyReports.open()
    MyReports.openAsAdminUser(
      MyReports.getReportUrl("A test report to be unpublished from Arthur")
    )
  })
  it("Should unpublish the report successfully", () => {
    const unpublishedReportUuid = ShowReport.uuid
    EditReport.unpublishReport(unpublishedReportUuid)
    expect(EditReport.alertSuccess.getText()).to.equal("Report unpublished")
  })
})
