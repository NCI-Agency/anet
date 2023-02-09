import Page from "./page"

const PAGE_URL = "/people/new"

const INVISIBLE_CUSTOM_FIELDS = {
  textArea: "formCustomFields.textareaFieldName",
  number: "formCustomFields.numberFieldName"
}

const SENSITIVE_CUSTOM_FIELDS = {
  birthday: "formSensitiveFields.birthday",
  politicalPosition: "formSensitiveFields.politicalPosition"
}

export class CreatePerson extends Page {
  getForm() {
    return browser.$("form.form-horizontal")
  }

  getAlertSuccess() {
    return browser.$(".alert-success")
  }

  getLastName() {
    return this.getForm().$("#lastName")
  }

  getFirstName() {
    return browser.$("#firstName")
  }

  getDuplicatesButton() {
    return browser.$('//button[text()="Possible Duplicates"]')
  }

  getModalContent() {
    return browser.$("div.modal-content")
  }

  getModalCloseButton() {
    return this.getModalContent().$("button.btn-close")
  }

  getSimilarPerson() {
    return this.getModalContent().$("tbody tr:first-child td:first-child a")
  }

  getRolePrincipalButton() {
    return browser.$('label[for="role_PRINCIPAL"]')
  }

  getRoleAdvisorButton() {
    return browser.$('label[for="role_ADVISOR"]')
  }

  getEmailAddress() {
    return browser.$("#emailAddress")
  }

  getPhoneNumber() {
    return browser.$("#phoneNumber")
  }

  getRank() {
    return browser.$('select[name="rank"]')
  }

  getGender() {
    return browser.$('select[name="gender"]')
  }

  getCountry() {
    return browser.$('select[name="country"]')
  }

  getEndOfTourDate() {
    return browser.$("#endOfTourDate")
  }

  getBiography() {
    return browser.$(".biography .editable")
  }

  getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  getEndOfTourToday() {
    return browser.$(".bp4-datepicker-footer button.bp4-button:first-child")
  }

  getCustomFieldsContainer() {
    return browser.$("#custom-fields")
  }

  getNumberCustomFieldContainer() {
    return this.getCustomFieldContainerByName(INVISIBLE_CUSTOM_FIELDS.number)
  }

  getNumberCustomField() {
    return this.getNumberCustomFieldContainer().$('input[type="number"]')
  }

  getNumberCustomFieldHelpText() {
    return this.getNumberCustomFieldContainer().$(
      '//div[contains(text(), "greater than")]'
    )
  }

  getDefaultInvisibleCustomFields() {
    return Object.keys(INVISIBLE_CUSTOM_FIELDS).map(field =>
      this.getCustomFieldContainerByName(INVISIBLE_CUSTOM_FIELDS[field])
    )
  }

  getGreenButton() {
    return this.getCustomFieldsContainer().$(
      'label[for="formCustomFields.colourOptions_GREEN"]'
    )
  }

  getAmberButton() {
    return this.getCustomFieldsContainer().$(
      'label[for="formCustomFields.colourOptions_AMBER"]'
    )
  }

  getAddArrayObjectButton() {
    return this.getCustomFieldsContainer().$(
      'button[id="add-formCustomFields.arrayFieldName"]'
    )
  }

  getObjectDateField() {
    return this.getCustomFieldsContainer().$(
      'input[id="formCustomFields.arrayFieldName.0.dateF"]'
    )
  }

  getSensitiveFieldsContainer() {
    return browser.$("#sensitive-fields")
  }

  getBirthdaySensitiveFieldContainer() {
    return this.getSensitiveFieldContainerByName(
      SENSITIVE_CUSTOM_FIELDS.birthday
    )
  }

  getPoliticalPositionSensitiveFieldContainer() {
    return this.getSensitiveFieldContainerByName(
      SENSITIVE_CUSTOM_FIELDS.politicalPosition
    )
  }

  getBirthday() {
    return this.getSensitiveFieldsContainer().$(
      'input[id="formSensitiveFields.birthday'
    )
  }

  getLeftButton() {
    return this.getSensitiveFieldsContainer().$(
      'label[for="formSensitiveFields.politicalPosition_LEFT"]'
    )
  }

  getMiddleButton() {
    return this.getSensitiveFieldsContainer().$(
      'label[for="formSensitiveFields.politicalPosition_MIDDLE"]'
    )
  }

  getCustomFieldContainerByName(name) {
    return this.getCustomFieldsContainer().$(`div[id="fg-${name}"]`)
  }

  getSensitiveFieldContainerByName(name) {
    return this.getSensitiveFieldsContainer().$(`div[id="fg-${name}"]`)
  }

  openAsSuperUser() {
    super.openAsSuperUser(PAGE_URL)
  }

  openAsAdmin() {
    super.openAsAdminUser(PAGE_URL)
  }

  submitForm() {
    this.getSubmitButton().scrollIntoView()
    this.getSubmitButton().click()
  }
}

export default new CreatePerson()
