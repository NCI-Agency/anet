import Page from "./page"

const PAGE_URL = "/tasks/new"

class CreateTask extends Page {
  async getForm() {
    return browser.$("form")
  }

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async getShortName() {
    return browser.$('input[id="shortName"]')
  }

  async getCustomFieldsContainer() {
    return browser.$("#custom-fields")
  }

  async getAssessmentFields() {
    // since only custom field is assessments
    return (await this.getCustomFieldsContainer()).$$(
      '//div[starts-with(@id,"fg-formCustomFields")]'
    )
  }

  async getFirstQuestionsFieldContainer() {
    return (await this.getCustomFieldsContainer()).$(
      'div[id="fg-formCustomFields.assessments.0.questions"]'
    )
  }

  async getQuestionsField() {
    return (await this.getFirstQuestionsFieldContainer()).$(
      'textarea[id="formCustomFields.assessments.0.questions"]'
    )
  }

  async getQuestionsFieldWarningText() {
    return (await this.getFirstQuestionsFieldContainer()).$(
      '//div[contains(text(), "Invalid")]'
    )
  }

  async getAddAssessmentButton() {
    return browser.$('button[id="add-formCustomFields.assessments"]')
  }

  async openAsSuperUser() {
    await super.openAsSuperUser(PAGE_URL)
  }

  async openAsAdmin() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }
}

export default new CreateTask()
