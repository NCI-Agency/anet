import Page from "./page"

class ShowPerson extends Page {
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
    // Second value in the valuesArr is the text editor value
    const buttonGroupValues = valuesArr.filter((value, index) => index !== 1)
    const textInputValue = valuesArr[1]
    const buttonGroups = await (
      await this.getAssessmentModalForm()
    ).$$(".modal-content .btn-group")
    for (const [index, btnGroup] of buttonGroups.entries()) {
      const button = await btnGroup.$(
        `label[for$=".test${index + 1}_${buttonGroupValues[index]}"]`
      )
      // wait for a bit, clicks and do double click, sometimes it does not go through
      await browser.pause(300)
      await button.click({ x: 10, y: 10 })
      await button.click({ x: 10, y: 10 })
      await browser.pause(300)
    }

    // first focus on the text editor input
    await (
      await (
        await this.getAssessmentModalForm()
      ).$(".editor-container > .editable")
    ).click()
    // Wait for the editor to be focused
    await browser.pause(300)
    if (prevTextToClear) {
      await this.deleteText(prevTextToClear)
      // Wait for the previous value to be deleted
      await browser.pause(300)
    }
    // fourth value is the text field
    await browser.keys(textInputValue)
    await browser.pause(300)
  }

  async saveAssessmentAndWaitForModalClose(
    assessmentKey,
    recurrence,
    detail0ToWaitFor
  ) {
    await (await this.getSaveAssessmentButton()).click()
    await browser.pause(300) // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitForExist({
      reverse: true,
      timeout: 20000
    })
    // wait until details to change, can take some time to update show page
    await browser.waitUntil(
      async() => {
        return (
          (await (
            await this.getShownAssessmentDetails(assessmentKey, recurrence)
          )[0].getText()) === detail0ToWaitFor
        )
      },
      {
        timeout: 20000,
        timeoutMsg: "Expected change after save"
      }
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
    return Promise.all(
      (await this.getInvalidFeedback()).map(
        async errorDiv => await errorDiv.getText()
      )
    )
  }
}

export default new ShowPerson()
