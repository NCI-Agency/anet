import { expect } from "chai"
import Home from "../pages/home.page"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"

const PRINCIPALS = [
  "Maj CHRISVILLE, Chris",
  "CIV KYLESON, Kyle",
  "CIV SHARTON, Shardul"
]

const ADVISORS = ["CIV DMIN, Arthur", "CIV GUIST, Lin"]

describe("Show print report page", () => {
  beforeEach("Open the show report page", async() => {
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
    it("Detailed View button should remove compact view to detailed view", async() => {
      const detailedViewButton = await ShowReport.getDetailedViewButton()
      await detailedViewButton.click()
      await (await ShowReport.getDefaultReportView()).waitForExist()
      await (await ShowReport.getDefaultReportView()).waitForDisplayed()
      await expect(
        await (await ShowReport.getCompactView()).isDisplayed()
      ).to.equal(false)
      await expect(
        await (await ShowReport.getCompactViewButton()).isDisplayed()
      ).to.equal(true)
    })
    it("We should see the correct report fields", async() => {
      const mustHaveFieldTexts = [
        "purpose",
        "Key outcomes",
        "Next steps",
        "principals",
        "advisors",
        "Atmospherics",
        "Efforts"
      ]
      const fields = await ShowReport.getCompactReportFields()
      const fieldTexts = await Promise.all(
        Array.from(fields).map(async field => await field.getText())
      )
      for (const mustHave of mustHaveFieldTexts) {
        await expect(fieldTexts).to.contain(mustHave)
      }
    })
    it("We should see a title with the correct text", async() => {
      const title = await (await ShowReport.getCompactTitle()).getText()
      await expect(title).to.equal("Summary / Print")
    })
    it("We should see buttons with the correct text", async() => {
      const printButtonText = await (
        await ShowReport.getPrintButton()
      ).getText()
      const detailedViewButtonText = await (
        await ShowReport.getDetailedViewButton()
      ).getText()
      await expect(printButtonText).to.equal("Print")
      await expect(detailedViewButtonText).to.equal("Detailed View")
    })
    it("Printable report banner should be the same as security banner", async() => {
      const compactBannerText = await (
        await ShowReport.getCompactBanner()
      ).getText()
      await Home.openAsAdminUser()
      const bannerSecurityText = await (
        await Home.getBannerSecurityText()
      ).getText()
      await expect(compactBannerText).to.equal(bannerSecurityText)
    })
    it("Should display all attendees", async() => {
      const displayedPrincipals = await ShowReport.getCompactViewAttendees(
        "principals"
      )
      const displayedAdvisors = await ShowReport.getCompactViewAttendees(
        "advisors"
      )
      for (const principal of PRINCIPALS) {
        await expect(displayedPrincipals).to.contain(principal)
      }
      for (const advisor of ADVISORS) {
        await expect(displayedAdvisors).to.contain(advisor)
      }
    })
    it("Should display all attendees when assessments are shown", async() => {
      await ShowReport.selectOptionalField("assessments")
      const displayedPrincipals = await ShowReport.getCompactViewAttendees(
        "principals",
        true
      )
      for (const principal of PRINCIPALS) {
        await expect(displayedPrincipals).to.contain(principal)
      }
      const displayedAdvisors = await ShowReport.getCompactViewAttendees(
        "advisors",
        true
      )
      for (const advisor of ADVISORS) {
        await expect(displayedAdvisors).to.contain(advisor)
      }
    })
  })
})
