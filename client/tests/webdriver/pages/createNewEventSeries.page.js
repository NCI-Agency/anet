import Page from "./page"

const PAGE_URL = "/eventSeries/new"
class CreateEventSeries extends Page {
  async getForm() {
    return browser.$("form.form-horizontal")
  }

  async getNameInput() {
    return (await this.getForm()).$("#name")
  }

  async getNameHelpBlock() {
    return browser.$("#fg-name div.invalid-feedback")
  }

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async getSubmitButton() {
    return browser.$("#formBottomSubmit")
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
