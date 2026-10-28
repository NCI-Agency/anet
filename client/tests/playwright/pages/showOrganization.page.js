import { currentPage, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/organizations/:uuid"

class ShowOrganization extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getCreateSubOrganizationButton() {
    return currentPage()
      .locator('//a[text()="Create sub-organization"]')
      .first()
  }

  async getLongName() {
    return currentPage().locator('div[id="longName"]').first()
  }

  async getLocation() {
    return currentPage().locator('div[id="location"]').first()
  }

  async getProfile() {
    return currentPage().locator('div[id="profile"]').first()
  }

  async hoverOverApp6Symbol() {
    const previewElement = await currentPage()
      .locator("#app6-symbol-preview")
      .first()
    await previewElement.hover()
    const popover = await currentPage().locator(".bp6-popover-content").first()
    await waitFor(popover, "visible")
  }

  async getApp6Value(field) {
    return currentPage().locator(`td[id="${field}"]`).first()
  }

  async getLeaders() {
    return currentPage().locator('div[id="fg-Leaders"]').first()
  }

  async getLeaderPosition() {
    return currentPage()
      .locator("div#Leaders div.list-group-item > span:first-child")
      .first()
  }

  async getLeaderPositionPerson() {
    return currentPage()
      .locator("div#Leaders div.list-group-item > span:nth-child(2)")
      .first()
  }

  async getDeputies() {
    return currentPage().locator('div[id="fg-Deputies"]').first()
  }

  async getDeputyPosition() {
    return currentPage()
      .locator("div#Deputies div.list-group-item > span:first-child")
      .first()
  }

  async getDeputyPositionPerson() {
    return currentPage()
      .locator("div#Deputies div.list-group-item > span:nth-child(2)")
      .first()
  }

  async getTasks() {
    return currentPage().locator('div[id="tasks"]').first()
  }

  async getAssignedTasks() {
    return (await this.getTasks()).locator("table tr td:first-child").all()
  }

  async getEditOrganizationButton() {
    return currentPage().locator("//a[text()='Edit']").first()
  }

  async getEditAttachmentsButton() {
    return await currentPage().locator("#edit-attachments").first()
  }

  async getEditableTasks() {
    return currentPage().locator('div[id="fg-tasks"]').first()
  }

  async getEditableAssignedTasks() {
    return (await this.getEditableTasks())
      .locator("table tr td:first-child")
      .all()
  }

  async waitForAssessmentModalForm(reverse = false) {
    // wait for modal animation to finish
    await waitFor(await this.getAssessmentModalForm(), "attached", {
      reverse,
      timeout: 20000
    })
    await waitFor(await this.getAssessmentModalForm(), "visible")
  }

  async getAddAssessmentButton(assessmentKey, recurrence) {
    // get the add assessment button for latest assessable period (previous period)
    return (await this.getAssessmentsTable(assessmentKey, recurrence))
      .locator("tbody > tr:last-child > td:nth-child(2) > button")
      .first()
  }

  async getEditAssessmentButton() {
    return currentPage()
      .locator('div.card button[title="Edit assessment"]')
      .first()
  }

  async getDeleteAssessmentButton() {
    return currentPage()
      .locator("div.card button.btn.btn-outline-danger.btn-xs")
      .first()
  }

  async getAssessmentsTable(assessmentKey, recurrence) {
    return (await this.getAssessmentContainer(assessmentKey, recurrence))
      .locator("table.assessments-table")
      .first()
  }

  async getAssessmentModalForm() {
    return currentPage().locator(".modal-content form").first()
  }

  async getDeleteConfirmButton() {
    return currentPage().locator('//button[text()="Yes, I am sure"]').first()
  }

  async getSaveAssessmentButton() {
    return (await this.getAssessmentModalForm()).getByRole("button", {
      name: "Save",
      exact: true
    })
  }

  async getShownAssessmentPanel(assessmentKey, recurrence) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence))
      .locator("td:nth-child(2) .card")
      .first()
  }

  async getShownAssessmentDetails(assessmentKey, recurrence) {
    return (await this.getShownAssessmentPanel(assessmentKey, recurrence))
      .locator("div.card-body .form-control-plaintext")
      .all()
  }

  async getAssessmentContainer(assessmentKey, recurrence) {
    return currentPage()
      .locator(`#entity-assessments-results-${assessmentKey}-${recurrence}`)
      .first()
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 4 questions; process them in order
    // first wait for assessment modal to be fully rendered

    // Select first button group
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.question1'] label[for="entityAssessment.question1_${valuesArr[0]}"]`
    )

    // Select second button group
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.question2'] label[for="entityAssessment.question2_${valuesArr[1]}"]`
    )

    // Select first text editor input
    await this.fillRichTextInput(
      await this.getAssessmentModalForm(),
      "div[id='fg-entityAssessment.question3'] .editor-container > .editable",
      valuesArr[2],
      prevTextToClear?.[0]
    )

    // Select second text editor input
    await this.fillRichTextInput(
      await this.getAssessmentModalForm(),
      "div[id='fg-entityAssessment.question4'] .editor-container > .editable",
      valuesArr[3],
      prevTextToClear?.[1]
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

  async waitForDeletedAssessmentToDisappear(assessmentKey, recurrence) {
    await waitFor(
      await this.getShownAssessmentPanel(assessmentKey, recurrence),
      "attached",
      {
        reverse: true,
        timeout: 20000
      }
    )
  }

  async getAuthorizationGroupsTable() {
    return currentPage().locator("#authorizationGroups table").first()
  }

  async getAuthorizationGroup(i) {
    const agTable = await this.getAuthorizationGroupsTable()
    return agTable.locator(`tbody tr:nth-child(${i}) td:first-child a`).first()
  }

  async getEntityAvatar() {
    return currentPage()
      .locator("fieldset div.row div.text-center canvas")
      .first()
  }

  async getEventsTable() {
    return currentPage().locator(".event-collection").first()
  }

  async getEvent(i) {
    const eventsTable = await this.getEventsTable()
    return eventsTable
      .locator(`tbody tr:nth-child(${i}) td:first-child a`)
      .first()
  }

  async getEditEngagementPlanningApprovalsButton() {
    return currentPage()
      .locator(
        '//button[contains(text(), "Edit Engagement planning approvals")]'
      )
      .first()
  }

  async getEditReportPublicationApprovalsButton() {
    return currentPage()
      .locator(
        '//button[contains(text(), "Edit Report publication approvals")]'
      )
      .first()
  }

  async getEditApprovalsModal() {
    return currentPage().locator(".modal").first()
  }

  async getModalContent() {
    return currentPage().locator("div.modal-content").first()
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).locator(".btn-close").first()
  }
}

export default new ShowOrganization()
