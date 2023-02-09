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

    const securityText = OnboardPage.getWelcomeText().getText()
    expect(securityText).to.equal(welcomeText)
  })

  it("Should click on create your account", () => {
    OnboardPage.getCreateYourAccountBtn().scrollIntoView()
    OnboardPage.getCreateYourAccountBtn().click()
    browser.pause(500) // wait for the page transition and rendering of custom fields

    // Check that these are properly copied from the authentication server
    OnboardPage.getLastName().waitForDisplayed()
    OnboardPage.getLastName().waitForExist()
    expect(OnboardPage.getLastName().getValue()).to.equal(ONBOARD_USER.lastName)
    OnboardPage.getFirstName().waitForDisplayed()
    OnboardPage.getFirstName().waitForExist()
    expect(OnboardPage.getFirstName().getValue()).to.equal(
      ONBOARD_USER.firstName
    )
    OnboardPage.getEmailAddress().waitForDisplayed()
    OnboardPage.getEmailAddress().waitForExist()
    expect(OnboardPage.getEmailAddress().getValue()).to.equal(
      ONBOARD_USER.emailAddress
    )
  })

  it("Should not save if endOfTourDate is not in the future", () => {
    OnboardPage.getEndOfTourDate().waitForExist()
    OnboardPage.getEndOfTourDate().click()

    OnboardPage.getEndOfTourToday().waitForDisplayed()
    OnboardPage.getEndOfTourToday().waitForExist()
    // select a date
    OnboardPage.getEndOfTourToday().click()
    OnboardPage.getLastName().click()
    const errorMessage = OnboardPage.getEndOfTourDate()
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
    OnboardPage.getRank().selectByAttribute("value", personDetails.rank)
    OnboardPage.getGender().selectByAttribute("value", personDetails.gender)
    OnboardPage.getCountry().selectByAttribute("value", personDetails.country)
    OnboardPage.getEndOfTourDate().setValue(personDetails.endOfTourDate)
    OnboardPage.getLastName().click()
    browser.pause(500) // wait for the error message to disappear
    OnboardPage.submitForm()

    OnboardPage.waitForAlertWarningToLoad()
    OnboardPage.getOnboardingPopover().waitForExist()
    OnboardPage.getOnboardingPopover().waitForDisplayed()
    OnboardPage.logout()
  })
})
