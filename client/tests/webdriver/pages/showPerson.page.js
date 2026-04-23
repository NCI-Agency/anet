import Page from "./page"

const PAGE_URL = "/people/:uuid"

class ShowPerson extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getForm() {
    return browser.$("div.form-horizontal")
  }

  async getEditButton() {
    return browser.$("div a.edit-person")
  }

  async getCompactView() {
    return browser.$(".compact-view")
  }

  async getCompactViewButton() {
    return browser.$("button[value='compactView']")
  }

  async getPrintButton() {
    return browser.$("button[value='print']")
  }

  async getDetailedViewButton() {
    return browser.$("button[value='detailedView']")
  }

  async getOptionalFieldsButton() {
    return browser.$('//button[text()="Optional Fields"]')
  }

  async getClearAllButton() {
    return browser.$('//button[text()="Clear All"]')
  }

  async getSelectAllButton() {
    return browser.$('//button[text()="Select All"]')
  }

  async getPresetsButton() {
    return browser.$("#presetsButton")
  }

  async getEditAttachmentsButton() {
    return await browser.$("#edit-attachments")
  }

  async openAttachmentsEdit() {
    const edit = await this.getEditAttachmentsButton()
    await edit.waitForDisplayed()
    await edit.click()
    await (await this.getAttachments()).waitForExist()
  }

  async selectAttachmentToLink(caption) {
    const input = await browser.$('input[name="linkExistingAttachments"]')
    await input.waitForDisplayed()
    await input.click()
    const popover = await browser.$("#linkExistingAttachments-popover")
    await popover.waitForExist()
    const allAttachmentsFilter = await browser.$(
      '//div[@id="linkExistingAttachments-popover"]//button[text()="All attachments"]'
    )
    if (await allAttachmentsFilter.isExisting()) {
      await allAttachmentsFilter.click()
    } else {
      const filterSelect = await browser.$(
        "#linkExistingAttachments-popover select"
      )
      if (await filterSelect.isExisting()) {
        await filterSelect.selectByVisibleText("All attachments")
      }
    }
    await input.setValue(caption)
    const row = await browser.$(
      `//div[@id="linkExistingAttachments-popover"]//tbody//tr[.//td[contains(normalize-space(.), "${caption}")]]`
    )
    await row.waitForExist()
    await row.click()
  }

  async linkSelectedAttachments() {
    const button = await browser.$('//button[text()="Link selected"]')
    await button.waitForEnabled()
    await button.click()
  }

  async waitForLinkToComplete() {
    const button = await browser.$('//button[text()="Link selected"]')
    await browser.waitUntil(
      async () => {
        const text = await button.getText()
        const countExists = await browser
          .$(".attachment-link-count")
          .isExisting()
        return text === "Link selected" && !countExists
      },
      { timeout: 15000, timeoutMsg: "Expected link action to complete" }
    )
  }

  async getAttachmentCardByUuid(uuid) {
    const selector = `//div[contains(@class,"attachment-card")]//a[contains(@href,"/attachments/${uuid}/edit")]/ancestor::div[contains(@class,"attachment-card")]`
    const card = await browser.$(selector)
    await card.waitForExist({ timeout: 10000 })
    return card
  }

  async attachmentCardExistsByUuid(uuid) {
    const selector = `//div[contains(@class,"attachment-card")]//a[contains(@href,"/attachments/${uuid}/edit")]/ancestor::div[contains(@class,"attachment-card")]`
    return (await browser.$(selector)).isExisting()
  }

  async unlinkAttachmentByUuid(uuid) {
    const card = await this.getAttachmentCardByUuid(uuid)
    const unlinkButton = await card.$('button[title^="Unlink from this"]')
    await unlinkButton.waitForClickable()
    await unlinkButton.click()
  }

  async waitForAttachmentToDisappear(uuid) {
    await browser.waitUntil(
      async () => !(await this.attachmentCardExistsByUuid(uuid)),
      {
        timeout: 15000,
        timeoutMsg: `Expected attachment ${uuid} to be unlinked`
      }
    )
  }

  async ensureAttachmentUnlinked(uuid) {
    if (await this.attachmentCardExistsByUuid(uuid)) {
      await this.unlinkAttachmentByUuid(uuid)
      await this.waitForAttachmentToDisappear(uuid)
    }
  }

  async attemptDeleteAttachmentByUuid(uuid) {
    const card = await this.getAttachmentCardByUuid(uuid)
    const deleteButton = await card.$("button.btn-outline-danger")
    await deleteButton.waitForDisplayed()
    await deleteButton.click()
    const confirm = await this.getDeleteConfirmButton()
    await confirm.waitForDisplayed()
    await confirm.click()
  }

  async getDefaultPreset() {
    return browser.$('//a[text()="Default"]')
  }

  async getWithoutSensitivePreset() {
    return browser.$('//a[text()="Exclude sensitive fields"]')
  }

  async getSensitiveInformationWarning() {
    return (await this.getCompactView()).$(
      './/span[text()="Sensitive Information"]'
    )
  }

  async getLeftColumnNumber() {
    return browser.$("#leftColumnNumber")
  }

  async getLeftTableFields() {
    return (await this.getCompactView()).$$(".left-table > tr")
  }

  async getEditHistoryButton() {
    return browser.$("button.edit-history")
  }

  async getEditHistoryDialog() {
    return browser.$("div.edit-history-dialog")
  }

  async getEditHistoryStartDate(i) {
    return browser.$(`input[id="history[${i}].startTime"]`)
  }

  async getEditHistoryEndDate(i) {
    return browser.$(`input[id="history[${i}].endTime"]`)
  }

  async getEditHistorySubmitButton() {
    return browser.$("button#editHistoryModalSubmitButton")
  }

  async getPreviousPositionLink(i) {
    return browser.$(`tr#previousPosition_${i} a`)
  }

  async getAssessmentsTable(assessmentKey, recurrence) {
    return (await this.getAssessmentContainer(assessmentKey, recurrence)).$(
      "table.assessments-table"
    )
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

  async getDeleteConfirmButton() {
    return browser.$('//button[text()="Yes, I am sure"]')
  }

  async getAssessmentModalForm() {
    return browser.$(".modal-content form")
  }

  async getSaveAssessmentButton() {
    return (await this.getAssessmentModalForm()).$('.//button[text()="Save"]')
  }

  async getShownAssessmentPanel(assessmentKey, recurrence, i) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence)).$(
      `td:nth-child(${i}) .card`
    )
  }

  async getShownAssessmentDetails(assessmentKey, recurrence, i = 2) {
    return (
      await this.getShownAssessmentPanel(assessmentKey, recurrence, i)
    ).$$("div.card-body .form-control-plaintext")
  }

  async getAssessmentContainer(assessmentKey, recurrence) {
    return browser.$(
      `#entity-assessments-results-${assessmentKey}-${recurrence}`
    )
  }

  async getPoliticalPosition() {
    return browser.$('div[name="formSensitiveFields.politicalPosition"]')
  }

  async getBirthday() {
    return browser.$('div[name="formSensitiveFields.birthday"]')
  }

  async getInvalidFeedback() {
    return browser.$$('//div[@class="invalid-feedback"]')
  }

  async getTopLevelQuestionSetTitle() {
    return browser.$('//h4/span[contains(text(),"Top Level Question Set")]')
  }

  async getBottomLevelQuestionSetTitle() {
    return browser.$('//h4/span[contains(text(),"Bottom Level Question Set")]')
  }

  async pickACompactField(field) {
    await (await browser.$(`#${field}`)).click()
  }

  async waitForCompactField(reverse, ...fields) {
    const compactView = await this.getCompactView()
    for (const field of fields) {
      await (
        await compactView.$(`.//th[text()="${field}"]`)
      ).waitForDisplayed({ reverse })
    }
  }

  async waitForAssessmentModalForm(reverse = false) {
    await browser.pause(300) // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitForExist({ reverse, timeout: 20000 })
    await (await this.getAssessmentModalForm()).waitForDisplayed()
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 4 questions; process them in order

    // Select first button
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.test1'] label[for="entityAssessment.test1_${valuesArr[0]}"]`
    )

    // Select text editor input
    await this.fillRichTextInput(
      await this.getAssessmentModalForm(),
      "div[id='fg-entityAssessment.text'] .editor-container > .editable",
      valuesArr[1],
      prevTextToClear
    )

    // Select second button
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.questionSets.topLevelQs.questions.test2'] label[for="entityAssessment.questionSets.topLevelQs.questions.test2_${valuesArr[2]}"]`
    )

    // Select third button
    await this.clickButton(
      await this.getAssessmentModalForm(),
      `div[id='fg-entityAssessment.questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3'] label[for="entityAssessment.questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3_${valuesArr[3]}"]`
    )
  }

  async saveAssessmentAndWaitForModalClose(
    assessmentKey,
    recurrence,
    detail0ToWaitFor
  ) {
    return super.saveAssessmentAndWaitForModalClose(
      await this.getSaveAssessmentButton(),
      () => this.getAssessmentModalForm(),
      () => this.getShownAssessmentDetails(assessmentKey, recurrence),
      0,
      detail0ToWaitFor
    )
  }

  async confirmDelete() {
    await browser.pause(500)
    await (await this.getDeleteConfirmButton()).waitForExist()
    await (await this.getDeleteConfirmButton()).waitForDisplayed()
    await (await this.getDeleteConfirmButton()).click()
  }

  async waitForDeletedAssessmentToDisappear(assessmentKey, recurrence, i = 2) {
    await browser.pause(500)
    await (
      await this.getShownAssessmentPanel(assessmentKey, recurrence, i)
    ).waitForExist({
      reverse: true,
      timeout: 20000
    })
  }

  async getValidationErrorMessages() {
    return await (
      await this.getInvalidFeedback()
    ).map(async errorDiv => await errorDiv.getText())
  }

  async getAuthorizationGroupsTable() {
    return browser.$("#authorizationGroups table")
  }

  async getAuthorizationGroup(i) {
    const agTable = await this.getAuthorizationGroupsTable()
    return agTable.$(`tbody tr:nth-child(${i}) td:first-child a`)
  }

  async getCurrentPosition() {
    return browser.$("#fg-position")
  }

  async getEditPositionButton() {
    return browser.$("span.edit-position a.btn")
  }

  async getChangeAssignedPositionButton() {
    return browser.$("button.change-assigned-position")
  }

  async getAdditionalPositionsTable() {
    return browser.$("#additionalPositions table")
  }
}

export default new ShowPerson()
