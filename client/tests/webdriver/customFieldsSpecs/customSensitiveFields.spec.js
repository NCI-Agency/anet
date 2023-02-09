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
      Home.getSearchBar().setValue(NON_COUNTERPART_PRINCIPLE.name)
      Home.getSubmitSearch().click()
      Search.getFoundPeopleTable().waitForExist({ timeout: 20000 })
      Search.getFoundPeopleTable().waitForDisplayed()
      Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name).click()
    })
    it("Should not be able to see political position field if not authorized", () => {
      ShowPerson.getPoliticalPosition().waitForDisplayed({
        timeout: 1000,
        reverse: true
      })
    })
    it("Should be able to see birthday field with the correct value if authorized", () => {
      ShowPerson.getBirthday().waitForDisplayed()
      expect(ShowPerson.getBirthday().getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should be able to find the counterpart principal with sensitive information", () => {
      Home.open("/", DEFAULT_USERNAME)
      Home.getSearchBar().setValue(COUNTERPART_PRINCIPLE.name)
      Home.getSubmitSearch().click()
      Search.getFoundPeopleTable().waitForExist({ timeout: 20000 })
      Search.getFoundPeopleTable().waitForDisplayed()
      Search.linkOfPersonFound(COUNTERPART_PRINCIPLE.name).click()
    })
    it("Should be able to see political position field with the correct value if counterpart", () => {
      ShowPerson.getPoliticalPosition().waitForDisplayed()
      expect(ShowPerson.getPoliticalPosition().getText()).to.equal(
        COUNTERPART_PRINCIPLE.politicalPosition
      )
    })
    it("Should be able to see birthday field with the correct value if counterpart", () => {
      ShowPerson.getBirthday().waitForDisplayed()
      expect(ShowPerson.getBirthday().getText()).to.equal(
        COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", () => {
      ShowPerson.logout()
    })
  })

  describe("Superusers", () => {
    it("Should be able to find the principal with sensitive information", () => {
      Home.openAsSuperUser()
      Home.getSearchBar().setValue(NON_COUNTERPART_PRINCIPLE.name)
      Home.getSubmitSearch().click()
      Search.getFoundPeopleTable().waitForExist({ timeout: 20000 })
      Search.getFoundPeopleTable().waitForDisplayed()
      Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name).click()
    })
    it("Should not be able to see political position field if not authorized", () => {
      ShowPerson.getPoliticalPosition().waitForDisplayed({
        timeout: 1000,
        reverse: true
      })
    })
    it("Should be able to see birthday field with the correct value if authorized", () => {
      ShowPerson.getBirthday().waitForDisplayed()
      expect(ShowPerson.getBirthday().getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", () => {
      ShowPerson.logout()
    })
  })

  describe("Admins", () => {
    it("Should be able to find the principal with sensitive information", () => {
      Home.openAsAdminUser()
      Home.getSearchBar().setValue(NON_COUNTERPART_PRINCIPLE.name)
      Home.getSubmitSearch().click()
      Search.getFoundPeopleTable().waitForExist({ timeout: 20000 })
      Search.getFoundPeopleTable().waitForDisplayed()
      Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name).click()
    })
    it("Should be able to see political position field with the correct value", () => {
      ShowPerson.getPoliticalPosition().waitForDisplayed()
      expect(ShowPerson.getPoliticalPosition().getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.politicalPosition
      )
    })
    it("Should be able to see birthday field with the correct value", () => {
      ShowPerson.getBirthday().waitForDisplayed()
      expect(ShowPerson.getBirthday().getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", () => {
      ShowPerson.logout()
    })
  })
})

describe("Creating and editing custom sensitive information", () => {
  describe("Superusers", () => {
    it("Should be able load a new person form and fill normal required fields", () => {
      CreatePerson.openAsSuperUser()
      CreatePerson.getForm().waitForExist()
      CreatePerson.getForm().waitForDisplayed()
      // fill other required fields at the beginning
      CreatePerson.getLastName().setValue(NEW_PERSON_FIELDS_1.lastname)
      CreatePerson.getRank().selectByAttribute(
        "value",
        NEW_PERSON_FIELDS_1.rank
      )
      CreatePerson.getGender().selectByAttribute(
        "value",
        NEW_PERSON_FIELDS_1.gender
      )
    })
    it("Should not be able to edit sensitive fields if not authorized", () => {
      CreatePerson.getPoliticalPositionSensitiveFieldContainer().waitForDisplayed(
        {
          timeout: 1000,
          reverse: true
        }
      )
    })
    it("Should be able to create a new person with sensitive information", () => {
      CreatePerson.deleteInput(CreatePerson.getBirthday())
      CreatePerson.getBirthday().setValue("08-06-1963")
      CreatePerson.getLastName().click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      expect(ShowPerson.getBirthday().getText()).to.equal("8 June 1963")
    })
    it("Should be able to edit sensitive information if authorized", () => {
      ShowPerson.getEditButton().click()
      CreatePerson.getForm().waitForExist()
      CreatePerson.getForm().waitForDisplayed()
      CreatePerson.deleteInput(CreatePerson.getBirthday())
      CreatePerson.getBirthday().setValue("01-01-1956")
      CreatePerson.getLastName().click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      expect(ShowPerson.getBirthday().getText()).to.equal("1 January 1956")
    })
    it("Should logout", () => {
      CreatePerson.logout()
    })
  })

  describe("Admins", () => {
    it("Should be able load a new person form and fill normal required fields", () => {
      CreatePerson.openAsAdmin()
      CreatePerson.getForm().waitForExist()
      CreatePerson.getForm().waitForDisplayed()
      // fill other required fields at the beginning
      CreatePerson.getLastName().setValue(NEW_PERSON_FIELDS_2.lastname)
      CreatePerson.getRank().selectByAttribute(
        "value",
        NEW_PERSON_FIELDS_1.rank
      )
      CreatePerson.getGender().selectByAttribute(
        "value",
        NEW_PERSON_FIELDS_2.gender
      )
    })
    it("Should be able to create a new person with sensitive information", () => {
      CreatePerson.deleteInput(CreatePerson.getBirthday())
      CreatePerson.getBirthday().setValue("01-01-1956")
      CreatePerson.getLastName().click()
      CreatePerson.getMiddleButton().click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      expect(ShowPerson.getBirthday().getText()).to.equal("1 January 1956")
      expect(ShowPerson.getPoliticalPosition().getText()).to.equal("Middle")
    })
    it("Should be able to edit sensitive information", () => {
      ShowPerson.getEditButton().click()
      CreatePerson.getForm().waitForExist()
      CreatePerson.getForm().waitForDisplayed()
      CreatePerson.deleteInput(CreatePerson.getBirthday())
      CreatePerson.getBirthday().setValue("08-06-1963")
      CreatePerson.getLastName().click()
      CreatePerson.getLeftButton().click()
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
      expect(ShowPerson.getBirthday().getText()).to.equal("8 June 1963")
      expect(ShowPerson.getPoliticalPosition().getText()).to.equal("Left")
    })
    it("Should logout", () => {
      CreatePerson.logout()
    })
  })
})
