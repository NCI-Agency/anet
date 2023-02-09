import Page from "../page"

const PAGE_URL = "/reports/:uuid"

class ShowReport extends Page {
  getEditReportButton() {
    return browser.$("//a[text()='Edit']")
  }

  getTasksEngagementAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  getTask12BUrl() {
    return browser.$("*=1.2.B").getAttribute("href")
  }

  getDefaultReportView() {
    return browser.$(".report-show")
  }

  getCompactView() {
    return browser.$(".compact-view")
  }

  getCompactViewButton() {
    return browser.$("button[value='compactView']")
  }

  getCompactBanner() {
    return browser.$(".compact-view .banner")
  }

  getCompactTitle() {
    return browser.$("header *[value='title']")
  }

  getPrintButton() {
    return browser.$("button[value='print']")
  }

  getCompactReportFields() {
    return browser.$$(".compact-view .reportField > th")
  }

  getDetailedViewButton() {
    return browser.$("button[value='detailedView']")
  }

  getReportText() {
    return browser.$("#report-text")
  }

  getReportStatus() {
    return browser.$("h4.text-danger")
  }

  getReportStatusText() {
    return this.getReportStatus().getText()
  }

  getUuid() {
    const title =
      browser
        .$("//span[@class='title-text'][contains(.,'Report #')]")
        .getText() || ""
    return title.slice(title.lastIndexOf("#") + 1)
  }

  getIntent() {
    const text = browser.$("#intent > p:first-child").getText() || ""
    return text.slice(text.indexOf(": ") + 2)
  }

  getEngagementDate() {
    return browser.$("div[name='engagementDate']").getText()
  }

  getReportConflictIcon() {
    // wait for conflict loader to disappear
    browser
      .$("div[name='engagementDate'] > span.reportConflictLoadingIcon")
      .waitForExist({ reverse: true })

    return browser.$("div[name='engagementDate'] > span.reportConflictIcon")
  }

  getReportConflictTooltipTitle() {
    browser.pause(200)
    return browser.$(".reportConflictTooltipContainer > div").getText()
  }

  getDuration() {
    return browser.$("div[name='duration']").getText()
  }

  getLocation() {
    return browser.$("div[name='location']").getText()
  }

  getAuthors() {
    return browser.$("div[name='authors']").getText()
  }

  getSubmitButton() {
    return browser.$('//button[text()="Submit report"]')
  }

  getReportModal() {
    return browser.$(".modal-dialog")
  }

  getConfirmSubmitButton() {
    return this.getReportModal().$('//button[text()="Submit anyway"]')
  }

  getModalWarning() {
    return this.getReportModal().$(".alert")
  }

  getApproveButton() {
    return browser.$('//button[text()="Approve"]')
  }

  getConfirmApproveButton() {
    return this.getReportModal().$('//button[text()="Approve anyway"]')
  }

  getSuccessfullApprovalToast() {
    return browser.$('//div[text()="Successfully approved report."]')
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
    this.getReportStatus().waitForExist()
    this.getReportStatus().waitForDisplayed()
  }

  getCompactViewAttendees(type, withAssessments) {
    return withAssessments
      ? browser
        .$$(`#${type} > td > table > tbody > tr > td`)
      // Filter out the assessment rows to get the attendees
        .filter(row => {
          return row.$("span > a").isExisting()
        })
        .map(row => {
          return row.$("span > a").getText()
        })
      : browser
        .$$(`#${type} > td > span > a`)
        .map(attendeeLink => attendeeLink.getText())
  }

  selectOptionalField(field) {
    const optionalFieldsButton = browser.$(
      '//button[text()="Optional Fields ⇓"]'
    )
    const optionalFields = browser.$("#optionalFields")
    const fieldCheckbox = browser.$(`input[id="${field}"]`)
    optionalFieldsButton.click()
    optionalFields.waitForDisplayed()
    if (!fieldCheckbox.isSelected()) {
      fieldCheckbox.click()
    }
  }
}

export default new ShowReport()
