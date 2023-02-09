import Page from "./page"

class ShowTask extends Page {
  getAssessmentResultsMonthly() {
    return browser.$("#entity-assessments-results-monthly")
  }

  getAssessmentResultsWeekly() {
    return browser.$("#entity-assessments-results-weekly")
  }

  getMonthlyAssessmentsTable() {
    return this.getAssessmentResultsMonthly().$("table.assessments-table")
  }

  getAddMonthlyAssessmentButton() {
    // get the add assessment button for first period on the table
    return this.getMonthlyAssessmentsTable().$(
      "tbody > tr > td:first-child > button"
    )
  }

  getEditMonthlyAssessmentButton() {
    return this.getMonthlyAssessmentsTable().$(
      'div.card button[title="Edit assessment"]'
    )
  }

  getDeleteMonthlyAssessmentButton() {
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
    return this.getMonthlyAssessmentsTable().$(
      "tbody tr:last-child td:first-child .card"
    )
  }

  getShownAssessmentDetails() {
    return this.getShownAssessmentPanel().$$(
      "div.card-body .form-control-plaintext"
    )
  }

  waitForAssessmentModalForm(reverse = false) {
    browser.pause(300) // wait for modal animation to finish
    this.getAssessmentModalForm().waitForExist({ reverse, timeout: 20000 })
    this.getAssessmentModalForm().waitForDisplayed()
  }

  fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 2 questions
    // first focus on the text editor input
    this.getAssessmentModalForm().$(".editor-container > .editable").click()
    // Wait for the editor to be focused
    browser.pause(300)
    if (prevTextToClear) {
      this.deleteText(prevTextToClear)
      // Wait for the previous value to be deleted
      browser.pause(300)
    }
    browser.keys(valuesArr[0])

    const button = this.getAssessmentModalForm()
      .$(".btn-group")
      .$(`label[for="entityAssessment.status_${valuesArr[1]}"]`)
    // wait for a bit, clicks and do double click, sometimes it does not go through
    browser.pause(300)
    button.click({ x: 10, y: 10 })
    button.click({ x: 10, y: 10 })
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
        timeout: 5000,
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
}

export default new ShowTask()
