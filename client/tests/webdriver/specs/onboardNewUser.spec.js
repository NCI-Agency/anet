import { expect } from "chai"
import CreatePerson from "../pages/createNewPerson.page"
import OnboardPage from "../pages/onboard.page"
import { createOnboardingNewPerson } from "./newUserUtils"

describe("Onboard new user login", () => {
  it("Should successfully create an account", () => {
    // unique name if we want to run tests without resetting DB
    OnboardPage.openAsOnboardUser("/", `bonny${Date.now()}`)
    createOnboardingNewPerson()
  })

  it('Should show onboard welcome"', () => {
    // give unique name to avoid collision when running tests (without resetting DB)
    OnboardPage.openAsOnboardUser("/", `bonny${Date.now()}`)
    const welcomeText = "Welcome to ANET"
    OnboardPage.waitForWelcomeMessage(welcomeText)

    const securityText = OnboardPage.welcomeText.getText()
    expect(securityText).to.equal(welcomeText)
  })

  it("Should click on create your account", () => {
    OnboardPage.createYourAccountBtn.click()
  })

  it("Should not save if endOfTourDate is not in the future", () => {
    CreatePerson.endOfTourDate.waitForExist()
    CreatePerson.endOfTourDate.click()

    CreatePerson.endOfTourToday.waitForDisplayed()
    CreatePerson.endOfTourToday.waitForExist()
    // select a date
    CreatePerson.endOfTourToday.click()
    CreatePerson.lastName.click()
    const errorMessage = CreatePerson.endOfTourDate
      .$("..")
      .$("..")
      .$("..")
      .$("..")
      .$("span.help-block")
    errorMessage.waitForExist()
    errorMessage.waitForDisplayed()
    expect(errorMessage.getText()).to.equal(
      "The End of tour date must be in the future"
    )
  })
})
