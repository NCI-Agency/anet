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
    beforeEach("On the create person page...", () => {
      CreatePerson.openAsSuperUser()
      CreatePerson.getForm().waitForExist()
      CreatePerson.getForm().waitForDisplayed()
    })

    afterEach("On the create person page...", () => {
      CreatePerson.logout()
    })

    it("Should not save a principle without gender being filled in", () => {
      CreatePerson.getLastName().waitForDisplayed()
      CreatePerson.getLastName().setValue(VALID_PERSON_PRINCIPAL.lastName)
      CreatePerson.getGender().click()
      CreatePerson.getLastName().click()
      const errorMessage = browser.$(
        'select[name="gender"] + div.invalid-feedback'
      )
      errorMessage.waitForExist()
      errorMessage.waitForDisplayed()
      expect(errorMessage.getText()).to.equal("You must provide the Gender")

      CreatePerson.getGender().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getGender())
      )
      CreatePerson.getRank().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getRank())
      )
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = CreatePerson.getAlertSuccess().getText()
      expect(alertMessage).to.equal("Person saved")
    })
    it("Should save a principle without first name", () => {
      CreatePerson.getLastName().waitForDisplayed()
      CreatePerson.getLastName().setValue(VALID_PERSON_PRINCIPAL.lastName)
      CreatePerson.getRank().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getRank())
      )
      CreatePerson.getGender().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getGender())
      )
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = CreatePerson.getAlertSuccess().getText()
      expect(alertMessage).to.equal("Person saved")
    })
    it("Should not save a principle without a valid email address", () => {
      CreatePerson.getLastName().waitForDisplayed()
      CreatePerson.getLastName().setValue(VALID_PERSON_PRINCIPAL.lastName)
      CreatePerson.getRank().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getRank())
      )
      CreatePerson.getGender().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getGender())
      )
      CreatePerson.getEmailAddress().setValue("notValidEmail@")
      CreatePerson.getLastName().click()
      const errorMessage = browser.$(
        "input#emailAddress + div.invalid-feedback"
      )
      errorMessage.waitForExist()
      errorMessage.waitForDisplayed()
      expect(errorMessage.getText()).to.equal("Email must be a valid email")

      // perform submit form to prevent warning dialog
      CreatePerson.deleteInput(CreatePerson.getEmailAddress())
      CreatePerson.getEmailAddress().setValue("test@example.com")
      CreatePerson.getLastName().click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = CreatePerson.getAlertSuccess().getText()
      expect(alertMessage).to.equal("Person saved")
    })
  })

  describe("When creating an Advisor user", () => {
    it("Should display possible duplicates with similar names", () => {
      CreatePerson.openAsAdmin()
      CreatePerson.getForm().waitForExist()
      CreatePerson.getForm().waitForDisplayed()
      CreatePerson.getLastName().waitForDisplayed()
      CreatePerson.getLastName().setValue(SIMILAR_PERSON_ADVISOR.lastName)
      CreatePerson.getFirstName().waitForDisplayed()
      CreatePerson.getFirstName().setValue(SIMILAR_PERSON_ADVISOR.firstName)
      CreatePerson.getDuplicatesButton().waitForDisplayed()
      CreatePerson.getDuplicatesButton().click()
      CreatePerson.getModalContent().waitForDisplayed()
      CreatePerson.getSimilarPerson().waitForDisplayed()
      const similar = CreatePerson.getSimilarPerson().getText()
      CreatePerson.getModalCloseButton().waitForDisplayed()
      CreatePerson.getModalCloseButton().click()
      CreatePerson.getModalContent().waitForDisplayed({ reverse: true })
      expect(similar).to.equal("CIV ERINSON, Erin")
    })
    it("Should display a warning message specific for duplicate accounts", () => {
      // Only admin users can create an advisor user
      CreatePerson.openAsAdmin()
      CreatePerson.getForm().waitForExist()
      CreatePerson.getForm().waitForDisplayed()
      CreatePerson.getRoleAdvisorButton().waitForExist()
      CreatePerson.getRoleAdvisorButton().click()
      const warningMessage = browser.$(".alert.alert-warning")
      warningMessage.waitForExist()
      warningMessage.waitForDisplayed()
      expect(warningMessage.getText()).to.equal(
        "Creating a NATO Member in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts, please contact an ANET administrator."
      )
      // Don't logout, next test continues…
    })
    it("Should not save if endOfTourDate is not filled in", () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      CreatePerson.getLastName().setValue(VALID_PERSON_ADVISOR.lastName)
      CreatePerson.getFirstName().setValue(VALID_PERSON_ADVISOR.firstName)
      CreatePerson.getRoleAdvisorButton().waitForExist()
      CreatePerson.getRoleAdvisorButton().click()
      CreatePerson.getEmailAddress().setValue(VALID_PERSON_ADVISOR.emailAddress)
      CreatePerson.getLastName().click()
      let errorMessage = browser.$("input#emailAddress + div.invalid-feedback")
      // element should *not* be visible!
      errorMessage.waitForDisplayed({ timeout: 1000, reverse: true })
      CreatePerson.getRank().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getRank())
      )
      CreatePerson.getGender().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getGender())
      )
      CreatePerson.getCountry().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getCountry())
      )
      // This makes sure the help-block is displayed after form submit
      CreatePerson.getEndOfTourDate().setValue("")
      CreatePerson.getLastName().click()
      errorMessage = CreatePerson.getEndOfTourDate()
        .$("..")
        .$("..")
        .$("..")
        .$("..")
        .$("div.invalid-feedback")
      errorMessage.waitForExist()
      errorMessage.waitForDisplayed()
      expect(errorMessage.getText()).to.equal(
        "You must provide the End of tour"
      )
      // Don't logout, next test continues…
    })

    it("Should save with a valid email address in uppercase", () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      CreatePerson.getLastName().setValue(VALID_PERSON_ADVISOR.lastName)
      CreatePerson.getFirstName().setValue(VALID_PERSON_ADVISOR.firstName)
      CreatePerson.getRoleAdvisorButton().waitForExist()
      CreatePerson.getRoleAdvisorButton().click()
      CreatePerson.deleteInput(CreatePerson.getEmailAddress())
      CreatePerson.getEmailAddress().setValue(VALID_PERSON_ADVISOR.emailAddress)
      CreatePerson.getLastName().click()
      const errorMessage = browser.$(
        "input#emailAddress + div.invalid-feedback"
      )
      // element should *not* be visible!
      errorMessage.waitForDisplayed({ timeout: 1000, reverse: true })
      CreatePerson.getRank().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getRank())
      )
      CreatePerson.getGender().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getGender())
      )
      CreatePerson.getCountry().selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.getCountry())
      )
      const tomorrow = moment().add(1, "days").format("DD-MM-YYYY")

      CreatePerson.deleteInput(CreatePerson.getEndOfTourDate())
      CreatePerson.getEndOfTourDate().setValue(tomorrow)
      CreatePerson.getLastName().click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = CreatePerson.getAlertSuccess().getText()
      expect(alertMessage).to.equal("Person saved")
      CreatePerson.logout()
    })
  })
})
