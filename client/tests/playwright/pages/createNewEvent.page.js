import Page from "./page.js"

const PAGE_URL = "/events/new"
class CreateEvent extends Page {
  async getForm() {
    return this.page.locator("form.form-horizontal").first()
  }

  async getNameInput() {
    return (await this.getForm()).locator("#name").first()
  }

  async getNameHelpBlock() {
    return this.page.locator("#fg-name div.invalid-feedback").first()
  }

  async getTypeInput() {
    return (await this.getForm()).locator("#eventType").first()
  }

  async getTypeHelpBlock() {
    return this.page.locator("#fg-eventType div.invalid-feedback").first()
  }

  async getSubmitButton() {
    return this.page.locator("#formBottomSubmit").first()
  }

  async open() {
    await super.openAsSuperuser(PAGE_URL)
  }

  async openAsAdminUser() {
    await super.openAsAdminUser(PAGE_URL)
  }

  async submitForm() {
    await (await this.getSubmitButton()).click()
  }

  async getStartDateInput() {
    return this.page.locator("#startDate").first()
  }

  async getStartDateHelpBlock() {
    return this.page.locator("#fg-startDate div.invalid-feedback").first()
  }

  async getEndDateInput() {
    return this.page.locator("#endDate").first()
  }

  async getEndDateHelpBlock() {
    return this.page.locator("#fg-endDate div.invalid-feedback").first()
  }
}
export default CreateEvent
