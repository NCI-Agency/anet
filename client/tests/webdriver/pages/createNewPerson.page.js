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
  async getForm() {
    return browser.$("form.form-horizontal")
  }

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getLastName() {
    return (await this.getForm()).$("#lastName")
  }

  async getFirstName() {
    return browser.$("#firstName")
  }

  async getDuplicatesButton() {
    return browser.$('//button[text()="Possible Duplicates"]')
  }

  async getModalContent() {
    return browser.$("div.modal-content")
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).$("button.btn-close")
  }

  async getSimilarPerson() {
    return (await this.getModalContent()).$(
      "tbody tr:first-child td:first-child a"
    )
  }

  async getUserTrueButton() {
    return browser.$('label[for="user_true"]')
  }

  async getUserFalseButton() {
    return browser.$('label[for="user_false"]')
  }

  async getEmailAddress(index) {
    return browser.$(`input[name="emailAddresses.${index}.address"]`)
  }

  async getEmailAddressMessage(index) {
    return browser.$(
      `input[name="emailAddresses.${index}.address"] ~ div.invalid-feedback`
    )
  }

  async getPhoneNumber() {
    return browser.$("#phoneNumber")
  }

  async getRank() {
    return browser.$('select[name="rank"]')
  }

  async getGender() {
    return browser.$('select[name="gender"]')
  }

  async getCountryInput() {
    return browser.$("#country")
  }

  async getCountryAdvancedSelectFirstItem() {
    return browser.$("#country-popover tbody tr:first-child td:nth-child(2)")
  }

  async waitForCountryAdvancedSelectToChange(value) {
    await (await this.getCountryAdvancedSelectFirstItem()).waitForExist()
    return browser.waitUntil(
      async () => {
        return (
          (await (await this.getCountryAdvancedSelectFirstItem()).getText()) ===
          value
        )
      },
      {
        timeout: 5000,
        timeoutMsg:
          'Expected country advanced select input to contain "' +
          value +
          '" after 5s'
      }
    )
  }

  async getCountryHelpBlock() {
    return browser.$("#fg-country div.invalid-feedback")
  }

  async getEndOfTourDate() {
    return browser.$("#endOfTourDate")
  }

  async getBiography() {
    return browser.$(".biography .editable")
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
  }

  async getEndOfTourToday() {
    return browser.$(".bp6-datepicker-footer button.bp6-button:first-child")
  }

  async getCustomFieldsContainer() {
    return browser.$("#custom-fields")
  }

  async getNumberCustomFieldContainer() {
    return this.getCustomFieldContainerByName(INVISIBLE_CUSTOM_FIELDS.number)
  }

  async getNumberCustomField() {
    return (await this.getNumberCustomFieldContainer()).$(
      'input[type="number"]'
    )
  }

  async getNumberCustomFieldHelpText() {
    return (await this.getNumberCustomFieldContainer()).$(
      './/div[contains(text(), "greater than")]'
    )
  }

  async getDefaultInvisibleCustomFields() {
    return Promise.all(
      Object.keys(INVISIBLE_CUSTOM_FIELDS).map(
        async field =>
          await this.getCustomFieldContainerByName(
            INVISIBLE_CUSTOM_FIELDS[field]
          )
      )
    )
  }

  async getGreenButton() {
    return (await this.getCustomFieldsContainer()).$(
      'label[for="formCustomFields.colourOptions_GREEN"]'
    )
  }

  async getAmberButton() {
    return (await this.getCustomFieldsContainer()).$(
      'label[for="formCustomFields.colourOptions_AMBER"]'
    )
  }

  async getAddArrayObjectButton() {
    return (await this.getCustomFieldsContainer()).$(
      'button[id="add-formCustomFields.arrayFieldName"]'
    )
  }

  async getObjectDateField() {
    return (await this.getCustomFieldsContainer()).$(
      'input[id="formCustomFields.arrayFieldName.0.dateF"]'
    )
  }

  async getSensitiveFieldsContainer() {
    return browser.$("#sensitive-fields")
  }

  async getBirthdaySensitiveFieldContainer() {
    return this.getSensitiveFieldContainerByName(
      SENSITIVE_CUSTOM_FIELDS.birthday
    )
  }

  async getPoliticalPositionSensitiveFieldContainer() {
    return this.getSensitiveFieldContainerByName(
      SENSITIVE_CUSTOM_FIELDS.politicalPosition
    )
  }

  async getBirthday() {
    return (await this.getSensitiveFieldsContainer()).$(
      'input[id="formSensitiveFields.birthday'
    )
  }

  async getLeftButton() {
    return (await this.getSensitiveFieldsContainer()).$(
      'label[for="formSensitiveFields.politicalPosition_LEFT"]'
    )
  }

  async getMiddleButton() {
    return (await this.getSensitiveFieldsContainer()).$(
      'label[for="formSensitiveFields.politicalPosition_MIDDLE"]'
    )
  }

  async getCustomFieldContainerByName(name) {
    return (await this.getCustomFieldsContainer()).$(`div[id="fg-${name}"]`)
  }

  async getSensitiveFieldContainerByName(name) {
    return (await this.getSensitiveFieldsContainer()).$(`div[id="fg-${name}"]`)
  }

  async openAsSuperuser() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsAdmin() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async submitForm() {
    await (await this.getSubmitButton()).scrollIntoView()
    await (await this.getSubmitButton()).click()
  }
}

export default new CreatePerson()
