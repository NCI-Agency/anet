import Page from "../page"

const PAGE_URL = "/reports/:uuid"

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

  get reportStatus() {
    return browser.$("h4.text-danger")
  }

  get reportStatusText() {
    return this.reportStatus.getText()
  }

  get uuid() {
    const title =
      browser
        .$("//span[@class='title-text'][contains(.,'Report #')]")
        .getText() || ""
    return title.slice(title.lastIndexOf("#") + 1)
  }

  get intent() {
    const text = browser.$("#intent > p:first-child").getText() || ""
    return text.slice(text.indexOf(": ") + 2)
  }

  get engagementDate() {
    return browser.$("div[name='engagementDate']").getText()
  }

  get reportConflictIcon() {
    // wait for conflict loader to disappear
    browser
      .$("div[name='engagementDate'] > span.reportConflictLoadingIcon")
      .waitForExist({ reverse: true })

    return browser.$("div[name='engagementDate'] > span.reportConflictIcon")
  }

  get reportConflictTooltipTitle() {
    browser.pause(200)
    return browser.$(".reportConflictTooltipContainer > div").getText()
  }

  get duration() {
    return browser.$("div[name='duration']").getText()
  }

  get location() {
    return browser.$("div[name='location']").getText()
  }

  get authors() {
    return browser.$("div[name='authors']").getText()
  }

  get submitButton() {
    return browser.$('//button[text()="Submit report"]')
  }

  get reportModal() {
    return browser.$(".modal-dialog")
  }

  get confirmSubmitButton() {
    return this.reportModal.$('//button[text()="Submit anyway"]')
  }

  get modalWarning() {
    return this.reportModal.$(".alert")
  }

  get approveButton() {
    return browser.$('//button[text()="Approve"]')
  }

  get confirmApproveButton() {
    return this.reportModal.$('//button[text()="Approve anyway"]')
  }

  get successfullApprovalToast() {
    return browser.$('//div[text()="Successfully approved report."]')
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

  getAttendeeByName(name) {
    const td = browser
      .$("#reportPeopleContainer")
      .$(`td.reportPeopleName=${name}`)

    if (!td.isExisting()) {
      return null
    }

    const row = td.$("..")
    // wait for conflict loader to disappear
    row.$("td.conflictButton div.bp4-spinner").waitForExist({ reverse: true })

    return {
      name: td.getText(),
      conflictButton: row.$("td.conflictButton > span")
    }
  }

  open(uuid) {
    super.open(PAGE_URL.replace(":uuid", uuid))
  }

  waitForShowReportToLoad() {
    browser.waitUntil(() =>
      /^.*\/reports\/[a-z0-9-]{36}/.test(browser.getUrl())
    )
    this.reportStatus.waitForExist()
    this.reportStatus.waitForDisplayed()
  }
}

export default new ShowReport()
