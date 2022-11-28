import { expect } from "chai"
import Home from "../pages/home.page"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"

describe("Show print report page", () => {
  beforeEach("Open the show report page", () => {
    MyReports.open("arthur")
    MyReports.selectReport("A test report from Arthur", REPORT_STATES.PUBLISHED)
    ShowReport.compactViewButton.click()
    ShowReport.compactView.waitForExist()
    ShowReport.compactView.waitForDisplayed()
  })
  describe("When on the print report page", () => {
    it("Detailed View button should remove compact view to detailed view", () => {
      const detailedViewButton = ShowReport.detailedViewButton
      detailedViewButton.click()
      ShowReport.defaultReportView.waitForExist()
      ShowReport.defaultReportView.waitForDisplayed()
      expect(ShowReport.compactView.isDisplayed()).to.equal(false)
      expect(ShowReport.compactViewButton.isDisplayed()).to.equal(true)
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
      const fields = ShowReport.compactReportFields
      const fieldTexts = Array.from(fields).map(field => field.getText())
      mustHaveFieldTexts.forEach(mustHave => {
        expect(fieldTexts).to.contain(mustHave)
      })
    })
    it("We should see a title with the correct text", () => {
      const title = ShowReport.compactTitle.getText()
      expect(title).to.equal("Summary / Print")
    })
    it("We should see buttons with the correct text", () => {
      const printButtonText = ShowReport.printButton.getText()
      const detailedViewButtonText = ShowReport.detailedViewButton.getText()
      expect(printButtonText).to.equal("Print")
      expect(detailedViewButtonText).to.equal("Detailed View")
    })
    it("Printable report banner should be the same as security banner", () => {
      const compactBannerText = ShowReport.compactBanner.getText()
      Home.openAsAdminUser()
      const bannerSecurityText = Home.bannerSecurityText.getText()
      expect(compactBannerText).to.equal(bannerSecurityText)
    })
  })
})
