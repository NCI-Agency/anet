import Page from "./page"

class ShowPerson extends Page {
  get assessmentsTable() {
    return this.quarterlyAssessmentContainer.$("table.assessments-table")
  }

  get addPeriodicAssessmentButton() {
    // get the add assessment button for latest assessable period (previous period)
    return this.assessmentsTable.$$("tbody tr:last-child td")[1]
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
    return this.assessmentsTable.$$("td .panel-primary div.form-control-static")
  }

  get quarterlyAssessmentContainer() {
    return browser.$("#entity-assessments-results-quarterly")
  }

  fillAssessmentQuestion(valuesArr) {
    // Use the value 3 it is in all of them
    this.assessmentModalForm
      .$$(".form-group .btn-group")
      .forEach((btnGroup, index) => {
        btnGroup.$(`label[id="${valuesArr[index]}"]`).click()
      })
  }

  saveAssessmentAndWaitForModalClose() {
    this.saveAssessmentButton.click()
    this.assessmentModalForm.waitForExist({ reverse: true, timeout: 20000 })
  }
}

export default new ShowPerson()
