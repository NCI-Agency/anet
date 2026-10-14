import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/events/new"
class CreateEvent extends Page {
  async getForm() {
    return currentPage().locator("form.form-horizontal").first()
  }

  async getNameInput() {
    return (await this.getForm()).locator("#name").first()
  }

  async getNameHelpBlock() {
    return currentPage().locator("#fg-name div.invalid-feedback").first()
  }

  async getTypeInput() {
    return (await this.getForm()).locator("#eventType").first()
  }

  async getTypeHelpBlock() {
    return currentPage().locator("#fg-eventType div.invalid-feedback").first()
  }

  async getAlertSuccess() {
    return currentPage().locator(".alert-success").first()
  }

  async getSubmitButton() {
    return currentPage().locator("#formBottomSubmit").first()
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
    return currentPage().locator("#startDate").first()
  }

  async getStartDateHelpBlock() {
    return currentPage().locator("#fg-startDate div.invalid-feedback").first()
  }

  async getEndDateInput() {
    return currentPage().locator("#endDate").first()
  }

  async getEndDateHelpBlock() {
    return currentPage().locator("#fg-endDate div.invalid-feedback").first()
  }
}
export default new CreateEvent()
