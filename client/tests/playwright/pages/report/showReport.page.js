import { currentPage, waitFor, waitUntil } from "../../support.js"
import Page from "../page.js"

const PAGE_URL = "/reports/:uuid"

class ShowReport extends Page {
  REPORT_IS_DRAFT = "This is a DRAFT report and hasn't been submitted."
  REPORT_IS_PLANNED_DRAFT =
    "This is a DRAFT planned engagement and hasn't been submitted."

  REPORT_IS_PENDING_APPROVALS = "This report is PENDING approvals."
  REPORT_IS_APPROVED = "This report is APPROVED."
  async getClassification() {
    return currentPage().locator("#report-classification").first()
  }

  async getEditReportButton() {
    return currentPage().locator("//a[text()='Edit']").first()
  }

  async getAttendeesAssessments(id) {
    return currentPage().locator(`#${id}`).first()
  }

  async getAttendeeAssessment(id, name) {
    return (await this.getAttendeesAssessments(id))
      .locator(`xpath=.//th//a[text()="${name}"]`)
      .first()
  }

  async getAttendeeAssessmentLabel(id, name, i) {
    return (await this.getAttendeeAssessment(id, name))
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..")
      .locator(`xpath=./following-sibling::tr[${i}]/td`)
      .first()
  }

  async getTasksEngagementAssessments(id) {
    return currentPage().locator(`#${id}`).first()
  }

  async getTaskEngagementAssessment(id, shortName) {
    return (await this.getTasksEngagementAssessments(id))
      .locator(`xpath=.//th//a[text()="${shortName}"]`)
      .first()
  }

  async getTaskEngagementAssessmentLabel(id, shortName, i) {
    return (await this.getTaskEngagementAssessment(id, shortName))
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..")
      .locator(`xpath=./following-sibling::tr[${i}]/td`)
      .first()
  }

  async getDefaultReportView() {
    return currentPage().locator(".report-show").first()
  }

  async getCompactView() {
    return currentPage().locator(".compact-view").first()
  }

  async getCompactViewButton() {
    return currentPage().locator("button[value='compactView']").first()
  }

  async getCompactBanner() {
    return currentPage().locator(".compact-view .banner").first()
  }

  async getCompactTitle() {
    return currentPage().locator("header *[value='title']").first()
  }

  async getPrintButton() {
    return currentPage().locator("button[value='print']").first()
  }

  async getCompactReportFields() {
    return currentPage().locator(".compact-view .reportField > th").all()
  }

  async getDetailedViewButton() {
    return currentPage().locator("button[value='detailedView']").first()
  }

  async getReportText() {
    return currentPage().locator("#report-text").first()
  }

  async getReportStatus() {
    return currentPage().locator("h4.text-danger").first()
  }

  async getUuid() {
    const url = new URL(await currentPage().url())
    return url.pathname.slice(url.pathname.lastIndexOf("/") + 1)
  }

  async getIntent() {
    return currentPage().locator("#intent").first()
  }

  async getEngagementDate() {
    return currentPage().locator("div[name='engagementDate']").first()
  }

  async getReportConflictIcon() {
    // wait for conflict loader to disappear
    await waitFor(
      await currentPage()
        .locator("div[name='engagementDate'] > span.reportConflictLoadingIcon")
        .first(),
      "attached",
      {
        reverse: true
      }
    )
    return currentPage()
      .locator("div[name='engagementDate'] > span.reportConflictIcon")
      .first()
  }

  async getReportConflictTooltipTitle() {
    return currentPage()
      .locator(".reportConflictTooltipContainer > div")
      .first()
  }

  async getDuration() {
    return currentPage().locator("div[name='duration']").first()
  }

  async getCurrentUrl() {
    return currentPage().url()
  }

  async getLocation() {
    return currentPage().locator("div[name='location']").first()
  }

  async getAuthors() {
    return currentPage().locator("div[name='authors']").first()
  }

  async getReportCommunities() {
    return (
      await currentPage().locator("div[name='reportCommunities']").first()
    ).innerText()
  }

  async getCompactReportCommunities() {
    return (
      await currentPage().locator("table#reportCommunities").first()
    ).innerText()
  }

  async getAdvisorOrg() {
    return currentPage().locator("div[name='advisorOrg']").first()
  }

  async getInterlocutorOrg() {
    return currentPage().locator("div[name='interlocutorOrg']").first()
  }

  async getSubmitButton() {
    return currentPage().locator('//button[text()="Submit report"]').first()
  }

  async getPreviewAndSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
  }

  async getReportModal() {
    return currentPage().locator(".modal-dialog").first()
  }

  async getConfirmSubmitButton() {
    return (await this.getReportModal())
      .locator('xpath=.//button[text()="Submit anyway"]')
      .first()
  }

  async getModalWarning() {
    return (await this.getReportModal()).locator(".alert").first()
  }

  async getApproveButton() {
    return currentPage().locator('//button[text()="Approve"]').first()
  }

  async getConfirmApproveButton() {
    return (await this.getReportModal())
      .locator('xpath=.//button[text()="Approve anyway"]')
      .first()
  }

  async getEditAttachmentsButton() {
    return currentPage().locator("#edit-attachments").first()
  }

  async getSuccessfullApprovalToast() {
    return currentPage()
      .locator('//div[text()="Successfully approved report."]')
      .first()
  }

  async getAttendeeByName(name) {
    const td = await (
      await currentPage().locator("#reportPeopleContainer").first()
    )
      .locator("td.reportPeopleName")
      .filter({
        hasText: `${name}`
      })
      .first()
    if (!((await td.count()) > 0)) {
      return null
    }
    const row = await td.locator("..")
    // wait for conflict loader to disappear
    await waitFor(
      await row.locator("td.conflictButton div.bp6-spinner").first(),
      "attached",
      {
        reverse: true
      }
    )
    return {
      name: (await td.innerText()).trim(),
      conflictButton: await row.locator("td.conflictButton > span").first()
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

  async waitForReportUrl() {
    await waitUntil(async () =>
      /^.*\/reports\/[a-z0-9-]{36}/.test(await currentPage().url())
    )
  }

  async waitForShowReportToLoad() {
    await this.waitForReportUrl()
    await waitFor(await this.getReportStatus(), "visible")
  }

  async waitForShowReportToFail() {
    await this.waitForReportUrl()
    await waitFor(await this.getNotFound(), "visible")
  }

  async getCompactViewElements(type, withAssessments) {
    const elements = await (withAssessments
      ? currentPage().locator(`#${type} > tbody > tr > th > span`).all()
      : currentPage().locator(`#${type} > td > span`).all())
    return await Promise.all(
      elements.map(async element => (await element).innerText())
    )
  }

  async getCompactFieldValue(label) {
    const element = await currentPage()
      .locator(
        `//div[contains(@class,'compact-view')]//tr[./th[normalize-space()="${label}"]]//td`
      )
      .first()
    await waitFor(element, "attached")
    return element.innerText()
  }

  async selectOptionalField(field) {
    const optionalFieldsButton = await currentPage()
      .locator('//button[text()="Optional Fields"]')
      .first()
    const optionalFields = await currentPage()
      .locator("#optionalFields-menu")
      .first()
    const fieldCheckbox = await currentPage()
      .locator(`input[id="${field}"]`)
      .first()
    await optionalFieldsButton.click()
    await waitFor(optionalFields, "visible")
    if (!(await fieldCheckbox.isChecked())) {
      await fieldCheckbox.click()
    }
  }

  async getClassificationHeader() {
    return currentPage().locator("#header-banner").first()
  }

  async getClassificationFooter() {
    return currentPage().locator("#footer-banner").first()
  }

  async getKeyOutcomesList() {
    return currentPage().locator("#keyOutcomes > ul > li")
  }

  async getNextStepsList() {
    return currentPage().locator("#nextSteps > ul > li")
  }

  async getAttachmentsSection() {
    return currentPage().locator("tr#imageAttachments").first()
  }

  async getAttachmentFigures() {
    return (await this.getAttachmentsSection()).locator("figure")
  }

  async getAttachmentClassification(attachment) {
    return attachment.locator("span").first()
  }

  async getAttachmentCaption(attachment) {
    return attachment.locator("figcaption").first()
  }
}

export default new ShowReport()
