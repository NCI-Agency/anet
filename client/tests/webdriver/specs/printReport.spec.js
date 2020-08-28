import { expect } from "chai"
import Home from "../pages/home.page"
import MyReports from "../pages/myReports.page"
import ShowReport from "../pages/showReport.page"
describe("Show print report page", () => {
  beforeEach("Open the show report page", () => {
    MyReports.open()
    ShowReport.openAsAdminUser(MyReports.reportWithAssessmentsUrl)
    ShowReport.printViewButton.click()
  })
  describe("When on the print report page", () => {
    it("We should see a title with the correct text", () => {
      const title = ShowReport.printTitle.getText()
      expect(title).to.equal("Printable Version")
    })
    it("We should see buttons with correct text", () => {
      const printButtonText = ShowReport.printButton.getText()
      const webViewButtonText = ShowReport.webViewButton.getText()
      expect(printButtonText).to.equal("Print")
      expect(webViewButtonText).to.equal("Web View")
    })
    it("Web View button should remove print view to web view", () => {
      const webViewButton = ShowReport.webViewButton
      webViewButton.click()
      expect(ShowReport.printView.isDisplayed()).to.equal(false)
      expect(ShowReport.printViewButton.isDisplayed()).to.equal(true)
    })

    it("Printable report banner should have correct text", () => {
      const printBannerText = ShowReport.printBanner.getText()
      Home.openAsAdminUser()
      const bannerText = Home.securityBanner.getText()
      expect(bannerText.includes(printBannerText)).to.equal(true)
    })

    it("We should see correct report fields", () => {
      const mustHaveFieldTexts = [
        "purpose",
        "key outcomes",
        "next steps",
        "principals",
        "advisors",
        "atmospherics",
        "efforts"
      ]
      const fields = ShowReport.printableReportFields
      const fieldTexts = Array.from(fields).map(field => field.getText())
      mustHaveFieldTexts.forEach(mustHave => {
        expect(fieldTexts).to.contain(mustHave)
      })
    })
  })
})
