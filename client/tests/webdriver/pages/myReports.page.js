import Page from "./page"

const PAGE_URL = "/reports/mine"

class MyReports extends Page {
  open() {
    super.openAsAdminUser(PAGE_URL)
  }

  selectReport(linkText) {
    const tableTab = browser.$(
      "#published-reports .report-collection div header div button[value='table']"
    )
    tableTab.waitForExist()
    tableTab.waitForDisplayed()
    tableTab.click()
    const reportLink = browser.$(`*=${linkText}`)
    reportLink.waitForExist()
    reportLink.waitForDisplayed()
    reportLink.click()
    super.waitUntilLoaded()
  }
}

export default new MyReports()
