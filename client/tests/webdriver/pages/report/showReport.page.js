import Page from "../page"

const PAGE_URL = "/reports/:uuid"

class ShowReport extends Page {
  REPORT_IS_DRAFT = "This is a DRAFT report and hasn't been submitted."
  REPORT_IS_PLANNED_DRAFT =
    "This is a DRAFT planned engagement and hasn't been submitted."

  REPORT_IS_PENDING_APPROVALS = "This report is PENDING approvals."
  REPORT_IS_APPROVED = "This report is APPROVED."

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
    const title =
      (await (
        await browser.$("//span[@class='title-text'][contains(.,'Report #')]")
      ).getText()) || ""
    return title.slice(title.lastIndexOf("#") + 1)
  }

  async getIntent() {
    const text =
      (await (await browser.$("#intent > p:first-child")).getText()) || ""
    return text.slice(text.indexOf(": ") + 2)
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

  async getAttachments() {
    return browser.$("#attachments")
  }

  async getCard() {
    return browser.$(".card")
  }

  async getFileData() {
    return (await browser.$(".info-line")).getText()
  }

  async getImageClick() {
    return browser.$(".imagePreview")
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
    return (await this.getReportModal()).$('//button[text()="Submit anyway"]')
  }

  async getModalWarning() {
    return (await this.getReportModal()).$(".alert")
  }

  async getApproveButton() {
    return browser.$('//button[text()="Approve"]')
  }

  async getConfirmApproveButton() {
    return (await this.getReportModal()).$('//button[text()="Approve anyway"]')
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
      await row.$("td.conflictButton div.bp4-spinner")
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
      ? browser.$$(`#${type} > td > table > tbody > tr > td > span`)
      : browser.$$(`#${type} > td > span`))
    return await Promise.all(
      elements.map(async element => (await element).getText())
    )
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
}

export default new ShowReport()
