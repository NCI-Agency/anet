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
  it("Should show onboard welcome", async() => {
    await OnboardPage.openAsOnboardUser()
    const welcomeText = "Welcome to ANET"
    await OnboardPage.waitForWelcomeMessage(welcomeText)

    const securityText = await (await OnboardPage.getWelcomeText()).getText()
    expect(securityText).to.equal(welcomeText)
  })

  it("Should click on create your account", async() => {
    await (await OnboardPage.getCreateYourAccountBtn()).scrollIntoView()
    await (await OnboardPage.getCreateYourAccountBtn()).click()
    await browser.pause(500) // wait for the page transition and rendering of custom fields

    // Check that these are properly copied from the authentication server
    await (await OnboardPage.getLastName()).waitForDisplayed()
    await (await OnboardPage.getLastName()).waitForExist()
    expect(await (await OnboardPage.getLastName()).getValue()).to.equal(
      ONBOARD_USER.lastName
    )
    await (await OnboardPage.getFirstName()).waitForDisplayed()
    await (await OnboardPage.getFirstName()).waitForExist()
    expect(await (await OnboardPage.getFirstName()).getValue()).to.equal(
      ONBOARD_USER.firstName
    )
    await (await OnboardPage.getEmailAddress()).waitForDisplayed()
    await (await OnboardPage.getEmailAddress()).waitForExist()
    expect(await (await OnboardPage.getEmailAddress()).getValue()).to.equal(
      ONBOARD_USER.emailAddress
    )
  })

  it("Should not save if endOfTourDate is not in the future", async() => {
    await (await OnboardPage.getEndOfTourDate()).waitForExist()
    await (await OnboardPage.getEndOfTourDate()).click()

    await (await OnboardPage.getEndOfTourToday()).waitForDisplayed()
    await (await OnboardPage.getEndOfTourToday()).waitForExist()
    // select a date
    await (await OnboardPage.getEndOfTourToday()).click()
    await (await OnboardPage.getLastName()).click()
    const errorMessage = await (await OnboardPage.getEndOfTourDate())
      .$("..")
      .$("..")
      .$("..")
      .$("..")
      .$("div.invalid-feedback")
    await errorMessage.waitForExist()
    await errorMessage.waitForDisplayed()
    expect(await errorMessage.getText()).to.equal(
      "The End of tour date must be in the future"
    )
  })

  it("Should save if all fields properly filled", async() => {
    await (
      await OnboardPage.getRank()
    ).selectByAttribute("value", personDetails.rank)
    await (
      await OnboardPage.getGender()
    ).selectByAttribute("value", personDetails.gender)
    await (
      await OnboardPage.getCountry()
    ).selectByAttribute("value", personDetails.country)
    await (
      await OnboardPage.getEndOfTourDate()
    ).setValue(personDetails.endOfTourDate)
    await (await OnboardPage.getLastName()).click()
    await browser.pause(500) // wait for the error message to disappear
    await OnboardPage.submitForm()

    await OnboardPage.waitForAlertWarningToLoad()
    await (await OnboardPage.getOnboardingPopover()).waitForExist()
    await (await OnboardPage.getOnboardingPopover()).waitForDisplayed()
    await OnboardPage.logout()
  })
})
