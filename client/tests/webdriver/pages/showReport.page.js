import Page from "./page"

class ShowReport extends Page {
  get tasksEngagementAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  get task12BUrl() {
    return browser.$("*=1.2.B").getAttribute("href")
  }

  get printView() {
    return browser.$(".print-view")
  }

  get printViewButton() {
    return browser.$("button[value='printView'")
  }

  get printButton() {
    return browser.$("button[value='print'")
  }

  get webViewButton() {
    return browser.$("button[value='webView'")
  }

  get printableReportFields() {
    return browser.$$(".print-view .reportField > th")
  }

  get printBanner() {
    return browser.$(".print-view .banner")
  }

  get printTitle() {
    return browser.$("h3")
  }
}

export default new ShowReport()
