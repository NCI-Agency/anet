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

describe("Create new Person form page", () => {
  describe("When creating a Principle user", () => {
    it("Should not save a principle without gender being filled in", () => {
      CreatePerson.openAsSuperUser()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      CreatePerson.lastName.waitForDisplayed()
      CreatePerson.lastName.setValue(VALID_PERSON_PRINCIPAL.lastName)
      CreatePerson.gender.click()
      CreatePerson.lastName.click()
      const errorMessage = browser.$('select[name="gender"] + span.help-block')
      errorMessage.waitForExist()
      errorMessage.waitForDisplayed()
      expect(errorMessage.getText()).to.equal("You must provide the Gender")

      CreatePerson.gender.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.gender)
      )
      CreatePerson.rank.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.rank)
      )
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = CreatePerson.alertSuccess.getText()
      expect(alertMessage).to.equal("Person saved")
    })
    it("Should save a principle without first name", () => {
      CreatePerson.openAsSuperUser()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      CreatePerson.lastName.waitForDisplayed()
      CreatePerson.lastName.setValue(VALID_PERSON_PRINCIPAL.lastName)
      CreatePerson.rank.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.rank)
      )
      CreatePerson.gender.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.gender)
      )
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = CreatePerson.alertSuccess.getText()
      expect(alertMessage).to.equal("Person saved")
    })
    it("Should not save a principle without a valid email address", () => {
      CreatePerson.openAsSuperUser()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      CreatePerson.lastName.waitForDisplayed()
      CreatePerson.lastName.setValue(VALID_PERSON_PRINCIPAL.lastName)
      CreatePerson.rank.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.rank)
      )
      CreatePerson.gender.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.gender)
      )
      CreatePerson.emailAddress.setValue("notValidEmail@")
      CreatePerson.lastName.click()
      const errorMessage = browser.$("input#emailAddress + span.help-block")
      errorMessage.waitForExist()
      errorMessage.waitForDisplayed()
      expect(errorMessage.getText()).to.equal("Email must be a valid email")

      // perform submit form to prevent warning dialog
      CreatePerson.emailAddress.setValue(
        "\uE003".repeat(CreatePerson.emailAddress.getValue().length) +
          "test@dds.mil"
      )
      CreatePerson.lastName.click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = CreatePerson.alertSuccess.getText()
      expect(alertMessage).to.equal("Person saved")
    })
  })

  describe("When creating an Advisor user", () => {
    it("Should display a warning message specific for duplicate accounts", () => {
      // Only admin users can create an advisor user
      CreatePerson.openAsAdmin()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      CreatePerson.roleAdvisorButton.waitForExist()
      CreatePerson.roleAdvisorButton.click()
      const warningMessage = browser.$(".alert.alert-warning")
      warningMessage.waitForExist()
      warningMessage.waitForDisplayed()
      expect(warningMessage.getText()).to.equal(
        "Creating a NATO Member in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts, please contact an ANET administrator."
      )
    })
    it("Should not save if endOfTourDate is not filled in", () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      CreatePerson.lastName.setValue(VALID_PERSON_ADVISOR.lastName)
      CreatePerson.firstName.setValue(VALID_PERSON_ADVISOR.firstName)
      CreatePerson.roleAdvisorButton.waitForExist()
      CreatePerson.roleAdvisorButton.click()
      CreatePerson.emailAddress.setValue(VALID_PERSON_ADVISOR.emailAddress)
      CreatePerson.lastName.click()
      let errorMessage = browser.$("input#emailAddress + span.help-block")
      errorMessage.waitForDisplayed(1000, true) // element should *not* be visible!
      CreatePerson.rank.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.rank)
      )
      CreatePerson.gender.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.gender)
      )
      CreatePerson.country.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.country)
      )
      // This makes sure the help-block is displayed after form submit
      CreatePerson.endOfTourDate.setValue("")
      CreatePerson.lastName.click()
      errorMessage = CreatePerson.endOfTourDate
        .$("..")
        .$("..")
        .$("..")
        .$("..")
        .$("span.help-block")
      errorMessage.waitForExist()
      errorMessage.waitForDisplayed()
      expect(errorMessage.getText()).to.equal(
        "You must provide the End of tour"
      )
    })

    it("Should save with a valid email address in uppercase", () => {
      // Continue on the same page to prevent "Are you sure you wish to navigate away from the page" warning
      CreatePerson.lastName.setValue(VALID_PERSON_ADVISOR.lastName)
      CreatePerson.firstName.setValue(VALID_PERSON_ADVISOR.firstName)
      CreatePerson.roleAdvisorButton.waitForExist()
      CreatePerson.roleAdvisorButton.click()
      CreatePerson.emailAddress.setValue(
        "\uE003".repeat(CreatePerson.emailAddress.getValue().length) +
          VALID_PERSON_ADVISOR.emailAddress
      )
      CreatePerson.lastName.click()
      const errorMessage = browser.$("input#emailAddress + span.help-block")
      errorMessage.waitForDisplayed(1000, true) // element should *not* be visible!
      CreatePerson.rank.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.rank)
      )
      CreatePerson.gender.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.gender)
      )
      CreatePerson.country.selectByAttribute(
        "value",
        CreatePerson.getRandomOption(CreatePerson.country)
      )
      const tomorrow = moment()
        .add(1, "days")
        .format("DD-MM-YYYY")

      CreatePerson.endOfTourDate.setValue(
        "\uE003".repeat(CreatePerson.endOfTourDate.getValue().length) + tomorrow
      )
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      const alertMessage = CreatePerson.alertSuccess.getText()
      expect(alertMessage).to.equal("Person saved")
    })
  })
})
