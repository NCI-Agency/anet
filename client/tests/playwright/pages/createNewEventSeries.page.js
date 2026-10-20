import { currentPage } from "../support.js"
import Page from "./page.js"

const PAGE_URL = "/eventSeries/new"

class CreateEventSeries extends Page {
  async getForm() {
    return currentPage().locator("form.form-horizontal").first()
  }

  async getNameInput() {
    return (await this.getForm()).locator("#name").first()
  }

  async getNameHelpBlock() {
    return currentPage().locator("#fg-name div.invalid-feedback").first()
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
}

export default new CreateEventSeries()
