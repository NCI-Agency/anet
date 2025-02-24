import Page from "../page"

const PAGE_URL = "/reports/:uuid"

class ShowReport extends Page {
  REPORT_IS_DRAFT = "This is a DRAFT report and hasn't been submitted."
  REPORT_IS_PLANNED_DRAFT =
    "This is a DRAFT planned engagement and hasn't been submitted."

  REPORT_IS_PENDING_APPROVALS = "This report is PENDING approvals."
  REPORT_IS_APPROVED = "This report is APPROVED."

  async getClassification() {
    return browser.$("#report-classification")
  }

  async getEditReportButton() {
    return browser.$("//a[text()='Edit']")
  }

  async getTasksEngagementAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  async getTask12BUrl() {
    return (await browser.$("*=1.2.B")).getAttribute("href")
  }

  async getTaskEF1Url() {
    return (await browser.$("*=EF 1")).getAttribute("href")
  }

  async getDefaultReportView() {
    return browser.$(".report-show")
  }

  async getCompactView() {
    return browser.$(".compact-view")
  }

  async getCompactViewButton() {
    return browser.$("button[value='compactView']")
  }

  async getCompactBanner() {
    return browser.$(".compact-view .banner")
  }

  async getCompactTitle() {
    return browser.$("header *[value='title']")
  }

  async getPrintButton() {
    return browser.$("button[value='print']")
  }

  async getCompactReportFields() {
    return browser.$$(".compact-view .reportField > th")
  }

  async getDetailedViewButton() {
    return browser.$("button[value='detailedView']")
  }

  async getReportText() {
    return browser.$("#report-text")
  }

  async getReportStatus() {
    return browser.$("h4.text-danger")
  }

  async getReportStatusText() {
    return (await this.getReportStatus()).getText()
  }

  async getUuid() {
    const url = new URL(await browser.getUrl())
    return url.pathname.slice(url.pathname.lastIndexOf("/") + 1)
  }

  async getIntent() {
    return (await browser.$("#intent")).getText()
  }

  async getEngagementDate() {
    return (await browser.$("div[name='engagementDate']")).getText()
  }

  async getReportConflictIcon() {
    // wait for conflict loader to disappear
    await (
      await browser.$(
        "div[name='engagementDate'] > span.reportConflictLoadingIcon"
      )
    ).waitForExist({ reverse: true })

    return browser.$("div[name='engagementDate'] > span.reportConflictIcon")
  }

  async getReportConflictTooltipTitle() {
    await browser.pause(200)
    return (await browser.$(".reportConflictTooltipContainer > div")).getText()
  }

  async getDuration() {
    return (await browser.$("div[name='duration']")).getText()
  }

  async getCurrentUrl() {
    return browser.getCurrentUrl()
  }

  async getLocation() {
    return (await browser.$("div[name='location']")).getText()
  }

  async getAuthors() {
    return (await browser.$("div[name='authors']")).getText()
  }

  async getAdvisorOrg() {
    return (await browser.$("div[name='advisorOrg']")).getText()
  }

  async getInterlocutorOrg() {
    return (await browser.$("div[name='interlocutorOrg']")).getText()
  }

  async getSubmitButton() {
    return browser.$('//button[text()="Submit report"]')
  }

  async getPreviewAndSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async getReportModal() {
    return browser.$(".modal-dialog")
  }

  async getConfirmSubmitButton() {
    return (await this.getReportModal()).$('.//button[text()="Submit anyway"]')
  }

  async getModalWarning() {
    return (await this.getReportModal()).$(".alert")
  }

  async getApproveButton() {
    return browser.$('//button[text()="Approve"]')
  }

  async getConfirmApproveButton() {
    return (await this.getReportModal()).$('.//button[text()="Approve anyway"]')
  }

  async getEditAttachmentsButton() {
    return await browser.$("#edit-attachments")
  }

  async getSuccessfullApprovalToast() {
    return browser.$('//div[text()="Successfully approved report."]')
  }

  async getAttendeeByName(name) {
    const td = await (
      await browser.$("#reportPeopleContainer")
    ).$(`td.reportPeopleName=${name}`)

    if (!(await td.isExisting())) {
      return null
    }

    const row = await td.$("..")
    // wait for conflict loader to disappear
    await (
      await row.$("td.conflictButton div.bp5-spinner")
    ).waitForExist({ reverse: true })

    return {
      name: await td.getText(),
      conflictButton: await row.$("td.conflictButton > span")
    }
  }

  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsSuperuser(uuid) {
    await super.openAsSuperuser(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async waitForShowReportToLoad() {
    await browser.waitUntil(async() =>
      /^.*\/reports\/[a-z0-9-]{36}/.test(await browser.getUrl())
    )
    await (await this.getReportStatus()).waitForExist()
    await (await this.getReportStatus()).waitForDisplayed()
  }

  async getCompactViewElements(type, withAssessments) {
    const elements = await (withAssessments
      ? browser.$$(`#${type} > tbody > tr > td > span`)
      : browser.$$(`#${type} > td > span`))
    return await elements.map(async element => (await element).getText())
  }

  async selectOptionalField(field) {
    const optionalFieldsButton = await browser.$(
      '//button[text()="Optional Fields ⇓"]'
    )
    const optionalFields = await browser.$("#optionalFields")
    const fieldCheckbox = await browser.$(`input[id="${field}"]`)
    await optionalFieldsButton.click()
    await optionalFields.waitForDisplayed()
    if (!(await fieldCheckbox.isSelected())) {
      await fieldCheckbox.click()
    }
  }

  async getClassificationHeader() {
    return browser.$("#header-banner")
  }

  async getClassificationFooter() {
    return browser.$("#footer-banner")
  }
}

export default new ShowReport()
