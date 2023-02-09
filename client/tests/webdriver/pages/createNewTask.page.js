import Page from "./page"

const PAGE_URL = "/tasks/new"

class CreateTask extends Page {
  getForm() {
    return browser.$("form")
  }

  getAlertSuccess() {
    return browser.$(".alert-success")
  }

  getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  getShortName() {
    return browser.$('input[id="shortName"]')
  }

  getCustomFieldsContainer() {
    return browser.$("#custom-fields")
  }

  getAssessmentFields() {
    // since only custom field is assessments
    return this.getCustomFieldsContainer().$$(
      '//div[starts-with(@id,"fg-formCustomFields")]'
    )
  }

  getFirstQuestionsFieldContainer() {
    return this.getCustomFieldsContainer().$(
      'div[id="fg-formCustomFields.assessments.0.questions"]'
    )
  }

  getQuestionsField() {
    return this.getFirstQuestionsFieldContainer().$(
      'textarea[id="formCustomFields.assessments.0.questions"]'
    )
  }

  getQuestionsFieldWarningText() {
    return this.getFirstQuestionsFieldContainer().$(
      '//div[contains(text(), "Invalid")]'
    )
  }

  getAddAssessmentButton() {
    return browser.$('button[id="add-formCustomFields.assessments"]')
  }

  openAsSuperUser() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdmin() {
    super.openAsAdminUser(PAGE_URL)
  }

  submitForm() {
    this.getSubmitButton().click()
  }
}

export default new CreateTask()
