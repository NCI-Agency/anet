import Page from "./page"

const PAGE_URL = "/people/:uuid"

class ShowPerson extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async getEditButton() {
    return browser.$("div a.edit-person")
  }

  async getCompactView() {
    return browser.$(".compact-view")
  }

  async getCompactViewButton() {
    return browser.$("button[value='compactView']")
  }

  async getPrintButton() {
    return browser.$("button[value='print']")
  }

  async getDetailedViewButton() {
    return browser.$("button[value='detailedView']")
  }

  async getOptionalFieldsButton() {
    return browser.$('//button[text()="Optional Fields ⇓"]')
  }

  async getClearAllButton() {
    return browser.$('//button[text()="Clear All"]')
  }

  async getSelectAllButton() {
    return browser.$('//button[text()="Select All"]')
  }

  async getPresetsButton() {
    return browser.$("#presetsButton")
  }

  async getDefaultPreset() {
    return browser.$('//a[text()="Default"]')
  }

  async getWithoutSensitivePreset() {
    return browser.$('//a[text()="Exclude sensitive fields"]')
  }

  async getSensitiveInformationWarning() {
    return (await this.getCompactView()).$(
      '//span[text()="Sensitive Information"]'
    )
  }

  async getLeftColumnNumber() {
    return browser.$("#leftColumnNumber")
  }

  async getLeftTableFields() {
    return (await this.getCompactView()).$$(".left-table > tr")
  }

  async getAssessmentsTable(assessmentKey, recurrence) {
    return (await this.getAssessmentContainer(assessmentKey, recurrence)).$(
      "table.assessments-table"
    )
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

  async getPoliticalPosition() {
    return browser.$('div[name="formSensitiveFields.politicalPosition"]')
  }

  async getBirthday() {
    return browser.$('div[name="formSensitiveFields.birthday"]')
  }

  async getInvalidFeedback() {
    return browser.$$('//div[@class="invalid-feedback"]')
  }

  async getTopLevelQuestionSetTitle() {
    return browser.$('//h4/span[contains(text(),"Top Level Question Set")]')
  }

  async getBottomLevelQuestionSetTitle() {
    return browser.$('//h4/span[contains(text(),"Bottom Level Question Set")]')
  }

  async pickACompactField(field) {
    await (await browser.$(`#${field}`)).click()
  }

  async waitForCompactField(reverse, ...fields) {
    for (const field of fields) {
      await (
        await (await this.getCompactView()).$(`//th[text()="${field}"]`)
      ).waitForDisplayed({ reverse })
    }
  }

  async waitForAssessmentModalForm(reverse = false) {
    await browser.pause(300) // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitForExist({ reverse, timeout: 20000 })
    await (await this.getAssessmentModalForm()).waitForDisplayed()
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 4 questions; process them in order

    // Select first button
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.test1'] label[for="entityAssessment.test1_${valuesArr[0]}"]`
    )

    // Select text editor input
    await this.fillRichTextInput(
      await this.getAssessmentModalForm(),
      "div[id='fg-entityAssessment.text'] .editor-container > .editable",
      valuesArr[1],
      prevTextToClear
    )

    // Select second button
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.questionSets.topLevelQs.questions.test2'] label[for="entityAssessment.questionSets.topLevelQs.questions.test2_${valuesArr[2]}"]`
    )

    // Select third button
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3'] label[for="entityAssessment.questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3_${valuesArr[3]}"]`
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

  async getValidationErrorMessages() {
    return await (
      await this.getInvalidFeedback()
    ).map(async errorDiv => await errorDiv.getText())
  }
}

export default new ShowPerson()
