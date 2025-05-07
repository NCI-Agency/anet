import { expect } from "chai"
import moment from "moment"
import OnboardPage from "../pages/onboard.page"

const ONBOARD_USER = {
  lastName: "Bonnsdottir",
  firstName: "Bonny",
  emailAddresses: ["", "bonny@example.com"]
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
    await (await OnboardPage.getLastName()).waitForExist()
    await (await OnboardPage.getLastName()).waitForDisplayed()
    expect(await (await OnboardPage.getLastName()).getValue()).to.equal(
      ONBOARD_USER.lastName
    )
    await (await OnboardPage.getFirstName()).waitForExist()
    await (await OnboardPage.getFirstName()).waitForDisplayed()
    expect(await (await OnboardPage.getFirstName()).getValue()).to.equal(
      ONBOARD_USER.firstName
    )
    await (await OnboardPage.getEmailAddress(0)).waitForExist()
    await (await OnboardPage.getEmailAddress(0)).waitForDisplayed()
    for (const [index, address] of ONBOARD_USER.emailAddresses.entries()) {
      expect(
        await (await OnboardPage.getEmailAddress(index)).getValue()
      ).to.equal(address)
    }
  })

  it("Should not save if endOfTourDate is not in the future", async() => {
    await (await OnboardPage.getEndOfTourDate()).waitForExist()
    await (await OnboardPage.getEndOfTourDate()).waitForDisplayed()

    const yesterday = moment().subtract(1, "days").format("DD-MM-YYYY")
    await OnboardPage.deleteInput(OnboardPage.getEndOfTourDate())
    await (await OnboardPage.getEndOfTourDate()).setValue(yesterday)

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

    await (await OnboardPage.getCountryInput()).click()
    await (await OnboardPage.getCountryInput()).setValue(personDetails.country)
    await OnboardPage.waitForCountryAdvancedSelectToChange(
      personDetails.country
    )
    expect(
      await (await OnboardPage.getCountryAdvancedSelectFirstItem()).getText()
    ).to.include(personDetails.country)
    await (await OnboardPage.getCountryAdvancedSelectFirstItem()).click()
    await (
      await OnboardPage.getCountryHelpBlock()
    ).waitForExist({ reverse: true })

    await (
      await OnboardPage.getEndOfTourDate()
    ).setValue(personDetails.endOfTourDate)
    await (await OnboardPage.getLastName()).click()
    await browser.pause(500) // wait for the error message to disappear
    await OnboardPage.submitForm()

    await OnboardPage.waitForAlertWarningToLoad()
    await OnboardPage.logout()
  })
})
