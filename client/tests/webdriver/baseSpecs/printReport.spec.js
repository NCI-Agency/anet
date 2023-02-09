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
  beforeEach("Open the show report page", () => {
    MyReports.open("arthur")
    MyReports.selectReport("A test report from Arthur", REPORT_STATES.PUBLISHED)
    ShowReport.getCompactViewButton().click()
    ShowReport.getCompactView().waitForExist()
    ShowReport.getCompactView().waitForDisplayed()
  })
  describe("When on the print report page", () => {
    it("Detailed View button should remove compact view to detailed view", () => {
      const detailedViewButton = ShowReport.getDetailedViewButton()
      detailedViewButton.click()
      ShowReport.getDefaultReportView().waitForExist()
      ShowReport.getDefaultReportView().waitForDisplayed()
      expect(ShowReport.getCompactView().isDisplayed()).to.equal(false)
      expect(ShowReport.getCompactViewButton().isDisplayed()).to.equal(true)
    })
    it("We should see the correct report fields", () => {
      const mustHaveFieldTexts = [
        "purpose",
        "Key outcomes",
        "Next steps",
        "principals",
        "advisors",
        "Atmospherics",
        "Efforts"
      ]
      const fields = ShowReport.getCompactReportFields()
      const fieldTexts = Array.from(fields).map(field => field.getText())
      mustHaveFieldTexts.forEach(mustHave => {
        expect(fieldTexts).to.contain(mustHave)
      })
    })
    it("We should see a title with the correct text", () => {
      const title = ShowReport.getCompactTitle().getText()
      expect(title).to.equal("Summary / Print")
    })
    it("We should see buttons with the correct text", () => {
      const printButtonText = ShowReport.getPrintButton().getText()
      const detailedViewButtonText =
        ShowReport.getDetailedViewButton().getText()
      expect(printButtonText).to.equal("Print")
      expect(detailedViewButtonText).to.equal("Detailed View")
    })
    it("Printable report banner should be the same as security banner", () => {
      const compactBannerText = ShowReport.getCompactBanner().getText()
      Home.openAsAdminUser()
      const bannerSecurityText = Home.getBannerSecurityText().getText()
      expect(compactBannerText).to.equal(bannerSecurityText)
    })
    it("Should display all attendees", () => {
      const displayedPrincipals =
        ShowReport.getCompactViewAttendees("principals")
      const displayedAdvisors = ShowReport.getCompactViewAttendees("advisors")
      PRINCIPALS.forEach(principal => {
        expect(displayedPrincipals).to.contain(principal)
      })
      ADVISORS.forEach(advisor => {
        expect(displayedAdvisors).to.contain(advisor)
      })
    })
    it("Should display all attendees when assessments are shown", () => {
      ShowReport.selectOptionalField("assessments")
      const displayedPrincipals = ShowReport.getCompactViewAttendees(
        "principals",
        true
      )
      PRINCIPALS.forEach(principal => {
        expect(displayedPrincipals).to.contain(principal)
      })
      const displayedAdvisors = ShowReport.getCompactViewAttendees(
        "advisors",
        true
      )
      ADVISORS.forEach(advisor => {
        expect(displayedAdvisors).to.contain(advisor)
      })
    })
  })
})
