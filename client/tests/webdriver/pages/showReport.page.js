import Page from "./page"

class ShowReport extends Page {
  get editReportButton() {
    return browser.$("//a[text()='Edit']")
  }

  get tasksEngagementAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  get task12BUrl() {
    return browser.$("*=1.2.B").getAttribute("href")
  }

  get defaultReportView() {
    return browser.$(".report-show")
  }

  get compactView() {
    return browser.$(".compact-view")
  }

  get compactViewButton() {
    return browser.$("button[value='compactView']")
  }

  get compactBanner() {
    return browser.$(".compact-view .banner")
  }

  get compactTitle() {
    return browser.$("header *[value='title']")
  }

  get printButton() {
    return browser.$("button[value='print']")
  }

  get compactReportFields() {
    return browser.$$(".compact-view .reportField > th")
  }

  get detailedViewButton() {
    return browser.$("button[value='detailedView']")
  }

  get reportText() {
    return browser.$("#report-text")
  }

  getReportTextContent(selector, multipleElements, index) {
    if (!selector) {
      return this.reportText
    }
    if (multipleElements) {
      return this.reportText.$(selector).$$(multipleElements)[index]
    }
    return this.reportText.$(selector)
  }
}

export default new ShowReport()
