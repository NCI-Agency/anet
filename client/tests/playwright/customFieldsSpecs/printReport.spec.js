import { expect } from "@playwright/test"
import MyReports, { REPORT_STATES } from "../pages/myReports.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import { test, waitFor } from "../support.js"

test.describe("Show print report page", () => {
  test.beforeEach("Open the show report page", async () => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A test report from Arthur",
      REPORT_STATES.PUBLISHED
    )
    await (await ShowReport.getCompactViewButton()).click()
    await waitFor(await ShowReport.getCompactView(), "visible")
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
