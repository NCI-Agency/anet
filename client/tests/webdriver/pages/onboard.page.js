import Page from "./page"

class Onboard extends Page {
  get welcomeText() {
    return browser.$(".onboarding-new h1")
  }

  get createYourAccountBtn() {
    return browser.$(".create-account-button-wrapper .btn-primary")
  }

  waitForWelcomeMessage(value) {
    this.welcomeText.waitForExist()
    this.welcomeText.waitForDisplayed()
    return browser.waitUntil(
      () => {
        return this.welcomeText.getText() === value
      },
      5000,
      "Expected different welcome text after 5s"
    )
  }
}

export default new Onboard()
