import { expect } from "@playwright/test"
import Page from "./page.js"

const PAGE_URL = "/tasks/:uuid"
class ShowTask extends Page {
  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getCreateSubTaskButton() {
    return this.page.locator('//a[text()="Create sub-objective"]').first()
  }

  async getForm() {
    return this.page.locator("div.form-horizontal").first()
  }

  async getShortName() {
    return this.page.locator(".title-text").first()
  }

  async getLongName() {
    return this.page.locator('div[id="longName"]').first()
  }

  async getParentTask() {
    return this.page.locator('div[id="parentTask"]').first()
  }

  async getParentTaskField() {
    return this.page.locator("#fg-parentTask").first()
  }

  async getChildrenTasks() {
    return this.page.locator('div[id="subTasks"]').first()
  }

  async getChildrenTasksField() {
    return this.page.locator("#fg-subTasks").first()
  }

  async getFirstItemFromChildrenTasks() {
    return this.page
      .locator("#subTasks > .list-group .list-group-item:first-child")
      .first()
  }

  async getAssessmentResults(assessmentKey, recurrence) {
    return this.page
      .locator(`#entity-assessments-results-${assessmentKey}-${recurrence}`)
      .first()
  }

  async getDescription() {
    return this.page.locator('div[id="description"]').first()
  }

  async getAssessmentsTable(assessmentKey, recurrence) {
    return (await this.getAssessmentResults(assessmentKey, recurrence))
      .locator("table.assessments-table")
      .first()
  }

  async getAddAssessmentButton(assessmentKey, recurrence) {
    // get the add assessment button for first period on the table
    return (await this.getAssessmentsTable(assessmentKey, recurrence))
      .locator("tbody > tr > td:first-child > button")
      .first()
  }

  async getNextPeriodButton(assessmentKey, recurrence) {
    return (await this.getAssessmentResults(assessmentKey, recurrence))
      .locator("button:last-child")
      .first()
  }

  async getFutureAddAssessmentButton(assessmentKey, recurrence) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence))
      .locator("tbody tr:last-child td:last-child button")
      .first()
  }

  async getEditAssessmentButton(assessmentKey, recurrence) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence))
      .locator('div.card button[title="Edit assessment"]')
      .first()
  }

  async getDeleteAssessmentButton() {
    return this.page
      .locator("div.card button.btn.btn-outline-danger.btn-xs")
      .first()
  }

  async getDeleteConfirmButton() {
    return this.page.locator('//button[text()="Yes, I am sure"]').first()
  }

  async getAssessmentModalForm() {
    return this.page.locator(".modal-content form").first()
  }

  async getSaveAssessmentButton() {
    return (await this.getAssessmentModalForm()).getByRole("button", {
      name: "Save",
      exact: true
    })
  }

  async getShownAssessmentPanel(assessmentKey, recurrence, row, column) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence))
      .locator(`tbody tr:nth-child(${row}) td:nth-child(${column}) .card`)
      .first()
  }

  async getShownAssessmentDetails(
    assessmentKey,
    recurrence,
    row = 2,
    column = 1
  ) {
    return (
      await this.getShownAssessmentPanel(assessmentKey, recurrence, row, column)
    )
      .locator("div.card-body .form-control-plaintext")
      .all()
  }

  async getEditEngagementPlanningApprovalsButton() {
    return this.page
      .locator(
        '//button[contains(text(), "Edit Engagement planning approvals")]'
      )
      .first()
  }

  async getEditReportPublicationApprovalsButton() {
    return this.page
      .locator(
        '//button[contains(text(), "Edit Report publication approvals")]'
      )
      .first()
  }

  async getEditApprovalsModal() {
    return this.page.locator(".modal").first()
  }

  async getModalContent() {
    return this.page.locator("div.modal-content").first()
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).locator(".btn-close").first()
  }

  async waitForAssessmentModalForm(reverse = false) {
    // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitFor({
      state: reverse ? "detached" : "attached",
      timeout: 20000
    })
    await (
      await this.getAssessmentModalForm()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 2 questions; process them in order
    // first wait for assessment modal to be fully rendered

    // Select text editor input
    await this.fillRichTextInput(
      await this.getAssessmentModalForm(),
      "div[id='fg-entityAssessment.issues'] .editor-container > .editable",
      valuesArr[0],
      prevTextToClear
    )

    // Select button group
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.status'] label[for="entityAssessment.status_${valuesArr[1]}"]`
    )
  }

  async saveAssessmentAndWaitForModalClose(
    assessmentKey,
    recurrence,
    detail0ToWaitFor
  ) {
    return super.saveAssessmentAndWaitForModalClose(
      await this.getSaveAssessmentButton(),
      () => this.getAssessmentModalForm(),
      () => this.getShownAssessmentDetails(assessmentKey, recurrence),
      0,
      detail0ToWaitFor
    )
  }

  async confirmDelete() {
    await (await this.getDeleteConfirmButton()).click()
  }

  async waitForDeletedAssessmentToDisappear(
    assessmentKey,
    recurrence,
    row = 2,
    column = 1
  ) {
    await (
      await this.getShownAssessmentPanel(assessmentKey, recurrence, row, column)
    ).waitFor({
      state: "detached",
      timeout: 20000
    })
  }

  async getSyncMatrix() {
    return this.page.locator('div[id="syncMatrix"]').first()
  }

  async getEventMatrixEventSeries() {
    return this.page.locator("tr.event-series-row").all()
  }

  async getEventMatrixTasks() {
    return this.page.locator("tr.event-series-task-row").all()
  }

  async gotoPreviousPeriod() {
    const rows = this.page.locator("tr.event-series-row")
    const previousRows = await rows.allTextContents()
    const updated = this.page.waitForResponse(response => {
      const request = response.request()
      if (!response.url().endsWith("/graphql") || request.method() !== "POST") {
        return false
      }
      return request.postDataJSON()?.query?.includes("$eventQuery")
    })
    await this.page.locator("#previous-period").click()
    await (await updated).finished()
    await expect(rows).not.toHaveText(previousRows)
  }
}
export default ShowTask
