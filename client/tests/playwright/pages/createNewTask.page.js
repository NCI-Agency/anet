import Page from "./page.js"

const PAGE_URL = "/tasks/new"
class CreateTask extends Page {
  async getForm() {
    return this.page.locator("form").first()
  }

  async getSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }

  async getShortName() {
    return this.page.locator('input[id="shortName"]').first()
  }

  async getShortNameInput() {
    return this.page.locator("#shortName").first()
  }

  async getLongNameInput() {
    return this.page.locator("#longName").first()
  }

  async getParentTaskInput() {
    return this.page.locator("#parentTask").first()
  }

  async getClearParentTaskButton() {
    return this.page.locator("#fg-parentTask div.input-group button").first()
  }

  async getParentTaskSearchPopover() {
    return this.page.locator("#parentTask-popover").first()
  }

  async getParentTasksTable() {
    return (await this.getParentTaskSearchPopover())
      .locator(".table-responsive table")
      .first()
  }

  async selectParentTaskByText(name, rowNumber = 2) {
    await (await this.getParentTaskInput()).click()
    // wait for parentTask table loader to disappear
    await (
      await this.getParentTasksTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    await this.page.keyboard.insertText(String(name))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
    await (
      await this.getParentTasksTable()
    ).waitFor({
      state: "visible",
      timeout: 10000
    })
    const radioButton = await (
      await this.getParentTasksTable()
    )
      .locator(
        `tbody tr:nth-child(${rowNumber}) td:first-child input.form-check-input`
      )
      .first()
    if (!(await radioButton.isChecked())) {
      await radioButton.click()
    }
    await (await this.getShortNameInput()).click()
    await (
      await this.getParentTaskSearchPopover()
    ).waitFor({
      state: "detached",
      timeout: 3000
    })
  }

  async getDescriptionInput() {
    return this.page.locator("#fg-description .editable").first()
  }

  async getCustomFieldsContainer() {
    return this.page.locator("#custom-fields").first()
  }

  async getAssessmentFields() {
    // since only custom field is assessments
    return (await this.getCustomFieldsContainer())
      .locator('xpath=.//div[starts-with(@id,"fg-formCustomFields")]')
      .all()
  }

  async getFirstQuestionsFieldContainer() {
    return (await this.getCustomFieldsContainer())
      .locator('div[id="fg-formCustomFields.assessments.0.questions"]')
      .first()
  }

  async getQuestionsField() {
    return (await this.getFirstQuestionsFieldContainer())
      .locator('textarea[id="formCustomFields.assessments.0.questions"]')
      .first()
  }

  async getQuestionsFieldWarningText() {
    return (await this.getFirstQuestionsFieldContainer())
      .locator('xpath=.//div[contains(text(), "Invalid")]')
      .first()
  }

  async getAddAssessmentButton() {
    return this.page
      .locator('button[id="add-formCustomFields.assessments"]')
      .first()
  }

  async openAsSuperuser() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsAdmin() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }

  async fillTaskDescription(description) {
    await (await this.getDescriptionInput()).click()
    await this.page.keyboard.insertText(String(description))
    const focused = this.page.locator(":focus")
    if ((await focused.getAttribute("contenteditable")) === "true") {
      await focused.blur()
    }
  }
}
export default CreateTask
