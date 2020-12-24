import Page from "./page"

class ShowTask extends Page {
  get assessmentResultsMonthly() {
    return browser.$("#entity-assessments-results-monthly")
  }

  get assessmentResultsWeekly() {
    return browser.$("#entity-assessments-results-weekly")
  }

  get monthlyAssessmentsTable() {
    return this.assessmentResultsMonthly.$("table.assessments-table")
  }

  get addMonthlyAssessmentButton() {
    // get the add assessment button for first period on the table
    return this.monthlyAssessmentsTable.$(
      "tbody > tr > td:first-child > button"
    )
  }

  get editMonthlyAssessmentButton() {
    return this.monthlyAssessmentsTable.$(
      'div.panel-primary button[title="Edit assessment"]'
    )
  }

  get deleteMonthlyAssessmentButton() {
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
    return this.monthlyAssessmentsTable.$("td:first-child .panel-primary")
  }

  get shownAssessmentDetails() {
    return this.shownAssessmentPanel.$$("div.form-control-static")
  }

  waitForAssessmentModalForm(reverse = false) {
    browser.pause(300) // wait for modal animation to finish
    this.assessmentModalForm.waitForExist({ reverse, timeout: 20000 })
    this.assessmentModalForm.waitForDisplayed()
  }

  fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 2 questions
    // first focus on the text editor input
    this.assessmentModalForm.$(".DraftEditor-editorContainer").click()
    if (prevTextToClear) {
      // remove previous text by deleting characters one by one
      const chars = [...prevTextToClear]
      browser.keys(chars.map(char => "Backspace"))
      // maybe we clicked at the beginning of the text, Backspace doesn't clear
      browser.keys(chars.map(char => "Delete"))
    }
    browser.keys(valuesArr[0])

    const button = this.assessmentModalForm
      .$(".form-group .btn-group")
      .$(`label[id="${valuesArr[1]}"]`)
    // wait for a bit, clicks and do double click, sometimes it does not go through
    browser.pause(300)
    button.click({ x: 10, y: 10 })
    button.click({ x: 10, y: 10 })
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
        timeout: 5000,
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

export default new ShowTask()
