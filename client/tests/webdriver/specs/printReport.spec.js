import { expect } from "chai"
import Settings from "../../../platform/node/settings"
import Home from "../pages/home.page"
import MyReports from "../pages/myReports.page"
import ShowReport from "../pages/showReport.page"

describe("Show print report page", () => {
  beforeEach("Open the show report page", () => {
    MyReports.open()
    ShowReport.openAsAdminUser(MyReports.reportWithAssessmentsUrl)
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
        "key outcomes",
        "next steps",
        "principals",
        "advisors",
        "atmospherics",
        "efforts"
      ]
      const fields = ShowReport.compactReportFields
      const fieldTexts = Array.from(fields).map(field => field.getText())
      mustHaveFieldTexts.forEach(mustHave => {
        expect(fieldTexts).to.contain(mustHave)
      })
    })
    it("We should see a title with the correct text", () => {
      const title = ShowReport.compactTitle.getText()
      expect(title).to.equal(
        Settings.fields.report.compactView || "Summary / Print"
      )
    })
    it("We should see buttons with the correct text", () => {
      const printButtonText = ShowReport.printButton.getText()
      const detailedViewButtonText = ShowReport.detailedViewButton.getText()
      expect(printButtonText).to.equal("Print")
      expect(detailedViewButtonText).to.equal(
        Settings.fields.report.detailedView || "Detailed View"
      )
    })
    it("Printable report banner should have part of the banner text", () => {
      const compactBannerText = ShowReport.compactBanner.getText()
      Home.openAsAdminUser()
      const bannerText = Home.securityBanner.getText()
      expect(bannerText.includes(compactBannerText)).to.equal(true)
    })
  })
})
