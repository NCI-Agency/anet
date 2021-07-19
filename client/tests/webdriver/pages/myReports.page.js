import Page from "./page"

const PAGE_URL = "/reports/mine"

class MyReports extends Page {
  open() {
    super.openAsAdminUser(PAGE_URL)
  }

  getReportUrl(urlText) {
    const tableTab = browser.$(
      "#published-reports .report-collection div header div button[value='table']"
    )
    tableTab.click()
    return $(`*=${urlText}`).getAttribute("href")
  }
}

export default new MyReports()
