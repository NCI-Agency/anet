import Page from "./page"

class ShowPerson extends Page {
  get assessmentsTable() {
    return this.quarterlyAssessmentContainer.$("table.assessments-table")
  }

  get addPeriodicAssessmentButton() {
    // get the add assessment button for latest assessable period (previous period)
    return this.assessmentsTable.$$("tbody tr:last-child td")[1].$("button")
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
    return this.assessmentsTable.$$(
      "td:nth-child(2) .panel-primary div.form-control-static"
    )
  }

  get quarterlyAssessmentContainer() {
    return browser.$("#entity-assessments-results-quarterly")
  }

  fillAssessmentQuestion(valuesArr) {
    this.assessmentModalForm
      .$$(".form-group .btn-group")
      .forEach((btnGroup, index) => {
        const button = btnGroup.$(`label[id="${valuesArr[index]}"]`)
        // sometimes misfires, lets wait a bit
        button.waitForExist()
        button.waitForDisplayed()
        button.click({ x: 10, y: 10 })
      })
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
        timeout: 10000,
        timeoutMsg: "Expected change after save"
      }
    )
  }
}

export default new ShowPerson()
