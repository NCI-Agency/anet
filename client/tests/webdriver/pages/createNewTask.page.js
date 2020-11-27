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

  get addObjectButton() {
    return browser.$('button[id="addObjectButton"]')
  }

  get objectFields() {
    return browser
      .$("#custom-fields")
      .$$("//div[starts-with(@id,'fg-formCustomFields')]")
  }

  get questionsField() {
    return browser
      .$("#custom-fields")
      .$("//textarea[contains(@id,'questions')]")
  }

  get questionsFieldWarningText() {
    return this.questionsField.$("//span[contains(text(), 'Invalid')]")
  }

  get questionsFieldHelpText() {
    return this.questionsField.$(".help-block")
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
