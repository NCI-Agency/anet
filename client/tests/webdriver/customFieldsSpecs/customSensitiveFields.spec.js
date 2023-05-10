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
    it("Should be able to find the non counterpart principal with sensitive information", async() => {
      await Home.open("/", DEFAULT_USERNAME)
      await (await Home.getSearchBar()).setValue(NON_COUNTERPART_PRINCIPLE.name)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundPeopleTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundPeopleTable()).waitForDisplayed()
      await (
        await Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name)
      ).click()
    })
    it("Should not be able to see political position field if not authorized", async() => {
      await (
        await ShowPerson.getPoliticalPosition()
      ).waitForDisplayed({
        timeout: 1000,
        reverse: true
      })
    })
    it("Should be able to see birthday field with the correct value if authorized", async() => {
      await (await ShowPerson.getBirthday()).waitForDisplayed()
      expect(await (await ShowPerson.getBirthday()).getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should be able to find the counterpart principal with sensitive information", async() => {
      await Home.open("/", DEFAULT_USERNAME)
      await (await Home.getSearchBar()).setValue(COUNTERPART_PRINCIPLE.name)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundPeopleTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundPeopleTable()).waitForDisplayed()
      await (await Search.linkOfPersonFound(COUNTERPART_PRINCIPLE.name)).click()
    })
    it("Should be able to see political position field with the correct value if counterpart", async() => {
      await (await ShowPerson.getPoliticalPosition()).waitForDisplayed()
      expect(
        await (await ShowPerson.getPoliticalPosition()).getText()
      ).to.equal(COUNTERPART_PRINCIPLE.politicalPosition)
    })
    it("Should be able to see birthday field with the correct value if counterpart", async() => {
      await (await ShowPerson.getBirthday()).waitForDisplayed()
      expect(await (await ShowPerson.getBirthday()).getText()).to.equal(
        COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", async() => {
      await ShowPerson.logout()
    })
  })

  describe("Superusers", () => {
    it("Should be able to find the principal with sensitive information", async() => {
      await Home.openAsSuperuser()
      await (await Home.getSearchBar()).setValue(NON_COUNTERPART_PRINCIPLE.name)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundPeopleTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundPeopleTable()).waitForDisplayed()
      await (
        await Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name)
      ).click()
    })
    it("Should not be able to see political position field if not authorized", async() => {
      await (
        await ShowPerson.getPoliticalPosition()
      ).waitForDisplayed({
        timeout: 1000,
        reverse: true
      })
    })
    it("Should be able to see birthday field with the correct value if authorized", async() => {
      await (await ShowPerson.getBirthday()).waitForDisplayed()
      expect(await (await ShowPerson.getBirthday()).getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", async() => {
      await ShowPerson.logout()
    })
  })

  describe("Admins", () => {
    it("Should be able to find the principal with sensitive information", async() => {
      await Home.openAsAdminUser()
      await (await Home.getSearchBar()).setValue(NON_COUNTERPART_PRINCIPLE.name)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundPeopleTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundPeopleTable()).waitForDisplayed()
      await (
        await Search.linkOfPersonFound(NON_COUNTERPART_PRINCIPLE.name)
      ).click()
    })
    it("Should be able to see political position field with the correct value", async() => {
      await (await ShowPerson.getPoliticalPosition()).waitForDisplayed()
      expect(
        await (await ShowPerson.getPoliticalPosition()).getText()
      ).to.equal(NON_COUNTERPART_PRINCIPLE.politicalPosition)
    })
    it("Should be able to see birthday field with the correct value", async() => {
      await (await ShowPerson.getBirthday()).waitForDisplayed()
      expect(await (await ShowPerson.getBirthday()).getText()).to.equal(
        NON_COUNTERPART_PRINCIPLE.birthday
      )
    })
    it("Should logout", async() => {
      await ShowPerson.logout()
    })
  })
})

describe("Creating and editing custom sensitive information", () => {
  describe("Superusers", () => {
    it("Should be able load a new person form and fill normal required fields", async() => {
      await CreatePerson.openAsSuperuser()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      // fill other required fields at the beginning
      await (
        await CreatePerson.getLastName()
      ).setValue(NEW_PERSON_FIELDS_1.lastname)
      await (
        await CreatePerson.getRank()
      ).selectByAttribute("value", NEW_PERSON_FIELDS_1.rank)
      await (
        await CreatePerson.getGender()
      ).selectByAttribute("value", NEW_PERSON_FIELDS_1.gender)
    })
    it("Should not be able to edit sensitive fields if not authorized", async() => {
      await (
        await CreatePerson.getPoliticalPositionSensitiveFieldContainer()
      ).waitForDisplayed({
        timeout: 1000,
        reverse: true
      })
    })
    it("Should be able to create a new person with sensitive information", async() => {
      await CreatePerson.deleteInput(CreatePerson.getBirthday())
      await (await CreatePerson.getBirthday()).setValue("08-06-1963")
      await (await CreatePerson.getLastName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      expect(await (await ShowPerson.getBirthday()).getText()).to.equal(
        "8 June 1963"
      )
    })
    it("Should be able to edit sensitive information if authorized", async() => {
      await (await ShowPerson.getEditButton()).click()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      await CreatePerson.deleteInput(CreatePerson.getBirthday())
      await (await CreatePerson.getBirthday()).setValue("01-01-1956")
      await (await CreatePerson.getLastName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      expect(await (await ShowPerson.getBirthday()).getText()).to.equal(
        "1 January 1956"
      )
    })
    it("Should logout", async() => {
      await CreatePerson.logout()
    })
  })

  describe("Admins", () => {
    it("Should be able load a new person form and fill normal required fields", async() => {
      await CreatePerson.openAsAdmin()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      // fill other required fields at the beginning
      await (
        await CreatePerson.getLastName()
      ).setValue(NEW_PERSON_FIELDS_2.lastname)
      await (
        await CreatePerson.getRank()
      ).selectByAttribute("value", NEW_PERSON_FIELDS_1.rank)
      await (
        await CreatePerson.getGender()
      ).selectByAttribute("value", NEW_PERSON_FIELDS_2.gender)
    })
    it("Should be able to create a new person with sensitive information", async() => {
      await CreatePerson.deleteInput(CreatePerson.getBirthday())
      await (await CreatePerson.getBirthday()).setValue("01-01-1956")
      await (await CreatePerson.getLastName()).click()
      await (await CreatePerson.getMiddleButton()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      expect(await (await ShowPerson.getBirthday()).getText()).to.equal(
        "1 January 1956"
      )
      expect(
        await (await ShowPerson.getPoliticalPosition()).getText()
      ).to.equal("Middle")
    })
    it("Should be able to edit sensitive information", async() => {
      await (await ShowPerson.getEditButton()).click()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      await CreatePerson.deleteInput(CreatePerson.getBirthday())
      await (await CreatePerson.getBirthday()).setValue("08-06-1963")
      await (await CreatePerson.getLastName()).click()
      await (await CreatePerson.getLeftButton()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      expect(await (await ShowPerson.getBirthday()).getText()).to.equal(
        "8 June 1963"
      )
      expect(
        await (await ShowPerson.getPoliticalPosition()).getText()
      ).to.equal("Left")
    })
    it("Should logout", async() => {
      await CreatePerson.logout()
    })
  })
})
