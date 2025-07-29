import { CreatePerson } from "./createNewPerson.page"

class Onboard extends CreatePerson {
  async getWelcomeText() {
    return browser.$(".onboarding-new h1")
  }

  async getCreateYourAccountBtn() {
    return browser.$(".create-account-button-wrapper .btn-primary")
  }

  async waitForWelcomeMessage(value) {
    if (!(await (await this.getWelcomeText()).isDisplayed())) {
      await (await this.getWelcomeText()).waitForExist()
      await (await this.getWelcomeText()).waitForDisplayed()
    }
    return browser.waitUntil(
      async() => {
        return (await (await this.getWelcomeText()).getText()) === value
      },
      { timeout: 5000, timeoutMsg: "Expected different welcome text after 5s" }
    )
  }

  async getBiography() {
    return browser.$("#biography")
  }
}

export default new Onboard()
