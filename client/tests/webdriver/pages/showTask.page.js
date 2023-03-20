import Page from "./page"

class ShowTask extends Page {
  async getAssessmentResultsMonthly() {
    return browser.$("#entity-assessments-results-monthly")
  }

  async getAssessmentResultsWeekly() {
    return browser.$("#entity-assessments-results-weekly")
  }

  async getLongName() {
    return browser.$('div[id="longName"')
  }

  async getShortName() {
    return browser.$('div[id="shortName"')
  }

  async getDescription() {
    return browser.$('div[id="description"')
  }

  async getMonthlyAssessmentsTable() {
    return (await this.getAssessmentResultsMonthly()).$(
      "table.assessments-table"
    )
  }

  async getAddMonthlyAssessmentButton() {
    // get the add assessment button for first period on the table
    return (await this.getMonthlyAssessmentsTable()).$(
      "tbody > tr > td:first-child > button"
    )
  }

  async getEditMonthlyAssessmentButton() {
    return (await this.getMonthlyAssessmentsTable()).$(
      'div.card button[title="Edit assessment"]'
    )
  }

  async getDeleteMonthlyAssessmentButton() {
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

  async getShownAssessmentPanel() {
    return (await this.getMonthlyAssessmentsTable()).$(
      "tbody tr:last-child td:first-child .card"
    )
  }

  async getShownAssessmentDetails() {
    return (await this.getShownAssessmentPanel()).$$(
      "div.card-body .form-control-plaintext"
    )
  }

  async waitForAssessmentModalForm(reverse = false) {
    await browser.pause(300) // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitForExist({ reverse, timeout: 20000 })
    await (await this.getAssessmentModalForm()).waitForDisplayed()
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 2 questions
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
    await browser.keys(valuesArr[0])

    const button = await (await this.getAssessmentModalForm())
      .$(".btn-group")
      .$(`label[for="entityAssessment.status_${valuesArr[1]}"]`)
    // wait for a bit, clicks and do double click, sometimes it does not go through
    await browser.pause(300)
    await button.click({ x: 10, y: 10 })
    await button.click({ x: 10, y: 10 })
    await browser.pause(300)
  }

  async saveAssessmentAndWaitForModalClose(detail0ToWaitFor) {
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
          (await (await this.getShownAssessmentDetails())[0].getText()) ===
          detail0ToWaitFor
        )
      },
      {
        timeout: 5000,
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

  async waitForDeletedAssessmentToDisappear() {
    await browser.pause(500)
    await (
      await this.getShownAssessmentPanel()
    ).waitForExist({
      reverse: true,
      timeout: 20000
    })
  }
}

export default new ShowTask()
