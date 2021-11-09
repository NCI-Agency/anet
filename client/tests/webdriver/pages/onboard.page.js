import { CreatePerson } from "./createNewPerson.page"

class Onboard extends CreatePerson {
  get welcomeText() {
    return browser.$(".onboarding-new h1")
  }

  get onboardingPopover() {
    return browser.$(".hopscotch-bubble-container")
  }

  get createYourAccountBtn() {
    return browser.$(".create-account-button-wrapper .btn-primary")
  }

  waitForWelcomeMessage(value) {
    if (!this.welcomeText.isDisplayed()) {
      this.welcomeText.waitForExist()
      this.welcomeText.waitForDisplayed()
    }
    return browser.waitUntil(
      () => {
        return this.welcomeText.getText() === value
      },
      { timeout: 5000, timeoutMsg: "Expected different welcome text after 5s" }
    )
  }
}

export default new Onboard()
