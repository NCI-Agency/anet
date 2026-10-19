import { currentPage } from "../support.js"
import { CreatePerson } from "./createNewPerson.page.js"

class Onboard extends CreatePerson {
  async getWelcomeText() {
    return currentPage().locator(".onboarding-new h1").first()
  }

  async getCreateYourAccountBtn() {
    return currentPage()
      .locator(".create-account-button-wrapper .btn-primary")
      .first()
  }

  async waitForWelcomeMessage(value) {
    return this.waitForElementToChange(this.getWelcomeText, value)
  }

  async getBiography() {
    return currentPage().locator("#biography").first()
  }
}

export default new Onboard()
