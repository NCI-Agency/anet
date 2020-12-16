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

  get addPeriodicAssessmentButton() {
    // get the add assessment button for first period on the table
    return this.monthlyAssessmentsTable.$(
      '//tbody//tr[3]//td[1]//button[contains(text(),"Make a new")]'
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

  get successfulDeleteMessage() {
    return browser.$('//div[@role="alert" and text()="Successfully deleted"]')
  }

  get assessmentModalForm() {
    return browser.$(".modal-content form")
  }

  get saveAssessmentButton() {
    return this.assessmentModalForm.$('//button[text()="Save"]')
  }

  get shownAssessmentDetails() {
    return this.monthlyAssessmentsTable.$$(
      "td:first-child .panel-primary div.form-control-static"
    )
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

    this.assessmentModalForm
      .$(".form-group .btn-group")
      .$(`label[id="${valuesArr[1]}"]`)
      .click({ x: 10, y: 10 })
  }

  saveAssessmentAndWaitForModalClose(detail0ToWaitFor) {
    this.saveAssessmentButton.click()
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
}

export default new ShowTask()
