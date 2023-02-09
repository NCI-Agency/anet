import Page from "./page"

class ShowPerson extends Page {
  getEditButton() {
    return browser.$("div a.edit-person")
  }

  getCompactView() {
    return browser.$(".compact-view")
  }

  getCompactViewButton() {
    return browser.$("button[value='compactView']")
  }

  getPrintButton() {
    return browser.$("button[value='print']")
  }

  getDetailedViewButton() {
    return browser.$("button[value='detailedView']")
  }

  getOptionalFieldsButton() {
    return browser.$('//button[text()="Optional Fields ⇓"]')
  }

  getClearAllButton() {
    return browser.$('//button[text()="Clear All"]')
  }

  getSelectAllButton() {
    return browser.$('//button[text()="Select All"]')
  }

  getPresetsButton() {
    return browser.$("#presetsButton")
  }

  getDefaultPreset() {
    return browser.$('//a[text()="Default"]')
  }

  getWithoutSensitivePreset() {
    return browser.$('//a[text()="Exclude sensitive fields"]')
  }

  getSensitiveInformationWarning() {
    return this.getCompactView().$('//span[text()="Sensitive Information"]')
  }

  getLeftColumnNumber() {
    return browser.$("#leftColumnNumber")
  }

  getLeftTableFields() {
    return this.getCompactView().$$(".left-table > tr")
  }

  getAssessmentsTable() {
    return this.getQuarterlyAssessmentContainer().$("table.assessments-table")
  }

  getAddPeriodicAssessmentButton() {
    // get the add assessment button for latest assessable period (previous period)
    return this.getAssessmentsTable().$(
      "tbody > tr:last-child > td:nth-child(2) > button"
    )
  }

  getEditAssessmentButton() {
    return browser.$('div.card button[title="Edit assessment"]')
  }

  getDeleteAssessmentButton() {
    return browser.$("div.card button.btn.btn-outline-danger.btn-xs")
  }

  getDeleteConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  getAssessmentModalForm() {
    return browser.$(".modal-content form")
  }

  getSaveAssessmentButton() {
    return this.getAssessmentModalForm().$('//button[text()="Save"]')
  }

  getShownAssessmentPanel() {
    return this.getAssessmentsTable().$("td:nth-child(2) .card")
  }

  getShownAssessmentDetails() {
    return this.getShownAssessmentPanel().$$(
      "div.card-body .form-control-plaintext"
    )
  }

  getQuarterlyAssessmentContainer() {
    return browser.$("#entity-assessments-results-quarterly")
  }

  getPoliticalPosition() {
    return browser.$('div[name="formSensitiveFields.politicalPosition"]')
  }

  getBirthday() {
    return browser.$('div[name="formSensitiveFields.birthday"]')
  }

  getInvalidFeedback() {
    return browser.$$('//div[@class="invalid-feedback"]')
  }

  getTopLevelQuestionSetTitle() {
    return browser.$('//h4/span[contains(text(),"Top Level Question Set")]')
  }

  getBottomLevelQuestionSetTitle() {
    return browser.$('//h4/span[contains(text(),"Bottom Level Question Set")]')
  }

  pickACompactField(field) {
    browser.$(`#${field}`).click()
  }

  waitForCompactField(reverse, ...fields) {
    fields.forEach(field => {
      this.getCompactView()
        .$(`//th[text()="${field}"]`)
        .waitForDisplayed({ reverse: reverse })
    })
  }

  waitForAssessmentModalForm(reverse = false) {
    browser.pause(300) // wait for modal animation to finish
    this.getAssessmentModalForm().waitForExist({ reverse, timeout: 20000 })
    this.getAssessmentModalForm().waitForDisplayed()
  }

  fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // Second value in the valuesArr is the text editor value
    const buttonGroupValues = valuesArr.filter((value, index) => index !== 1)
    const textInputValue = valuesArr[1]
    this.getAssessmentModalForm()
      .$$(".modal-content .btn-group")
      .forEach((btnGroup, index) => {
        const button = btnGroup.$(
          `label[for$=".test${index + 1}_${buttonGroupValues[index]}"]`
        )
        // wait for a bit, clicks and do double click, sometimes it does not go through
        browser.pause(300)
        button.click({ x: 10, y: 10 })
        button.click({ x: 10, y: 10 })
        browser.pause(300)
      })

    // first focus on the text editor input
    this.getAssessmentModalForm().$(".editor-container > .editable").click()
    // Wait for the editor to be focused
    browser.pause(300)
    if (prevTextToClear) {
      this.deleteText(prevTextToClear)
      // Wait for the previous value to be deleted
      browser.pause(300)
    }
    // fourth value is the text field
    browser.keys(textInputValue)
    browser.pause(300)
  }

  saveAssessmentAndWaitForModalClose(detail0ToWaitFor) {
    this.getSaveAssessmentButton().click()
    browser.pause(300) // wait for modal animation to finish
    this.getAssessmentModalForm().waitForExist({
      reverse: true,
      timeout: 20000
    })
    // wait until details to change, can take some time to update show page
    browser.waitUntil(
      () => {
        return (
          this.getShownAssessmentDetails()[0].getText() === detail0ToWaitFor
        )
      },
      {
        timeout: 20000,
        timeoutMsg: "Expected change after save"
      }
    )
  }

  confirmDelete() {
    browser.pause(500)
    this.getDeleteConfirmButton().waitForExist()
    this.getDeleteConfirmButton().waitForDisplayed()
    this.getDeleteConfirmButton().click()
  }

  waitForDeletedAssessmentToDisappear() {
    browser.pause(500)
    this.getShownAssessmentPanel().waitForExist({
      reverse: true,
      timeout: 20000
    })
  }

  getValidationErrorMessages() {
    return this.getInvalidFeedback().map(errorDiv => errorDiv.getText())
  }
}

export default new ShowPerson()
