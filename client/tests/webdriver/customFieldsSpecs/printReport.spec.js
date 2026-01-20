import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"

describe("Show print report page", () => {
  beforeEach("Open the show report page", async () => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A test report from Arthur",
      REPORT_STATES.PUBLISHED
    )
    await (await ShowReport.getCompactViewButton()).click()
    await (await ShowReport.getCompactView()).waitForExist()
    await (await ShowReport.getCompactView()).waitForDisplayed()
  })
  describe("When on the print report page", () => {
    it("Should display report custom fields", async () => {
      const engagementTypes =
        await ShowReport.getCompactFieldValue("Engagement types")
      expect(engagementTypes).to.contain("Advise")

      const issueEchelon = await ShowReport.getCompactFieldValue(
        "Issue echelon to fix"
      )
      expect(issueEchelon).to.equal("Ut enim ad minim veniam")
    })
  })
})
