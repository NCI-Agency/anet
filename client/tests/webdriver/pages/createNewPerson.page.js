import Page from "./page"

const PAGE_URL = "/people/new"

class CreatePerson extends Page {
  get form() {
    return browser.$("form")
  }
  get alertSuccess() {
    return browser.$(".alert-success")
  }
  get lastName() {
    return browser.$("#lastName")
  }
  get firstName() {
    return browser.$("#firstName")
  }
  get rolePrincipalButton() {
    return browser.$("#rolePrincipalButton")
  }
  get roleAdvisorButton() {
    return browser.$("#roleAdvisorButton")
  }
  get emailAddress() {
    return browser.$("#emailAddress")
  }
  get phoneNumber() {
    return browser.$("#phoneNumber")
  }
  get rank() {
    return browser.$('select[name="rank"]')
  }
  get gender() {
    return browser.$('select[name="gender"]')
  }
  get country() {
    return browser.$('select[name="country"]')
  }
  get endOfTourDate() {
    return browser.$("#endOfTourDate")
  }
  get biography() {
    return browser.$(".biography .public-DraftEditor-content")
  }
  get customFieldsTextField() {
    return browser.$('input[name="formCustomFields.inputFieldName"]')
  }
  get submitButton() {
    return browser.$("#formBottomSubmit")
  }
  get endOfTourToday() {
    return browser.$(".bp3-datepicker-footer button.bp3-button:first-child")
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

export default new CreatePerson()
