import { expect } from "chai"
import Home from "../pages/home.page"
import MyReports from "../pages/myReports.page"
import ShowReport from "../pages/showReport.page"
describe("Show print report page", () => {
  beforeEach("Open the show report page", () => {
    MyReports.open()
    ShowReport.openAsAdminUser(MyReports.reportWithAssessmentsUrl)
    ShowReport.compactViewButton.click()
  })
  describe("When on the print report page", () => {
    it("Web View button should remove print view to web view", () => {
      const webViewButton = ShowReport.webViewButton
      webViewButton.click()
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
      expect(title).to.equal("Compact Version")
    })
    it("We should see buttons with the correct text", () => {
      const printButtonText = ShowReport.printButton.getText()
      const webViewButtonText = ShowReport.webViewButton.getText()
      expect(printButtonText).to.equal("Print")
      expect(webViewButtonText).to.equal("Web View")
    })
    it("Printable report banner should have the correct text", () => {
      const compactBannerText = ShowReport.compactBanner.getText()
      Home.openAsAdminUser()
      const bannerText = Home.securityBanner.getText()
      expect(bannerText.includes(compactBannerText)).to.equal(true)
    })
  })
})
