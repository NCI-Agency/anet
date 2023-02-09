import { CreatePerson } from "./createNewPerson.page"

class Onboard extends CreatePerson {
  getWelcomeText() {
    return browser.$(".onboarding-new h1")
  }

  getOnboardingPopover() {
    return browser.$(".hopscotch-bubble-container")
  }

  getCreateYourAccountBtn() {
    return browser.$(".create-account-button-wrapper .btn-primary")
  }

  waitForWelcomeMessage(value) {
    if (!this.getWelcomeText().isDisplayed()) {
      this.getWelcomeText().waitForExist()
      this.getWelcomeText().waitForDisplayed()
    }
    return browser.waitUntil(
      () => {
        return this.getWelcomeText().getText() === value
      },
      { timeout: 5000, timeoutMsg: "Expected different welcome text after 5s" }
    )
  }
}

export default new Onboard()
