import { expect } from "chai"
import moment from "moment"
import CreatePerson from "../pages/createNewPerson.page"

const VALID_PERSON_PRINCIPAL = {
  lastName: "Doe"
}
const VALID_PERSON_ADVISOR = {
  lastName: "Roe",
  firstName: "Jane",
  emailAddress: "test@NATO.INT"
}

const SIMILAR_PERSON_ADVISOR = {
  lastName: "ERINSON",
  firstName: "Erin"
}

describe("Create new Person form page", () => {
  describe("When creating a Principle user", () => {
    beforeEach("On the create person page...", async() => {
      await CreatePerson.openAsSuperuser()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
    })

    afterEach("On the create person page...", async() => {
      await CreatePerson.logout()
    })

    it("Should not save a principle without gender being filled in", async() => {
      await (await CreatePerson.getLastName()).waitForDisplayed()
      await (
        await CreatePerson.getLastName()
      ).setValue(VALID_PERSON_PRINCIPAL.lastName)
      await (await CreatePerson.getGender()).click()
      await (await CreatePerson.getLastName()).click()
      const errorMessage = await browser.$(
        'select[name="gender"] + div.invalid-feedback'
      )
      await errorMessage.waitForExist()
      await errorMessage.waitForDisplayed()
      expect(await errorMessage.getText()).to.equal(
        "You must provide the Gender"
      )

      await (
        await CreatePerson.getGender()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await (
        await CreatePerson.getRank()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreatePerson.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Person saved")
    })
    it("Should save a principle without first name", async() => {
      await (await CreatePerson.getLastName()).waitForDisplayed()
      await (
        await CreatePerson.getLastName()
      ).setValue(VALID_PERSON_PRINCIPAL.lastName)
      await (
        await CreatePerson.getRank()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await (
        await CreatePerson.getGender()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreatePerson.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Person saved")
    })
    it("Should not save a principle without a valid email address", async() => {
      await (await CreatePerson.getLastName()).waitForDisplayed()
      await (
        await CreatePerson.getLastName()
      ).setValue(VALID_PERSON_PRINCIPAL.lastName)
      await (
        await CreatePerson.getRank()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await (
        await CreatePerson.getGender()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await (await CreatePerson.getEmailAddress()).setValue("notValidEmail@")
      await (await CreatePerson.getLastName()).click()
      const errorMessage = await browser.$(
        "input#emailAddress + div.invalid-feedback"
      )
      await errorMessage.waitForExist()
      await errorMessage.waitForDisplayed()
      expect(await errorMessage.getText()).to.equal(
        "Email must be a valid email"
      )

      // perform submit form to prevent warning dialog
      await CreatePerson.deleteInput(CreatePerson.getEmailAddress())
      await (await CreatePerson.getEmailAddress()).setValue("test@example.com")
      await (await CreatePerson.getLastName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreatePerson.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Person saved")
    })
  })

  describe("When creating an Advisor user", () => {
    it("Should display possible duplicates with similar names", async() => {
      await CreatePerson.openAsAdmin()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      await (await CreatePerson.getLastName()).waitForDisplayed()
      await (
        await CreatePerson.getLastName()
      ).setValue(SIMILAR_PERSON_ADVISOR.lastName)
      await (await CreatePerson.getFirstName()).waitForDisplayed()
      await (
        await CreatePerson.getFirstName()
      ).setValue(SIMILAR_PERSON_ADVISOR.firstName)
      await (await CreatePerson.getDuplicatesButton()).waitForDisplayed()
      await (await CreatePerson.getDuplicatesButton()).click()
      await (await CreatePerson.getModalContent()).waitForDisplayed()
      await (await CreatePerson.getSimilarPerson()).waitForDisplayed()
      const similar = await (await CreatePerson.getSimilarPerson()).getText()
      await (await CreatePerson.getModalCloseButton()).waitForDisplayed()
      await (await CreatePerson.getModalCloseButton()).click()
      await (
        await CreatePerson.getModalContent()
      ).waitForDisplayed({ reverse: true })
      expect(similar).to.equal("CIV ERINSON, Erin")
    })
    it("Should display a warning message specific for duplicate accounts", async() => {
      // Only admin users can create an advisor user
      await CreatePerson.openAsAdmin()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      await (await CreatePerson.getRoleAdvisorButton()).waitForExist()
      await (await CreatePerson.getRoleAdvisorButton()).click()
      const warningMessage = await browser.$(".alert.alert-warning")
      await warningMessage.waitForExist()
      await warningMessage.waitForDisplayed()
      expect(await warningMessage.getText()).to.equal(
        "Creating a NATO Member in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts, please contact an ANET administrator."
      )
      // Don't logout, next test continues…
    })
    it("Should save even if endOfTourDate is not filled in", async() => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      await (
        await CreatePerson.getLastName()
      ).setValue(VALID_PERSON_ADVISOR.lastName)
      await (
        await CreatePerson.getFirstName()
      ).setValue(VALID_PERSON_ADVISOR.firstName)
      await (await CreatePerson.getRoleAdvisorButton()).waitForExist()
      await (await CreatePerson.getRoleAdvisorButton()).click()
      await (
        await CreatePerson.getEmailAddress()
      ).setValue(VALID_PERSON_ADVISOR.emailAddress)
      await (
        await CreatePerson.getRank()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await (
        await CreatePerson.getGender()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await (
        await CreatePerson.getCountry()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getCountry())
      )
      await (await CreatePerson.getEndOfTourDate()).setValue("")
      await (await CreatePerson.getLastName()).click()
      const errorMessage = await browser.$(
        "input#emailAddress + div.invalid-feedback"
      )
      // element should *not* be visible!
      await errorMessage.waitForDisplayed({ timeout: 1000, reverse: true })
      // Don't logout, next test continues…
    })

    it("Should save with a valid email address in uppercase", async() => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      await (
        await CreatePerson.getLastName()
      ).setValue(VALID_PERSON_ADVISOR.lastName)
      await (
        await CreatePerson.getFirstName()
      ).setValue(VALID_PERSON_ADVISOR.firstName)
      await (await CreatePerson.getRoleAdvisorButton()).waitForExist()
      await (await CreatePerson.getRoleAdvisorButton()).click()
      await CreatePerson.deleteInput(CreatePerson.getEmailAddress())
      await (
        await CreatePerson.getEmailAddress()
      ).setValue(VALID_PERSON_ADVISOR.emailAddress)
      await (await CreatePerson.getLastName()).click()
      const errorMessage = await browser.$(
        "input#emailAddress + div.invalid-feedback"
      )
      // element should *not* be visible!
      await errorMessage.waitForDisplayed({ timeout: 1000, reverse: true })
      await (
        await CreatePerson.getRank()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getRank())
      )
      await (
        await CreatePerson.getGender()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getGender())
      )
      await (
        await CreatePerson.getCountry()
      ).selectByAttribute(
        "value",
        await CreatePerson.getRandomOption(await CreatePerson.getCountry())
      )
      const tomorrow = moment().add(1, "days").format("DD-MM-YYYY")

      await CreatePerson.deleteInput(CreatePerson.getEndOfTourDate())
      await (await CreatePerson.getEndOfTourDate()).setValue(tomorrow)
      await (await CreatePerson.getLastName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreatePerson.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Person saved")
      await CreatePerson.logout()
    })
  })
})
