import Page from "./page"

const PAGE_URL = "/organizations/:uuid"

class ShowOrganization extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getCreateSubOrganizationButton() {
    return browser.$('//a[text()="Create sub-organization"]')
  }

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getLongName() {
    return browser.$('div[id="longName"]')
  }

  async getLocation() {
    return browser.$('div[id="location"]')
  }

  async getProfile() {
    return browser.$('div[id="profile"]')
  }

  async hoverOverApp6Symbol() {
    const previewElement = await browser.$("#app6-symbol-preview")
    await previewElement.moveTo()
    const popover = await browser.$(".bp6-popover-content")
    await popover.waitForDisplayed()
  }

  async getApp6Value(field) {
    return browser.$(`td[id="${field}"]`)
  }

  async getLeaders() {
    return browser.$('div[id="fg-Leaders"]')
  }

  async getLeaderPosition() {
    return browser.$("div#Leaders span")
  }

  async getLeaderPositionPerson() {
    return browser.$("div#Leaders span:nth-child(2)")
  }

  async getDeputies() {
    return browser.$('div[id="fg-Deputies"]')
  }

  async getDeputyPosition() {
    return browser.$("div#Deputies span")
  }

  async getDeputyPositionPerson() {
    return browser.$("div#Deputies span:nth-child(2)")
  }

  async getTasks() {
    return browser.$('div[id="tasks"]')
  }

  async getAssignedTasks() {
    return (await this.getTasks()).$$("table tr td:first-child")
  }

  async getEditOrganizationButton() {
    return browser.$("//a[text()='Edit']")
  }

  async getEditAttachmentsButton() {
    return await browser.$("#edit-attachments")
  }

  async getEditableTasks() {
    return browser.$('div[id="fg-tasks"]')
  }

  async getEditableAssignedTasks() {
    return (await this.getEditableTasks()).$$("table tr td:first-child")
  }

  async waitForAlertSuccessToLoad() {
    if (!(await (await this.getAlertSuccess()).isDisplayed())) {
      await (await this.getAlertSuccess()).waitForExist()
      await (await this.getAlertSuccess()).waitForDisplayed()
    }
  }

  async waitForAssessmentModalForm(reverse = false) {
    await browser.pause(300) // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitForExist({ reverse, timeout: 20000 })
    await (await this.getAssessmentModalForm()).waitForDisplayed()
  }

  async getAddAssessmentButton(assessmentKey, recurrence) {
    // get the add assessment button for latest assessable period (previous period)
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      "tbody > tr:last-child > td:nth-child(2) > button"
    )
  }

  async getEditAssessmentButton() {
    return browser.$('div.card button[title="Edit assessment"]')
  }

  async getDeleteAssessmentButton() {
    return browser.$("div.card button.btn.btn-outline-danger.btn-xs")
  }

  async getAssessmentsTable(assessmentKey, recurrence) {
    return (await this.getAssessmentContainer(assessmentKey, recurrence)).$(
      "table.assessments-table"
    )
  }

  async getAssessmentModalForm() {
    return browser.$(".modal-content form")
  }

  async getDeleteConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  async getSaveAssessmentButton() {
    return (await this.getAssessmentModalForm()).$('.//button[text()="Save"]')
  }

  async getShownAssessmentPanel(assessmentKey, recurrence) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      "td:nth-child(2) .card"
    )
  }

  async getShownAssessmentDetails(assessmentKey, recurrence) {
    return (await this.getShownAssessmentPanel(assessmentKey, recurrence)).$$(
      "div.card-body .form-control-plaintext"
    )
  }

  async getAssessmentContainer(assessmentKey, recurrence) {
    return browser.$(
      `#entity-assessments-results-${assessmentKey}-${recurrence}`
    )
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 4 questions; process them in order

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
    await browser.pause(500)
    await (await this.getDeleteConfirmButton()).waitForExist()
    await (await this.getDeleteConfirmButton()).waitForDisplayed()
    await (await this.getDeleteConfirmButton()).click()
  }

  async waitForDeletedAssessmentToDisappear(assessmentKey, recurrence) {
    await browser.pause(500)
    await (
      await this.getShownAssessmentPanel(assessmentKey, recurrence)
    ).waitForExist({
      reverse: true,
      timeout: 20000
    })
  }

  async getAuthorizationGroupsTable() {
    return browser.$("#authorizationGroups table")
  }

  async getAuthorizationGroup(i) {
    const agTable = await this.getAuthorizationGroupsTable()
    return agTable.$(`tbody tr:nth-child(${i}) td:first-child a`)
  }

  async getEntityAvatar() {
    return browser.$("fieldset div.row div.text-center canvas")
  }

  async getEventsTable() {
    return browser.$(".event-collection")
  }

  async getEvent(i) {
    const eventsTable = await this.getEventsTable()
    return eventsTable.$(`tbody tr:nth-child(${i}) td:first-child a`)
  }

  async getEditEngagementPlanningApprovalsButton() {
    return browser.$(
      '//button[contains(text(), "Edit Engagement planning approvals")]'
    )
  }

  async getEditReportPublicationApprovalsButton() {
    return browser.$(
      '//button[contains(text(), "Edit Report publication approvals")]'
    )
  }

  async getEditApprovalsModal() {
    return browser.$(".modal")
  }

  async getModalContent() {
    return browser.$("div.modal-content")
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).$(".btn-close")
  }
}

export default new ShowOrganization()
