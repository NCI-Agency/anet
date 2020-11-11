import { expect } from "chai"
import CreatePerson from "../pages/createNewPerson.page"
import OnboardPage from "../pages/onboard.page"

const ONBOARD_USER = {
  lastName: "BONNSDOTTIR",
  firstName: "Bonny",
  emailAddress: "bonny@nato.int"
}

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
    // Check that these are properly copied from the authentication server
    CreatePerson.lastName.waitForDisplayed()
    CreatePerson.lastName.waitForExist()
    expect(CreatePerson.lastName.getValue()).to.equal(ONBOARD_USER.lastName)
    CreatePerson.firstName.waitForDisplayed()
    CreatePerson.firstName.waitForExist()
    expect(CreatePerson.firstName.getValue()).to.equal(ONBOARD_USER.firstName)
    CreatePerson.emailAddress.waitForDisplayed()
    CreatePerson.emailAddress.waitForExist()
    expect(CreatePerson.emailAddress.getValue()).to.equal(
      ONBOARD_USER.emailAddress
    )
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
    // No Logout link, so just call logout directly
    browser.url("/api/logout")
  })
})
