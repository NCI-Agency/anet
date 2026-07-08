import { currentPage } from "../support.js"
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
    return currentPage().locator("form.form-horizontal").first()
  }

  async getFamilyName() {
    return (await this.getForm()).locator("#familyName").first()
  }

  async getGivenName() {
    return currentPage().locator("#givenName").first()
  }

  async getDuplicatesButton() {
    return currentPage()
      .locator('//button[text()="Possible Duplicates"]')
      .first()
  }

  async getModalContent() {
    return currentPage().locator("div.modal-content").first()
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
    return currentPage().locator('label[for="user_true"]').first()
  }

  async getUserFalseButton() {
    return currentPage().locator('label[for="user_false"]').first()
  }

  async getEmailAddress(index) {
    return currentPage()
      .locator(`input[name="emailAddresses.${index}.address"]`)
      .first()
  }

  async getEmailAddressMessage(index) {
    return currentPage()
      .locator(
        `input[name="emailAddresses.${index}.address"] ~ div.invalid-feedback`
      )
      .first()
  }

  async getPhoneNumber() {
    return currentPage().locator("#phoneNumber").first()
  }

  async getRank() {
    return currentPage().locator('select[name="rank"]').first()
  }

  async getGender() {
    return currentPage().locator('select[name="gender"]').first()
  }

  async getCountryInput() {
    return currentPage().locator("#country").first()
  }

  async getCountryAdvancedSelectFirstItem() {
    return currentPage()
      .locator("#country-popover tbody tr:first-child td:nth-child(2)")
      .first()
  }

  async waitForCountryAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getCountryAdvancedSelectFirstItem,
      value
    )
  }

  async getCountryHelpBlock() {
    return currentPage().locator("#fg-country div.invalid-feedback").first()
  }

  async getTenantAccessRequestsInput() {
    return currentPage().locator("#tenantAccessRequests").first()
  }

  async getTenantAccessRequestsAdvancedSelectFirstItem() {
    return currentPage()
      .locator(
        "#tenantAccessRequests-popover tbody tr:first-child td:nth-child(2)"
      )
      .first()
  }

  async getTenantAccessRequestsHelpBlock() {
    return currentPage()
      .locator("#fg-tenantAccessRequests div.invalid-feedback")
      .first()
  }

  async getEndOfTourDate() {
    return currentPage().locator("#endOfTourDate").first()
  }

  async getBiography() {
    return currentPage().locator(".biography .editable").first()
  }

  async getSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
  }

  async getEndOfTourToday() {
    return currentPage()
      .locator(".bp6-datepicker-footer button.bp6-button:first-child")
      .first()
  }

  async getNoTenantWarning() {
    return currentPage().locator("#no-tenant-warning").first()
  }

  async getTenantsInput() {
    return currentPage().locator("#tenants").first()
  }

  async getTenantsAdvancedSelectFirstItem() {
    return currentPage()
      .locator("#tenants-popover tbody tr:first-child td:nth-child(2)")
      .first()
  }

  async getTenantsError() {
    return currentPage().locator("#fg-tenants div.invalid-feedback").first()
  }

  async getCustomFieldsContainer() {
    return currentPage().locator("#custom-fields").first()
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
    return currentPage().locator("#sensitive-fields").first()
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

export default new CreatePerson()
