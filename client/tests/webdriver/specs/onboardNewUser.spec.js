import { expect } from "chai"
import OnboardPage from "../pages/onboard.page"

import CreatePerson from "../pages/createNewPerson.page"

describe("Onboard new user login", () => {
  it('Should show onboard welcome"', () => {
    OnboardPage.openAsOnboardUser()
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
    let errorMessage = CreatePerson.endOfTourDate
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
