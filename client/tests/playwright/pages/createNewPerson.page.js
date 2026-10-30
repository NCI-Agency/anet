import Page from "./page.js"

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
    return this.page.locator("form.form-horizontal").first()
  }

  async getFamilyName() {
    return (await this.getForm()).locator("#familyName").first()
  }

  async getGivenName() {
    return this.page.locator("#givenName").first()
  }

  async getDuplicatesButton() {
    return this.page.locator('//button[text()="Possible Duplicates"]').first()
  }

  async getModalContent() {
    return this.page.locator("div.modal-content").first()
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).locator("button.btn-close").first()
  }

  async getSimilarPerson() {
    return (await this.getModalContent())
      .locator("tbody tr:first-child td:first-child a")
      .first()
  }

  async getUserTrueButton() {
    return this.page.locator('label[for="user_true"]').first()
  }

  async getUserFalseButton() {
    return this.page.locator('label[for="user_false"]').first()
  }

  async getEmailAddress(index) {
    return this.page
      .locator(`input[name="emailAddresses.${index}.address"]`)
      .first()
  }

  async getEmailAddressMessage(index) {
    return this.page
      .locator(
        `input[name="emailAddresses.${index}.address"] ~ div.invalid-feedback`
      )
      .first()
  }

  async getPhoneNumber() {
    return this.page.locator("#phoneNumber").first()
  }

  async getRank() {
    return this.page.locator('select[name="rank"]').first()
  }

  async getGender() {
    return this.page.locator('select[name="gender"]').first()
  }

  async getCountryInput() {
    return this.page.locator("#country").first()
  }

  async getCountryAdvancedSelectFirstItem() {
    return this.page
      .locator("#country-popover tbody tr:first-child td:nth-child(2)")
      .first()
  }

  async waitForCountryAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getCountryAdvancedSelectFirstItem.bind(this),
      value
    )
  }

  async getCountryHelpBlock() {
    return this.page.locator("#fg-country div.invalid-feedback").first()
  }

  async getEndOfTourDate() {
    return this.page.locator("#endOfTourDate").first()
  }

  async getBiography() {
    return this.page.locator(".biography .editable").first()
  }

  async getSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }

  async getEndOfTourToday() {
    return this.page
      .locator(".bp6-datepicker-footer button.bp6-button:first-child")
      .first()
  }

  async getCustomFieldsContainer() {
    return this.page.locator("#custom-fields").first()
  }

  async getNumberCustomFieldContainer() {
    return this.getCustomFieldContainerByName(INVISIBLE_CUSTOM_FIELDS.number)
  }

  async getNumberCustomField() {
    return (await this.getNumberCustomFieldContainer())
      .locator('input[type="number"]')
      .first()
  }

  async getNumberCustomFieldHelpText() {
    return (await this.getNumberCustomFieldContainer())
      .locator('xpath=.//div[contains(text(), "greater than")]')
      .first()
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
    return (await this.getCustomFieldsContainer())
      .locator('label[for="formCustomFields.colourOptions_GREEN"]')
      .first()
  }

  async getAmberButton() {
    return (await this.getCustomFieldsContainer())
      .locator('label[for="formCustomFields.colourOptions_AMBER"]')
      .first()
  }

  async getAddArrayObjectButton() {
    return (await this.getCustomFieldsContainer())
      .locator('button[id="add-formCustomFields.arrayFieldName"]')
      .first()
  }

  async getObjectDateField() {
    return (await this.getCustomFieldsContainer())
      .locator('input[id="formCustomFields.arrayFieldName.0.dateF"]')
      .first()
  }

  async getSensitiveFieldsContainer() {
    return this.page.locator("#sensitive-fields").first()
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
    return (await this.getSensitiveFieldsContainer())
      .locator('input[id="formSensitiveFields.birthday"]')
      .first()
  }

  async getLeftButton() {
    return (await this.getSensitiveFieldsContainer())
      .locator('label[for="formSensitiveFields.politicalPosition_LEFT"]')
      .first()
  }

  async getMiddleButton() {
    return (await this.getSensitiveFieldsContainer())
      .locator('label[for="formSensitiveFields.politicalPosition_MIDDLE"]')
      .first()
  }

  async getCustomFieldContainerByName(name) {
    return (await this.getCustomFieldsContainer())
      .locator(`div[id="fg-${name}"]`)
      .first()
  }

  async getSensitiveFieldContainerByName(name) {
    return (await this.getSensitiveFieldsContainer())
      .locator(`div[id="fg-${name}"]`)
      .first()
  }

  async openAsSuperuser() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsAdmin() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async submitForm() {
    await (await this.getSubmitButton()).scrollIntoViewIfNeeded()
    await (await this.getSubmitButton()).click()
  }
}
export default CreatePerson
