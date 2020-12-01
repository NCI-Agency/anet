import Page from "./page"

const PAGE_URL = "/people/new"

const INVISIBLE_CUSTOM_FIELDS = {
  textArea: "formCustomFields.textareaFieldName",
  number: "formCustomFields.numberFieldName"
}

class CreatePerson extends Page {
  get form() {
    return browser.$("form.form-horizontal")
  }

  get alertSuccess() {
    return browser.$(".alert-success")
  }

  get lastName() {
    return this.form.$("#lastName")
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

  get submitButton() {
    return browser.$("#formBottomSubmit")
  }

  get endOfTourToday() {
    return browser.$(".bp3-datepicker-footer button.bp3-button:first-child")
  }

  get customFieldsContainer() {
    return browser.$("#custom-fields")
  }

  get numberCustomFieldContainer() {
    return this.getCustomFieldContainerByName(INVISIBLE_CUSTOM_FIELDS.number)
  }

  get numberCustomField() {
    return this.numberCustomFieldContainer.$('input[type="number"]')
  }

  get numberCustomFieldHelpText() {
    return this.numberCustomFieldContainer.$(
      '//span[contains(text(), "greater than")]'
    )
  }

  get defaultInvisibleCustomFields() {
    return Object.keys(INVISIBLE_CUSTOM_FIELDS).map(field =>
      this.getCustomFieldContainerByName(INVISIBLE_CUSTOM_FIELDS[field])
    )
  }

  get greenButton() {
    return this.customFieldsContainer.$('label[id="GREEN"]')
  }

  get amberButton() {
    return this.customFieldsContainer.$('label[id="AMBER"]')
  }

  get addArrayObjectButton() {
    return this.customFieldsContainer.$(
      'button[id="add-formCustomFields.arrayFieldName"]'
    )
  }

  get objectDateField() {
    return this.customFieldsContainer.$(
      'input[id="formCustomFields.arrayFieldName.0.dateF"]'
    )
  }

  getCustomFieldContainerByName(name) {
    return this.customFieldsContainer.$(`div[id="fg-${name}"]`)
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
