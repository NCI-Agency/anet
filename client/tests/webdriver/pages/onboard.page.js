import { CreatePerson } from "./createNewPerson.page"

class Onboard extends CreatePerson {
  async getWelcomeText() {
    return browser.$(".onboarding-new h1")
  }

  async getCreateYourAccountBtn() {
    return browser.$(".create-account-button-wrapper .btn-primary")
  }

  async waitForWelcomeMessage(value) {
    return this.waitForElementToChange(this.getWelcomeText, value)
  }

  async getBiography() {
    return browser.$("#biography")
  }
}

export default new Onboard()
