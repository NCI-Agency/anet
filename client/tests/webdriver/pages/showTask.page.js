import Page from "./page"

const PAGE_URL = "/tasks/:uuid"

class ShowTask extends Page {
  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getShortName() {
    return browser.$(".title-text")
  }

  async getLongName() {
    return browser.$('div[id="longName"]')
  }

  async getParentTask() {
    return browser.$('div[id="parentTask"]')
  }

  async getParentTaskField() {
    return browser.$("#fg-parentTask")
  }

  async getChildrenTasks() {
    return browser.$('div[id="subTasks"]')
  }

  async getChildrenTasksField() {
    return browser.$("#fg-subTasks")
  }

  async getFirstItemFromChildrenTasks() {
    return browser.$("#subTasks > .list-group .list-group-item:first-child")
  }

  async getAssessmentResults(assessmentKey, recurrence) {
    return browser.$(
      `#entity-assessments-results-${assessmentKey}-${recurrence}`
    )
  }

  async getDescription() {
    return browser.$('div[id="description"]')
  }

  async getAssessmentsTable(assessmentKey, recurrence) {
    return (await this.getAssessmentResults(assessmentKey, recurrence)).$(
      "table.assessments-table"
    )
  }

  async getAddAssessmentButton(assessmentKey, recurrence) {
    // get the add assessment button for first period on the table
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      "tbody > tr > td:first-child > button"
    )
  }

  async getNextPeriodButton(assessmentKey, recurrence) {
    return (await this.getAssessmentResults(assessmentKey, recurrence)).$(
      "button:last-child"
    )
  }

  async getFutureAddAssessmentButton(assessmentKey, recurrence) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      "tbody tr:last-child td:last-child button"
    )
  }

  async getEditAssessmentButton(assessmentKey, recurrence) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      'div.card button[title="Edit assessment"]'
    )
  }

  async getDeleteAssessmentButton() {
    return browser.$("div.card button.btn.btn-outline-danger.btn-xs")
  }

  async getDeleteConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  async getAssessmentModalForm() {
    return browser.$(".modal-content form")
  }

  async getSaveAssessmentButton() {
    return (await this.getAssessmentModalForm()).$('//button[text()="Save"]')
  }

  async getShownAssessmentPanel(assessmentKey, recurrence) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      "tbody tr:nth-child(2) td:first-child .card"
    )
  }

  async getShownAssessmentDetails(assessmentKey, recurrence) {
    return (await this.getShownAssessmentPanel(assessmentKey, recurrence)).$$(
      "div.card-body .form-control-plaintext"
    )
  }

  async waitForAssessmentModalForm(reverse = false) {
    await browser.pause(300) // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitForExist({ reverse, timeout: 20000 })
    await (await this.getAssessmentModalForm()).waitForDisplayed()
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 2 questions; process them in order

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
}

export default new ShowTask()
