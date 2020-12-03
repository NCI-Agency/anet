import Page from "./page"

const PAGE_URL = "/tasks/new"

class CreateTask extends Page {
  get form() {
    return browser.$("form")
  }

  get alertSuccess() {
    return browser.$(".alert-success")
  }

  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  get shortName() {
    return browser.$('input[id="shortName"]')
  }

  get customFieldsContainer() {
    return browser.$("#custom-fields")
  }

  get assessmentFields() {
    // since only custom field is assessments
    return this.customFieldsContainer.$$(
      '//div[starts-with(@id,"fg-formCustomFields")]'
    )
  }

  get firstQuestionsFieldContainer() {
    return this.customFieldsContainer.$(
      'div[id="fg-formCustomFields.assessments.0.questions"]'
    )
  }

  get questionsField() {
    return this.firstQuestionsFieldContainer.$(
      'textarea[id="formCustomFields.assessments.0.questions"]'
    )
  }

  get questionsFieldWarningText() {
    return this.firstQuestionsFieldContainer.$(
      '//span[contains(text(), "Invalid")]'
    )
  }

  get addAssessmentButton() {
    return browser.$('button[id="add-formCustomFields.assessments"]')
  }

  openAsSuperUser() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdmin() {
    super.openAsAdminUser(PAGE_URL)
  }

  waitForAlertSuccessToLoad() {
    if (!this.alertSuccess.isDisplayed()) {
      this.alertSuccess.waitForExist()
      this.alertSuccess.waitForDisplayed()
    }
  }

  submitForm() {
    this.submitButton.click()
  }
}

export default new CreateTask()
