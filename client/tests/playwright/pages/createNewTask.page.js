import { currentPage, typeKeys, waitFor } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/tasks/new"
class CreateTask extends Page {
  async getForm() {
    return currentPage().locator("form").first()
  }

  async getAlertSuccess() {
    return currentPage().locator(".alert-success").first()
  }

  async getSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
  }

  async getShortName() {
    return currentPage().locator('input[id="shortName"]').first()
  }

  async getShortNameInput() {
    return currentPage().locator("#shortName").first()
  }

  async getLongNameInput() {
    return currentPage().locator("#longName").first()
  }

  async getParentTaskInput() {
    return currentPage().locator("#parentTask").first()
  }

  async getClearParentTaskButton() {
    return currentPage()
      .locator("#fg-parentTask div.input-group button")
      .first()
  }

  async getParentTaskSearchPopover() {
    return currentPage().locator("#parentTask-popover").first()
  }

  async getParentTasksTable() {
    return (await this.getParentTaskSearchPopover())
      .locator(".table-responsive table")
      .first()
  }

  async selectParentTaskByText(name, rowNumber = 2) {
    await (await this.getParentTaskInput()).click()
    // wait for parentTask table loader to disappear
    await waitFor(await this.getParentTasksTable(), "visible")
    await typeKeys(name)
    await waitFor(await this.getParentTasksTable(), "visible")
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
    await waitFor(await this.getParentTaskSearchPopover(), "attached", {
      reverse: true,
      timeout: 3000
    })
  }

  async getDescriptionInput() {
    return currentPage().locator("#fg-description .editable").first()
  }

  async getCustomFieldsContainer() {
    return currentPage().locator("#custom-fields").first()
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
    return currentPage()
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
    await typeKeys(description)
  }
}
export default new CreateTask()
