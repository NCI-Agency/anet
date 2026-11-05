import { CreatePerson } from "./createNewPerson.page.js"

class Onboard extends CreatePerson {
  async getWelcomeText() {
    return this.page.locator(".onboarding-new h1").first()
  }

  async getCreateYourAccountBtn() {
    return this.page
      .locator(".create-account-button-wrapper .btn-primary")
      .first()
  }

  async waitForWelcomeMessage(value) {
    return this.waitForElementToChange(this.getWelcomeText.bind(this), value)
  }

  async getBiography() {
    return this.page.locator("#biography").first()
  }
}
export default Onboard
