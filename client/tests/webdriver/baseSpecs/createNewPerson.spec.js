import { expect } from "chai"
import moment from "moment"
import CreatePerson from "../pages/createNewPerson.page"

const VALID_PERSON_INTERLOCUTOR = {
  familyName: "Doe",
  country: "Denmark"
}
const VALID_PERSON_ADVISOR = {
  familyName: "Roe",
  givenName: "Jane",
  country: "Canada",
  emailAddresses: ["", "test@NATO.INT"]
}
const NOT_SIMILAR_PERSON_ADVISOR = {
  familyName: "XXX",
  givenName: "XXX"
}

const SIMILAR_PERSON_ADVISOR = {
  familyName: "Erinson",
  givenName: "Erin"
}

describe("Create new Person form page", () => {
  describe("When creating a non-user", () => {
    beforeEach("On the create person page…", async () => {
      await CreatePerson.openAsSuperuser()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
    })

    afterEach("On the create person page…", async () => {
      await CreatePerson.logout()
    })

    it("Should not save a person without gender being filled in", async () => {
      await (await CreatePerson.getFamilyName()).waitForDisplayed()
      await (
        await CreatePerson.getFamilyName()
      ).setValue(VALID_PERSON_INTERLOCUTOR.familyName)
      await (await CreatePerson.getGender()).click()
      await (await CreatePerson.getFamilyName()).click()
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

      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).setValue(VALID_PERSON_INTERLOCUTOR.country)
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        VALID_PERSON_INTERLOCUTOR.country
      )
      expect(
        await (await CreatePerson.getCountryAdvancedSelectFirstItem()).getText()
      ).to.include(VALID_PERSON_INTERLOCUTOR.country)
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await (
        await CreatePerson.getCountryHelpBlock()
      ).waitForExist({ reverse: true })

      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreatePerson.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Person saved")
    })
    it("Should save a person without first name", async () => {
      await (await CreatePerson.getFamilyName()).waitForDisplayed()
      await (
        await CreatePerson.getFamilyName()
      ).setValue(VALID_PERSON_INTERLOCUTOR.familyName)
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

      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).setValue(VALID_PERSON_INTERLOCUTOR.country)
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        VALID_PERSON_INTERLOCUTOR.country
      )
      expect(
        await (await CreatePerson.getCountryAdvancedSelectFirstItem()).getText()
      ).to.include(VALID_PERSON_INTERLOCUTOR.country)
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await (
        await CreatePerson.getCountryHelpBlock()
      ).waitForExist({ reverse: true })

      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreatePerson.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Person saved")
    })
    it("Should not save a person without a valid email address", async () => {
      await (await CreatePerson.getFamilyName()).waitForDisplayed()
      await (
        await CreatePerson.getFamilyName()
      ).setValue(VALID_PERSON_INTERLOCUTOR.familyName)
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

      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).setValue(VALID_PERSON_INTERLOCUTOR.country)
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        VALID_PERSON_INTERLOCUTOR.country
      )
      expect(
        await (await CreatePerson.getCountryAdvancedSelectFirstItem()).getText()
      ).to.include(VALID_PERSON_INTERLOCUTOR.country)
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await (
        await CreatePerson.getCountryHelpBlock()
      ).waitForExist({ reverse: true })

      await (await CreatePerson.getEmailAddress(0)).setValue("notValidEmail@")
      await (await CreatePerson.getFamilyName()).click()
      const errorMessage = await CreatePerson.getEmailAddressMessage(0)
      await errorMessage.waitForExist()
      await errorMessage.waitForDisplayed()
      expect(await errorMessage.getText()).to.equal(
        "Address must be a valid email"
      )

      // perform submit form to prevent warning dialog
      await CreatePerson.deleteInput(CreatePerson.getEmailAddress(0))
      await (await CreatePerson.getEmailAddress(0)).setValue("test@example.com")
      await (await CreatePerson.getFamilyName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreatePerson.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Person saved")
    })
  })

  describe("When creating a user", () => {
    it("Should display possible duplicates with similar names", async () => {
      await CreatePerson.openAsAdmin()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      await (await CreatePerson.getFamilyName()).waitForDisplayed()
      await (
        await CreatePerson.getFamilyName()
      ).setValue(SIMILAR_PERSON_ADVISOR.familyName)
      await (await CreatePerson.getGivenName()).waitForDisplayed()
      await (
        await CreatePerson.getGivenName()
      ).setValue(SIMILAR_PERSON_ADVISOR.givenName)
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
      expect(similar).to.equal("CIV Erin Erinson")
    })
    it("Should display a warning message specific for duplicate accounts", async () => {
      // Only admin users can create an advisor user
      await CreatePerson.openAsAdmin()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      await (await CreatePerson.getUserTrueButton()).waitForExist()
      await (await CreatePerson.getUserTrueButton()).click()
      await (await CreatePerson.getAlertWarning()).waitForExist()
      await (await CreatePerson.getAlertWarning()).waitForDisplayed()
      expect(await (await CreatePerson.getAlertWarning()).getText()).to.equal(
        "Creating a user in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts you should take action."
      )
      // Don't logout, next test continues…
    })

    it("Should not save a user without a tenant", async () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      await (
        await CreatePerson.getFamilyName()
      ).setValue(VALID_PERSON_ADVISOR.familyName)
      await (
        await CreatePerson.getGivenName()
      ).setValue(VALID_PERSON_ADVISOR.givenName)
      await (await CreatePerson.getUserTrueButton()).waitForExist()
      await (await CreatePerson.getUserTrueButton()).click()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await CreatePerson.getNoTenantWarning()).isExisting()).to.be
        .true
      for (const [
        index,
        address
      ] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
        await CreatePerson.deleteInput(CreatePerson.getEmailAddress(index))
        await (await CreatePerson.getEmailAddress(index)).setValue(address)
      }
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

      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).setValue(VALID_PERSON_ADVISOR.country)
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        VALID_PERSON_ADVISOR.country
      )
      expect(
        await (await CreatePerson.getCountryAdvancedSelectFirstItem()).getText()
      ).to.include(VALID_PERSON_ADVISOR.country)
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await (
        await CreatePerson.getCountryHelpBlock()
      ).waitForExist({ reverse: true })

      await CreatePerson.submitForm()
      // eslint-disable-next-line no-unused-expressions
      expect(await (await CreatePerson.getAlertSuccess()).isExisting()).to.be
        .false
      await (await CreatePerson.getTenantsError()).waitForExist()
      await (await CreatePerson.getTenantsError()).waitForDisplayed()
      expect(await (await CreatePerson.getTenantsError()).getText()).to.equal(
        "An active user must be a member of at least one active Tenant"
      )
      await (await CreatePerson.getTenantsInput()).scrollIntoView()
      await (await CreatePerson.getTenantsInput()).click()
      await (
        await CreatePerson.getTenantsAdvancedSelectFirstItem()
      ).waitForExist()
      await (
        await CreatePerson.getTenantsAdvancedSelectFirstItem()
      ).waitForDisplayed()
      await (await CreatePerson.getTenantsAdvancedSelectFirstItem()).click()
      await (
        await CreatePerson.getTenantsError()
      ).waitForExist({ reverse: true })
      // eslint-disable-next-line no-unused-expressions
      expect(await (await CreatePerson.getNoTenantWarning()).isExisting()).to.be
        .false
      // Don't logout, next test continues…
    })

    it("Should save even if endOfTourDate is not filled in", async () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      await (await CreatePerson.getEndOfTourDate()).setValue("")
      await (await CreatePerson.getFamilyName()).click()
      for (const [index] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
        const errorMessage = await CreatePerson.getEmailAddressMessage(index)
        // element should *not* be visible!
        await errorMessage.waitForDisplayed({ timeout: 1000, reverse: true })
      }
      // Don't logout, next test continues…
    })

    it("Should save with a valid email address in uppercase", async () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      for (const [
        index,
        address
      ] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
        await CreatePerson.deleteInput(CreatePerson.getEmailAddress(index))
        await (await CreatePerson.getEmailAddress(index)).setValue(address)
      }
      await (await CreatePerson.getFamilyName()).click()
      for (const [index] of VALID_PERSON_ADVISOR.emailAddresses.entries()) {
        const errorMessage = await CreatePerson.getEmailAddressMessage(index)
        // element should *not* be visible!
        await errorMessage.waitForDisplayed({ timeout: 1000, reverse: true })
      }

      const tomorrow = moment().add(1, "days").format("DD-MM-YYYY")
      await CreatePerson.deleteInput(CreatePerson.getEndOfTourDate())
      await (await CreatePerson.getEndOfTourDate()).setValue(tomorrow)
      await (await CreatePerson.getFamilyName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = await (
        await CreatePerson.getAlertSuccess()
      ).getText()
      expect(alertMessage).to.equal("Person saved")
      await CreatePerson.logout()
    })

    it("Should not display possible duplicates button", async () => {
      await CreatePerson.openAsAdmin()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      await (await CreatePerson.getFamilyName()).waitForDisplayed()
      await (
        await CreatePerson.getFamilyName()
      ).setValue(NOT_SIMILAR_PERSON_ADVISOR.familyName)
      await (await CreatePerson.getGivenName()).waitForDisplayed()
      await (
        await CreatePerson.getGivenName()
      ).setValue(NOT_SIMILAR_PERSON_ADVISOR.givenName)
      // eslint-disable-next-line no-unused-expressions
      expect(await (await CreatePerson.getDuplicatesButton()).isExisting()).to
        .be.false
    })
  })
})
