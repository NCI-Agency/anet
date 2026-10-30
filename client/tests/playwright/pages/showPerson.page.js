import { expect } from "@playwright/test"
import Page from "./page.js"

const PAGE_URL = "/people/:uuid"
class ShowPerson extends Page {
  async open(uuid) {
    await super.open(PAGE_URL.replace(":uuid", uuid))
  }

  async openAsAdminUser(uuid) {
    await super.openAsAdminUser(PAGE_URL.replace(":uuid", uuid))
  }

  async getForm() {
    return this.page.locator("div.form-horizontal").first()
  }

  async getEditButton() {
    return this.page.locator("div a.edit-person").first()
  }

  async getCompactView() {
    return this.page.locator(".compact-view").first()
  }

  async getCompactViewButton() {
    return this.page.locator("button[value='compactView']").first()
  }

  async getPrintButton() {
    return this.page.locator("button[value='print']").first()
  }

  async getDetailedViewButton() {
    return this.page.locator("button[value='detailedView']").first()
  }

  async getOptionalFieldsButton() {
    return this.page.locator('//button[text()="Optional Fields"]').first()
  }

  async getClearAllButton() {
    return this.page.locator('//button[text()="Clear All"]').first()
  }

  async getSelectAllButton() {
    return this.page.locator('//button[text()="Select All"]').first()
  }

  async getPresetsButton() {
    return this.page.locator("#presetsButton").first()
  }

  async getEditAttachmentsButton() {
    return await this.page.locator("#edit-attachments").first()
  }

  async openAttachmentsEdit() {
    const edit = await this.getEditAttachmentsButton()
    await edit.click()
    await (
      await this.getAttachments()
    ).waitFor({
      state: "attached",
      timeout: 10000
    })
  }

  async selectAttachmentToLink(caption) {
    const input = await this.page
      .locator('input[name="linkExistingAttachments"]')
      .first()
    await input.click()
    const popover = await this.page
      .locator("#linkExistingAttachments-popover")
      .first()
    await popover.waitFor({
      state: "attached",
      timeout: 10000
    })
    const allAttachmentsFilter = await this.page
      .locator(
        '//div[@id="linkExistingAttachments-popover"]//button[text()="All attachments"]'
      )
      .first()
    if ((await allAttachmentsFilter.count()) > 0) {
      await allAttachmentsFilter.click()
    } else {
      const filterSelect = await this.page
        .locator("#linkExistingAttachments-popover select")
        .first()
      if ((await filterSelect.count()) > 0) {
        await filterSelect.selectOption({
          label: "All attachments"
        })
      }
    }
    await input.fill(String(caption))
    const row = await this.page
      .locator(
        `//div[@id="linkExistingAttachments-popover"]//tbody//tr[.//td[contains(normalize-space(.), "${caption}")]]`
      )
      .first()
    await row.click()
  }

  async linkSelectedAttachments() {
    const button = await this.page
      .locator('//button[text()="Link selected attachments"]')
      .first()
    await expect
      .poll(() => button.isEnabled(), {
        timeout: 10000
      })
      .toBeTruthy()
    await button.click()
  }

  async waitForLinkToComplete() {
    const button = await this.page
      .locator('//button[text()="Link selected attachments"]')
      .first()
    await expect
      .poll(
        async () => {
          const text = (await button.innerText()).trim()
          const countExists =
            (await this.page
              .locator(".attachment-link-count")
              .first()
              .count()) > 0
          return text === "Link selected attachments" && !countExists
        },
        {
          timeout: 15000,
          message: "Expected link action to complete"
        }
      )
      .toBeTruthy()
  }

  async getAttachmentCardByUuid(uuid) {
    const selector = `//div[contains(@class,"attachment-card")]//a[contains(@href,"/attachments/${uuid}/edit")]/ancestor::div[contains(@class,"attachment-card")]`
    const card = await this.page.locator(selector).first()
    await card.waitFor({
      state: "attached",
      timeout: 10000
    })
    return card
  }

  async attachmentCardExistsByUuid(uuid) {
    const selector = `//div[contains(@class,"attachment-card")]//a[contains(@href,"/attachments/${uuid}/edit")]/ancestor::div[contains(@class,"attachment-card")]`
    return (await (await this.page.locator(selector).first()).count()) > 0
  }

  async unlinkAttachmentByUuid(uuid) {
    const card = await this.getAttachmentCardByUuid(uuid)
    const unlinkButton = await card
      .locator('button[title^="Unlink from this"]')
      .first()
    await unlinkButton.click()
  }

  async waitForAttachmentToDisappear(uuid) {
    await expect
      .poll(async () => !(await this.attachmentCardExistsByUuid(uuid)), {
        timeout: 15000,
        message: `Expected attachment ${uuid} to be unlinked`
      })
      .toBeTruthy()
  }

  async ensureAttachmentUnlinked(uuid) {
    if (await this.attachmentCardExistsByUuid(uuid)) {
      await this.unlinkAttachmentByUuid(uuid)
      await this.waitForAttachmentToDisappear(uuid)
    }
  }

  async attemptDeleteAttachmentByUuid(uuid) {
    const card = await this.getAttachmentCardByUuid(uuid)
    const deleteButton = await card.locator("button.btn-outline-danger").first()
    await deleteButton.click()
    const confirm = await this.getDeleteConfirmButton()
    await confirm.click()
  }

  async getDefaultPreset() {
    return this.page.locator('//a[text()="Default"]').first()
  }

  async getWithoutSensitivePreset() {
    return this.page.locator('//a[text()="Exclude sensitive fields"]').first()
  }

  async getSensitiveInformationWarning() {
    return (await this.getCompactView())
      .locator('xpath=.//span[text()="Sensitive Information"]')
      .first()
  }

  async getLeftColumnNumber() {
    return this.page.locator("#leftColumnNumber").first()
  }

  async getLeftTableFields() {
    return (await this.getCompactView()).locator(".left-table > tr").all()
  }

  async getEditHistoryButton() {
    return this.page.locator("button.edit-history").first()
  }

  async getEditHistoryDialog() {
    return this.page.locator("div.edit-history-dialog").first()
  }

  async getEditHistoryStartDate(i) {
    return this.page.locator(`input[id="history[${i}].startTime"]`).first()
  }

  async getEditHistoryEndDate(i) {
    return this.page.locator(`input[id="history[${i}].endTime"]`).first()
  }

  async getEditHistorySubmitButton() {
    return this.page.locator("button#editHistoryModalSubmitButton").first()
  }

  async getPreviousPositionLink(i) {
    return this.page.locator(`tr#previousPosition_${i} a`).first()
  }

  async getAssessmentsTable(assessmentKey, recurrence) {
    return (await this.getAssessmentContainer(assessmentKey, recurrence))
      .locator("table.assessments-table")
      .first()
  }

  async getAddAssessmentButton(assessmentKey, recurrence) {
    // get the add assessment button for latest assessable period (previous period)
    return (await this.getAssessmentsTable(assessmentKey, recurrence))
      .locator("tbody > tr:last-child > td:nth-child(2) > button")
      .first()
  }

  async getEditAssessmentButton() {
    return this.page.locator('div.card button[title="Edit assessment"]').first()
  }

  async getDeleteAssessmentButton() {
    return this.page
      .locator("div.card button.btn.btn-outline-danger.btn-xs")
      .first()
  }

  async getDeleteConfirmButton() {
    return this.page.locator('//button[text()="Yes, I am sure"]').first()
  }

  async getAssessmentModalForm() {
    return this.page.locator(".modal-content form").first()
  }

  async getSaveAssessmentButton() {
    return (await this.getAssessmentModalForm()).getByRole("button", {
      name: "Save",
      exact: true
    })
  }

  async getShownAssessmentPanel(assessmentKey, recurrence, i) {
    return (await this.getAssessmentsTable(assessmentKey, recurrence))
      .locator(`td:nth-child(${i}) .card`)
      .first()
  }

  async getShownAssessmentDetails(assessmentKey, recurrence, i = 2) {
    return (await this.getShownAssessmentPanel(assessmentKey, recurrence, i))
      .locator("div.card-body .form-control-plaintext")
      .all()
  }

  async getAssessmentContainer(assessmentKey, recurrence) {
    return this.page
      .locator(`#entity-assessments-results-${assessmentKey}-${recurrence}`)
      .first()
  }

  async getPoliticalPosition() {
    return this.page
      .locator('div[name="formSensitiveFields.politicalPosition"]')
      .first()
  }

  async getBirthday() {
    return this.page.locator('div[name="formSensitiveFields.birthday"]').first()
  }

  async getInvalidFeedback() {
    return this.page.locator('//div[@class="invalid-feedback"]').all()
  }

  async getTopLevelQuestionSetTitle() {
    return this.page
      .locator('//h4/span[contains(text(),"Top Level Question Set")]')
      .first()
  }

  async getBottomLevelQuestionSetTitle() {
    return this.page
      .locator('//h4/span[contains(text(),"Bottom Level Question Set")]')
      .first()
  }

  async pickACompactField(field) {
    await (await this.page.locator(`#${field}`).first()).click()
  }

  async waitForCompactField(reverse, ...fields) {
    const compactView = await this.getCompactView()
    for (const field of fields) {
      await (
        await compactView.locator(`xpath=.//th[text()="${field}"]`).first()
      ).waitFor({
        state: reverse ? "hidden" : "visible",
        timeout: 10000
      })
    }
  }

  async waitForAssessmentModalForm(reverse = false) {
    // wait for modal animation to finish
    await (
      await this.getAssessmentModalForm()
    ).waitFor({
      state: reverse ? "detached" : "attached",
      timeout: 20000
    })
    await (
      await this.getAssessmentModalForm()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
  }

  async fillAssessmentQuestion(valuesArr, prevTextToClear) {
    // NOTE: assuming assessment content, 4 questions; process them in order
    // first wait for assessment modal to be fully rendered

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
    await (await this.getDeleteConfirmButton()).click()
  }

  async waitForDeletedAssessmentToDisappear(assessmentKey, recurrence, i = 2) {
    await (
      await this.getShownAssessmentPanel(assessmentKey, recurrence, i)
    ).waitFor({
      state: "detached",
      timeout: 20000
    })
  }

  async getValidationErrorMessages() {
    return await Promise.all(
      (await this.getInvalidFeedback()).map(async errorDiv =>
        (await errorDiv.innerText()).trim()
      )
    )
  }

  async getAuthorizationGroupsTable() {
    return this.page.locator("#authorizationGroups table").first()
  }

  async getAuthorizationGroup(i) {
    const agTable = await this.getAuthorizationGroupsTable()
    return agTable.locator(`tbody tr:nth-child(${i}) td:first-child a`).first()
  }

  async getCurrentPosition() {
    return this.page.locator("#fg-position").first()
  }

  async getEditPositionButton() {
    return this.page.locator("span.edit-position a.btn").first()
  }

  async getChangeAssignedPositionButton() {
    return this.page.locator("button.change-assigned-position").first()
  }

  async getAdditionalPositionsTable() {
    return this.page.locator("#additionalPositions table").first()
  }
}
export default ShowPerson
