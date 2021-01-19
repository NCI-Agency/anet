import Page from "./page"

class ShowPerson extends Page {
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
    return browser.$('div.panel-primary button[title="Edit assessment"]')
  }

  get deleteAssessmentButton() {
    return browser.$('div.panel-primary button[title="Delete assessment"]')
  }

  get deleteConfirmButton() {
    return browser.$('//button[contains(text(), "I am sure")]')
  }

  get assessmentModalForm() {
    return browser.$(".modal-content form")
  }

  get saveAssessmentButton() {
    return this.assessmentModalForm.$('//button[text()="Save"]')
  }

  get shownAssessmentPanel() {
    return this.assessmentsTable.$("td:nth-child(2) .panel-primary")
  }

  get shownAssessmentDetails() {
    return this.shownAssessmentPanel.$$("div.form-control-static")
  }

  get quarterlyAssessmentContainer() {
    return browser.$("#entity-assessments-results-quarterly")
  }

  waitForAssessmentModalForm(reverse = false) {
    browser.pause(300) // wait for modal animation to finish
    this.assessmentModalForm.waitForExist({ reverse, timeout: 20000 })
    this.assessmentModalForm.waitForDisplayed()
  }

  fillAssessmentQuestion(valuesArr, prevTextToClear) {
    this.assessmentModalForm
      .$$(".form-group .btn-group")
      .forEach((btnGroup, index) => {
        const button = btnGroup.$(`label[id="${valuesArr[index]}"]`)
        // wait for a bit, clicks and do double click, sometimes it does not go through
        browser.pause(300)
        button.click({ x: 10, y: 10 })
        button.click({ x: 10, y: 10 })
        browser.pause(300)
      })

    // first focus on the text editor input
    this.assessmentModalForm.$(".DraftEditor-editorContainer").click()
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
