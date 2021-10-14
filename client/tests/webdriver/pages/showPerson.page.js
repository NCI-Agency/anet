import Page from "./page"

class ShowPerson extends Page {
  get editButton() {
    return browser.$("div a.edit-person")
  }

  get compactView() {
    return browser.$(".compact-view")
  }

  get compactViewButton() {
    return browser.$("button[value='compactView']")
  }

  get printButton() {
    return browser.$("button[value='print']")
  }

  get detailedViewButton() {
    return browser.$("button[value='detailedView']")
  }

  get optionalFieldsButton() {
    return browser.$('//button[text()="Optional Fields ⇓"]')
  }

  get clearAllButton() {
    return browser.$('//button[text()="Clear All"]')
  }

  get selectAllButton() {
    return browser.$('//button[text()="Select All"]')
  }

  get presetsButton() {
    return browser.$("#presetsButton")
  }

  get defaultPreset() {
    return browser.$('//a[text()="Default"]')
  }

  get withoutSensitivePreset() {
    return browser.$('//a[text()="Exclude sensitive fields"]')
  }

  get sensitiveInformationWarning() {
    return this.compactView.$('//span[text()="Sensitive Information"]')
  }

  get leftColumnNumber() {
    return browser.$("#leftColumnNumber")
  }

  get leftTableFields() {
    return this.compactView.$$(".left-table > tr")
  }

  get assessmentsTable() {
    return this.quarterlyAssessmentContainer.$("table.assessments-table")
  }

  get addPeriodicAssessmentButton() {
    // get the add assessment button for latest assessable period (previous period)
    return this.assessmentsTable.$(
      "tbody > tr:last-child > td:nth-child(2) > button"
    )
  }

  get editAssessmentButton() {
    return browser.$('div.card button[title="Edit assessment"]')
  }

  get deleteAssessmentButton() {
    return browser.$("div.card button.btn.btn-outline-danger.btn-xs")
  }

  get deleteConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  get assessmentModalForm() {
    return browser.$(".modal-content form")
  }

  get saveAssessmentButton() {
    return this.assessmentModalForm.$('//button[text()="Save"]')
  }

  get shownAssessmentPanel() {
    return this.assessmentsTable.$("td:nth-child(2) .card")
  }

  get shownAssessmentDetails() {
    return this.shownAssessmentPanel.$$("div.card-body .form-control-plaintext")
  }

  get quarterlyAssessmentContainer() {
    return browser.$("#entity-assessments-results-quarterly")
  }

  get politicalPosition() {
    return browser.$('div[name="formSensitiveFields.politicalPosition"]')
  }

  get birthday() {
    return browser.$('div[name="formSensitiveFields.birthday"]')
  }

  pickACompactField(field) {
    browser.$(`#${field}`).click()
  }

  waitForCompactField(reverse, ...fields) {
    fields.forEach(field => {
      this.compactView
        .$(`//th[text()="${field}"]`)
        .waitForDisplayed({ reverse: reverse })
    })
  }

  waitForAssessmentModalForm(reverse = false) {
    browser.pause(300) // wait for modal animation to finish
    this.assessmentModalForm.waitForExist({ reverse, timeout: 20000 })
    this.assessmentModalForm.waitForDisplayed()
  }

  fillAssessmentQuestion(valuesArr, prevTextToClear) {
    this.assessmentModalForm
      .$$(".modal-content .btn-group")
      .forEach((btnGroup, index) => {
        const button = btnGroup.$(
          `label[for$=".test${index + 1}_${valuesArr[index]}"]`
        )
        // wait for a bit, clicks and do double click, sometimes it does not go through
        browser.pause(300)
        button.click({ x: 10, y: 10 })
        button.click({ x: 10, y: 10 })
        browser.pause(300)
      })

    // first focus on the text editor input
    this.assessmentModalForm.$(".editor-container > .editable").click()
    if (prevTextToClear) {
      // remove previous text by deleting characters one by one
      const chars = [...prevTextToClear]
      browser.keys(chars.map(char => "Backspace"))
      // maybe we clicked at the beginning of the text, Backspace doesn't clear
      browser.keys(chars.map(char => "Delete"))
    }
    // fourth value is the text field
    browser.keys(valuesArr[3])
    browser.pause(300)
  }

  saveAssessmentAndWaitForModalClose(detail0ToWaitFor) {
    this.saveAssessmentButton.click()
    browser.pause(300) // wait for modal animation to finish
    this.assessmentModalForm.waitForExist({ reverse: true, timeout: 20000 })
    // wait until details to change, can take some time to update show page
    browser.waitUntil(
      () => {
        return this.shownAssessmentDetails[0].getText() === detail0ToWaitFor
      },
      {
        timeout: 20000,
        timeoutMsg: "Expected change after save"
      }
    )
  }

  confirmDelete() {
    browser.pause(500)
    this.deleteConfirmButton.waitForExist()
    this.deleteConfirmButton.waitForDisplayed()
    this.deleteConfirmButton.click()
  }

  waitForDeletedAssessmentToDisappear() {
    browser.pause(500)
    this.shownAssessmentPanel.waitForExist({
      reverse: true,
      timeout: 20000
    })
  }
}

export default new ShowPerson()
