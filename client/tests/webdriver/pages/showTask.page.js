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
    // get the add assessment button for latest assessable period (previous period)
    return this.monthlyAssessmentsTable.$$("tbody tr:last-child td")[1]
  }

  get editAssessmentButton() {
    return browser.$('div.panel-primary button[title="Edit assessment"]')
  }

  get assessmentModalForm() {
    return browser.$(".modal-content form")
  }

  get saveAssessmentButton() {
    return this.assessmentModalForm.$('//button[text()="Save"]')
  }

  get shownAssessmentDetails() {
    return this.monthlyAssessmentsTable.$$(
      "td .panel-primary div.form-control-static"
    )
  }

  fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 2 questions
    // first focus on the text editor input
    this.assessmentModalForm.$(".DraftEditor-editorContainer").click()
    if (prevTextToClear) {
      const chars = prevTextToClear.split("")
      browser.keys(chars.map(char => "Backspace"))
    }
    browser.keys(valuesArr[0])

    this.assessmentModalForm
      .$(".form-group .btn-group")
      .$(`label[id="${valuesArr[1]}"]`)
      .click()
  }

  saveAssessmentAndWaitForModalClose() {
    this.saveAssessmentButton.click()
    this.assessmentModalForm.waitForExist({ reverse: true, timeout: 20000 })
  }
}

export default new ShowTask()
