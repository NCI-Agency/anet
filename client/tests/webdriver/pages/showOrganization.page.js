import Page from "./page"

class ShowOrganization extends Page {
  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getLongName() {
    return browser.$('div[id="longName"]')
  }

  async getLocation() {
    return browser.$('div[id="location"]')
  }

  async getProfile() {
    return browser.$('div[id="profile"]')
  }

  async getType() {
    return browser.$('div[id="type"]')
  }

  async getLeaders() {
    return browser.$('div[id="fg-Leaders"]')
  }

  async getLeaderPosition() {
    return browser.$("div#Leaders span")
  }

  async getLeaderPositionPerson() {
    return browser.$("div#Leaders span:nth-child(2)")
  }

  async getDeputies() {
    return browser.$('div[id="fg-Deputies"]')
  }

  async getDeputyPosition() {
    return browser.$("div#Deputies span")
  }

  async getDeputyPositionPerson() {
    return browser.$("div#Deputies span:nth-child(2)")
  }

  async waitForAlertSuccessToLoad() {
    if (!(await (await this.getAlertSuccess()).isDisplayed())) {
      await (await this.getAlertSuccess()).waitForExist()
      await (await this.getAlertSuccess()).waitForDisplayed()
    }
  }

  async waitForAssessmentModalForm(reverse = false) {
    await browser.pause(300) // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitForExist({ reverse, timeout: 20000 })
    await (await this.getAssessmentModalForm()).waitForDisplayed()
  }

  async getAddAssessmentButton(assessmentKey, recurrence) {
    // get the add assessment button for latest assessable period (previous period)
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      "tbody > tr:last-child > td:nth-child(2) > button"
    )
  }

  async getEditAssessmentButton() {
    return browser.$('div.card button[title="Edit assessment"]')
  }

  async getDeleteAssessmentButton() {
    return browser.$("div.card button.btn.btn-outline-danger.btn-xs")
  }

  async getAssessmentsTable(assessmentKey, recurrence) {
    return (await this.getAssessmentContainer(assessmentKey, recurrence)).$(
      "table.assessments-table"
    )
  }

  async getAssessmentModalForm() {
    return browser.$(".modal-content form")
  }

  async getDeleteConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  async getSaveAssessmentButton() {
    return (await this.getAssessmentModalForm()).$('//button[text()="Save"]')
  }

  async getShownAssessmentPanel(assessmentKey, recurrence) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      "td:nth-child(2) .card"
    )
  }

  async getShownAssessmentDetails(assessmentKey, recurrence) {
    return (await this.getShownAssessmentPanel(assessmentKey, recurrence)).$$(
      "div.card-body .form-control-plaintext"
    )
  }

  async getAssessmentContainer(assessmentKey, recurrence) {
    return browser.$(
      `#entity-assessments-results-${assessmentKey}-${recurrence}`
    )
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 4 questions
    // first focus on the text editor input
    await (
      await (
        await this.getAssessmentModalForm()
      ).$(
        "div[id='fg-entityAssessment.question3'] .editor-container > .editable"
      )
    ).click()
    // Wait for the editor to be focused
    await browser.pause(300)
    if (prevTextToClear && prevTextToClear[0]) {
      await this.deleteText(prevTextToClear[0])
      // Wait for the previous value to be deleted
      await browser.pause(300)
    }
    await browser.keys(valuesArr[2])

    // focus on the second text editor input
    await (
      await (
        await this.getAssessmentModalForm()
      ).$(
        "div[id='fg-entityAssessment.question4'] .editor-container > .editable"
      )
    ).click()
    // Wait for the editor to be focused
    await browser.pause(300)
    if (prevTextToClear && prevTextToClear[1]) {
      await this.deleteText(prevTextToClear[1])
      // Wait for the previous value to be deleted
      await browser.pause(300)
    }
    await browser.keys(valuesArr[3])

    // Select first button group
    const buttonPriority = await (
      await this.getAssessmentModalForm()
    ).$(
      `div[id='fg-entityAssessment.question1'] label[for="entityAssessment.question1_${valuesArr[0]}"]`
    )
    // wait for a bit, clicks and do double click, sometimes it does not go through
    await browser.pause(300)
    await buttonPriority.click({ x: 10, y: 10 })
    await buttonPriority.click({ x: 10, y: 10 })
    await browser.pause(300)

    // Select second button group
    const buttonInteraction = await (
      await this.getAssessmentModalForm()
    ).$(
      `div[id='fg-entityAssessment.question2'] label[for="entityAssessment.question2_${valuesArr[1]}"]`
    )
    // wait for a bit, clicks and do double click, sometimes it does not go through
    await browser.pause(300)
    await buttonInteraction.click({ x: 10, y: 10 })
    await buttonInteraction.click({ x: 10, y: 10 })
    await browser.pause(300)
  }

  async saveAssessmentAndWaitForModalClose(
    assessmentKey,
    recurrence,
    detail0ToWaitFor
  ) {
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
          (await (
            await this.getShownAssessmentDetails(assessmentKey, recurrence)
          )[0].getText()) === detail0ToWaitFor
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

  async waitForDeletedAssessmentToDisappear(assessmentKey, recurrence) {
    await browser.pause(500)
    await (
      await this.getShownAssessmentPanel(assessmentKey, recurrence)
    ).waitForExist({
      reverse: true,
      timeout: 20000
    })
  }
}

export default new ShowOrganization()
