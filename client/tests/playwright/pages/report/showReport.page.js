import { expect } from "@playwright/test"
import Page from "../page.js"

const PAGE_URL = "/reports/:uuid"
class ShowReport extends Page {
  REPORT_IS_DRAFT = "This is a DRAFT report and hasn't been submitted."
  REPORT_IS_PLANNED_DRAFT =
    "This is a DRAFT planned engagement and hasn't been submitted."

  REPORT_IS_PENDING_APPROVALS = "This report is PENDING approvals."
  REPORT_IS_APPROVED = "This report is APPROVED."
  async getClassification() {
    return this.page.locator("#report-classification").first()
  }

  async getEditReportButton() {
    return this.page.getByRole("link", { name: "Edit", exact: true }).first()
  }

  async getAttendeesAssessments(id) {
    return this.page.locator(`#${id}`).first()
  }

  async getAttendeeAssessment(id, name) {
    return (await this.getAttendeesAssessments(id))
      .getByRole("link")
      .and(this.page.getByText(name, { exact: true }))
      .first()
  }

  async getAttendeeAssessmentLabel(id, name, i) {
    return this.getAssessmentLabel(
      await this.getAttendeesAssessments(id),
      name,
      i
    )
  }

  async getTasksEngagementAssessments(id) {
    return this.page.locator(`#${id}`).first()
  }

  async getTaskEngagementAssessment(id, shortName) {
    return (await this.getTasksEngagementAssessments(id))
      .getByRole("link")
      .and(this.page.getByText(shortName, { exact: true }))
      .first()
  }

  async getTaskEngagementAssessmentLabel(id, shortName, i) {
    return this.getAssessmentLabel(
      await this.getTasksEngagementAssessments(id),
      shortName,
      i
    )
  }

  async getDefaultReportView() {
    return this.page.locator(".report-show").first()
  }

  async getCompactView() {
    return this.page.locator(".compact-view").first()
  }

  async getCompactViewButton() {
    return this.page.locator("button[value='compactView']").first()
  }

  async getCompactBanner() {
    return this.page.locator(".compact-view .banner").first()
  }

  async getCompactTitle() {
    return this.page.locator("header *[value='title']").first()
  }

  async getPrintButton() {
    return this.page.locator("button[value='print']").first()
  }

  async getCompactReportFields() {
    return this.page.locator(".compact-view .reportField > th").all()
  }

  async getDetailedViewButton() {
    return this.page.locator("button[value='detailedView']").first()
  }

  async getReportText() {
    return this.page.locator("#report-text").first()
  }

  async getReportStatus() {
    return this.page.locator("h4.text-danger").first()
  }

  async getUuid() {
    const url = new URL(await this.page.url())
    return url.pathname.slice(url.pathname.lastIndexOf("/") + 1)
  }

  async getIntent() {
    return this.page.locator("#intent").first()
  }

  async getEngagementDate() {
    return this.page.locator("div[name='engagementDate']").first()
  }

  async getReportConflictIcon() {
    // wait for conflict loader to disappear
    await (
      await this.page
        .locator("div[name='engagementDate'] > span.reportConflictLoadingIcon")
        .first()
    ).waitFor({
      state: "detached",
      timeout: 10000
    })
    return this.page
      .locator("div[name='engagementDate'] > span.reportConflictIcon")
      .first()
  }

  async getReportConflictTooltipTitle() {
    return this.page.locator(".reportConflictTooltipContainer > div").first()
  }

  async getDuration() {
    return this.page.locator("div[name='duration']").first()
  }

  async getCurrentUrl() {
    return this.page.url()
  }

  async getLocation() {
    return this.page.locator("div[name='location']").first()
  }

  async getAuthors() {
    return this.page.locator("div[name='authors']").first()
  }

  async getReportCommunities() {
    return (
      await this.page.locator("div[name='reportCommunities']").first()
    ).innerText()
  }

  async getCompactReportCommunities() {
    return (
      await this.page.locator("table#reportCommunities").first()
    ).innerText()
  }

  async getAdvisorOrg() {
    return this.page.locator("div[name='advisorOrg']").first()
  }

  async getInterlocutorOrg() {
    return this.page.locator("div[name='interlocutorOrg']").first()
  }

  async getSubmitButton() {
    return this.page
      .getByRole("button", { name: "Submit report", exact: true })
      .first()
  }

  async getPreviewAndSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }

  async getReportModal() {
    return this.page.locator(".modal-dialog").first()
  }

  async getConfirmSubmitButton() {
    return (await this.getReportModal())
      .getByRole("button", { name: "Submit anyway", exact: true })
      .first()
  }

  async getModalWarning() {
    return (await this.getReportModal()).locator(".alert").first()
  }

  async getApproveButton() {
    return this.page
      .getByRole("button", { name: "Approve", exact: true })
      .first()
  }

  async getConfirmApproveButton() {
    return (await this.getReportModal())
      .getByRole("button", { name: "Approve anyway", exact: true })
      .first()
  }

  async getEditAttachmentsButton() {
    return this.page.locator("#edit-attachments").first()
  }

  async getSuccessfullApprovalToast() {
    return this.page
      .getByText("Successfully approved report.", { exact: true })
      .first()
  }

  async getAttendeeByName(name) {
    const row = this.page
      .locator("#reportPeopleContainer")
      .getByRole("row")
      .filter({
        has: this.page
          .locator(":scope > td.reportPeopleName")
          .filter({ hasText: name })
      })
      .first()
    const td = row.locator(":scope > td.reportPeopleName").first()
    if (!((await td.count()) > 0)) {
      return null
    }
    // wait for conflict loader to disappear
    await (
      await row.locator(":scope > td.conflictButton div.bp6-spinner").first()
    ).waitFor({
      state: "detached",
      timeout: 10000
    })
    return {
      name: (await td.innerText()).trim(),
      conflictButton: await row
        .locator(":scope > td.conflictButton > span")
        .first()
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
    await expect(this.page).toHaveURL(/^.*\/reports\/[a-z0-9-]{36}/, {
      timeout: 10000
    })
  }

  async waitForShowReportToLoad() {
    await this.waitForReportUrl()
    await (
      await this.getReportStatus()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
  }

  async waitForShowReportToFail() {
    await this.waitForReportUrl()
    await (
      await this.getNotFound()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
  }

  async getCompactViewElements(type, withAssessments) {
    const elements = await (withAssessments
      ? this.page.locator(`#${type} > tbody > tr > th > span`).all()
      : this.page.locator(`#${type} > td > span`).all())
    return await Promise.all(
      elements.map(async element => (await element).innerText())
    )
  }

  async getCompactFieldValue(label) {
    const element = await this.page
      .locator(".compact-view")
      .getByRole("row")
      .filter({
        has: this.page
          .locator(":scope > th")
          .and(this.page.getByText(label, { exact: true }))
      })
      .locator(":scope > td")
      .first()
    await element.waitFor({
      state: "attached",
      timeout: 10000
    })
    return element.innerText()
  }

  async selectOptionalField(field) {
    const optionalFieldsButton = await this.page
      .getByRole("button", { name: /^Optional Fields(?:\s*▾)?$/ })
      .first()
    const optionalFields = await this.page
      .locator("#optionalFields-menu")
      .first()
    const fieldCheckbox = await this.page
      .locator(`input[id="${field}"]`)
      .first()
    await optionalFieldsButton.click()
    await optionalFields.waitFor({
      state: "visible",
      timeout: 10000
    })
    if (!(await fieldCheckbox.isChecked())) {
      await fieldCheckbox.click()
    }
  }

  async getClassificationHeader() {
    return this.page.locator("#header-banner").first()
  }

  async getClassificationFooter() {
    return this.page.locator("#footer-banner").first()
  }

  async getKeyOutcomesList() {
    return this.page.locator("#keyOutcomes > ul > li")
  }

  async getNextStepsList() {
    return this.page.locator("#nextSteps > ul > li")
  }

  async getAttachmentsSection() {
    return this.page.locator("tr#imageAttachments").first()
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
export default ShowReport
