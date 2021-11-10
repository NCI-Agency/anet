import { expect } from "chai"
import moment from "moment"
import OnboardPage from "../pages/onboard.page"

const ONBOARD_USER = {
  lastName: "BONNSDOTTIR",
  firstName: "Bonny",
  emailAddress: "bonny@nato.int"
}

// Only required fields in onboarding/edit page
const personDetails = {
  rank: "CIV",
  gender: "FEMALE",
  country: "Albania",
  endOfTourDate: moment().add(1, "days").format("DD-MM-YYYY")
}

describe("Onboard new user login", () => {
  it("Should show onboard welcome", () => {
    OnboardPage.openAsOnboardUser()
    const welcomeText = "Welcome to ANET"
    OnboardPage.waitForWelcomeMessage(welcomeText)

    const securityText = OnboardPage.welcomeText.getText()
    expect(securityText).to.equal(welcomeText)
  })

  it("Should click on create your account", () => {
    OnboardPage.createYourAccountBtn.scrollIntoView()
    OnboardPage.createYourAccountBtn.click()
    browser.pause(500) // wait for the page transition and rendering of custom fields

    // Check that these are properly copied from the authentication server
    OnboardPage.lastName.waitForDisplayed()
    OnboardPage.lastName.waitForExist()
    expect(OnboardPage.lastName.getValue()).to.equal(ONBOARD_USER.lastName)
    OnboardPage.firstName.waitForDisplayed()
    OnboardPage.firstName.waitForExist()
    expect(OnboardPage.firstName.getValue()).to.equal(ONBOARD_USER.firstName)
    OnboardPage.emailAddress.waitForDisplayed()
    OnboardPage.emailAddress.waitForExist()
    expect(OnboardPage.emailAddress.getValue()).to.equal(
      ONBOARD_USER.emailAddress
    )
  })

  it("Should not save if endOfTourDate is not in the future", () => {
    OnboardPage.endOfTourDate.waitForExist()
    OnboardPage.endOfTourDate.click()

    OnboardPage.endOfTourToday.waitForDisplayed()
    OnboardPage.endOfTourToday.waitForExist()
    // select a date
    OnboardPage.endOfTourToday.click()
    OnboardPage.lastName.click()
    const errorMessage = OnboardPage.endOfTourDate
      .$("..")
      .$("..")
      .$("..")
      .$("..")
      .$("div.invalid-feedback")
    errorMessage.waitForExist()
    errorMessage.waitForDisplayed()
    expect(errorMessage.getText()).to.equal(
      "The End of tour date must be in the future"
    )
  })

  it("Should save if all fields properly filled", () => {
    OnboardPage.rank.selectByAttribute("value", personDetails.rank)
    OnboardPage.gender.selectByAttribute("value", personDetails.gender)
    OnboardPage.country.selectByAttribute("value", personDetails.country)
    OnboardPage.endOfTourDate.setValue(personDetails.endOfTourDate)
    OnboardPage.lastName.click()
    browser.pause(500) // wait for the error message to disappear
    OnboardPage.submitForm()

    OnboardPage.waitForAlertWarningToLoad()
    OnboardPage.onboardingPopover.waitForExist()
    OnboardPage.onboardingPopover.waitForDisplayed()
    // No Logout link, so just call logout directly
    browser.url("/api/logout")
  })
})
