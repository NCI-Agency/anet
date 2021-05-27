import { expect } from "chai"
import CreatePerson from "../pages/createNewPerson.page"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowPerson from "../pages/showPerson.page"

const DEFAULT_USERNAME = "jack"

const NON_COUNTERPART_PRINCIPLE = {
  name: "Steve",
  birthday: "9 September 1999",
  politicalPosition: "Left"
}
const COUNTERPART_PRINCIPLE = {
  name: "Roger",
  birthday: "1 January 2001",
  politicalPosition: "Right"
}

const NEW_PERSON_FIELDS_1 = {
  lastname: "sensitivePerson1",
  rank: "CIV",
  gender: "FEMALE"
}

const NEW_PERSON_FIELDS_2 = {
  lastname: "sensitivePerson2",
  rank: "CIV",
  gender: "MALE"
}

describe("Visibility of custom sensitive information", () => {
  describe("Users", () => {
    it("Should be able to find the non counterpart principal with sensitive information", () => {
      Home.open("/", DEFAULT_USERNAME)
      Home.searchBar.setValue(NON_COUNTERPART_PRINCIPLE.name)
      Home.submitSearch.click()
      Search.foundPeopleTable.waitForExist({ timeout: 20000 })
      Search.foundPeopleTable.waitForDisplayed()
      Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name).click()
    })
    it("Should not be able to see political position field if not authorized", () => {
      ShowPerson.politicalPosition.waitForDisplayed({
        timeout: 1000,
        reverse: true
      })
    })
    it("Should be able to see birthday field with the correct value if authorized", () => {
      ShowPerson.birthday.waitForDisplayed()
      expect(ShowPerson.birthday.getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should be able to find the counterpart principal with sensitive information", () => {
      Home.open("/", DEFAULT_USERNAME)
      Home.searchBar.setValue(COUNTERPART_PRINCIPLE.name)
      Home.submitSearch.click()
      Search.foundPeopleTable.waitForExist({ timeout: 20000 })
      Search.foundPeopleTable.waitForDisplayed()
      Search.linkOfPersonFound(COUNTERPART_PRINCIPLE.name).click()
    })
    it("Should be able to see political position field with the correct value if counterpart", () => {
      ShowPerson.politicalPosition.waitForDisplayed()
      expect(ShowPerson.politicalPosition.getText()).to.equal(
        COUNTERPART_PRINCIPLE.politicalPosition
      )
    })
    it("Should be able to see birthday field with the correct value if counterpart", () => {
      ShowPerson.birthday.waitForDisplayed()
      expect(ShowPerson.birthday.getText()).to.equal(
        COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", () => {
      // just call logout directly
      browser.url("/api/logout")
    })
  })

  describe("Superusers", () => {
    it("Should be able to find the principal with sensitive information", () => {
      Home.openAsSuperUser()
      Home.searchBar.setValue(NON_COUNTERPART_PRINCIPLE.name)
      Home.submitSearch.click()
      Search.foundPeopleTable.waitForExist({ timeout: 20000 })
      Search.foundPeopleTable.waitForDisplayed()
      Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name).click()
    })
    it("Should not be able to see political position field if not authorized", () => {
      ShowPerson.politicalPosition.waitForDisplayed({
        timeout: 1000,
        reverse: true
      })
    })
    it("Should be able to see birthday field with the correct value if authorized", () => {
      ShowPerson.birthday.waitForDisplayed()
      expect(ShowPerson.birthday.getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", () => {
      // just call logout directly
      browser.url("/api/logout")
    })
  })

  describe("Admins", () => {
    it("Should be able to find the principal with sensitive information", () => {
      Home.openAsAdminUser()
      Home.searchBar.setValue(NON_COUNTERPART_PRINCIPLE.name)
      Home.submitSearch.click()
      Search.foundPeopleTable.waitForExist({ timeout: 20000 })
      Search.foundPeopleTable.waitForDisplayed()
      Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name).click()
    })
    it("Should be able to see political position field with the correct value", () => {
      ShowPerson.politicalPosition.waitForDisplayed()
      expect(ShowPerson.politicalPosition.getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.politicalPosition
      )
    })
    it("Should be able to see birthday field with the correct value", () => {
      ShowPerson.birthday.waitForDisplayed()
      expect(ShowPerson.birthday.getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", () => {
      // just call logout directly
      browser.url("/api/logout")
    })
  })
})

describe("Creating and editing custom sensitive information", () => {
  describe("Superusers", () => {
    it("Should be able load a new person form and fill normal required fields", () => {
      CreatePerson.openAsSuperUser()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      // fill other required fields at the beginning
      CreatePerson.lastName.setValue(NEW_PERSON_FIELDS_1.lastname)
      CreatePerson.rank.selectByAttribute("value", NEW_PERSON_FIELDS_1.rank)
      CreatePerson.gender.selectByAttribute("value", NEW_PERSON_FIELDS_1.gender)
    })
    it("Should not be able to edit sensitive fields if not authorized", () => {
      CreatePerson.politicalPositionSensitiveFieldContainer.waitForDisplayed({
        timeout: 1000,
        reverse: true
      })
    })
    it("Should be able to create a new person with sensitive information", () => {
      CreatePerson.birthday.setValue("08-06-1963")
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      expect(ShowPerson.birthday.getText()).to.equal("8 June 1963")
    })
    it("Should be able to edit sensitive information if authorized", () => {
      ShowPerson.editButton.click()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      CreatePerson.birthday.setValue(
        "\uE003".repeat(CreatePerson.birthday.getValue().length) + "01-01-1956"
      )
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      expect(ShowPerson.birthday.getText()).to.equal("1 January 1956")
    })
    it("Should logout", () => {
      // just call logout directly
      browser.url("/api/logout")
    })
  })

  describe("Admins", () => {
    it("Should be able load a new person form and fill normal required fields", () => {
      CreatePerson.openAsAdmin()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      // fill other required fields at the beginning
      CreatePerson.lastName.setValue(NEW_PERSON_FIELDS_2.lastname)
      CreatePerson.rank.selectByAttribute("value", NEW_PERSON_FIELDS_1.rank)
      CreatePerson.gender.selectByAttribute("value", NEW_PERSON_FIELDS_2.gender)
    })
    it("Should be able to create a new person with sensitive information", () => {
      CreatePerson.birthday.setValue("01-01-1956")
      CreatePerson.middleButton.click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      expect(ShowPerson.birthday.getText()).to.equal("1 January 1956")
      expect(ShowPerson.politicalPosition.getText()).to.equal("Middle")
    })
    it("Should be able to edit sensitive information", () => {
      ShowPerson.editButton.click()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      CreatePerson.birthday.setValue(
        "\uE003".repeat(CreatePerson.birthday.getValue().length) + "08-06-1963"
      )
      CreatePerson.leftButton.click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      expect(ShowPerson.birthday.getText()).to.equal("8 June 1963")
      expect(ShowPerson.politicalPosition.getText()).to.equal("Left")
    })
    it("Should logout", () => {
      // just call logout directly
      browser.url("/api/logout")
    })
  })
})
