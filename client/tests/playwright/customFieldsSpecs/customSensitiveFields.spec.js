import { expect as pwExpect } from "@playwright/test"
import CreatePerson from "../pages/createNewPerson.page.js"
import Home from "../pages/home.page.js"
import Search from "../pages/search.page.js"
import ShowPerson from "../pages/showPerson.page.js"
import { test, waitFor } from "../support.js"

const DEFAULT_USERNAME = "jack"
const NON_COUNTERPART_INTERLOCUTOR = {
  name: "Steve Steveson",
  birthday: "9 September 1999",
  politicalPosition: "Left"
}
const COUNTERPART_INTERLOCUTOR = {
  name: "Roger Rogwell",
  birthday: "1 January 2001",
  politicalPosition: "Right"
}
const NEW_PERSON_FIELDS_1 = {
  familyName: "sensitivePerson1",
  rank: "CIV",
  gender: "FEMALE",
  country: "Türkiye"
}
const NEW_PERSON_FIELDS_2 = {
  familyName: "sensitivePerson2",
  rank: "CIV",
  gender: "MALE",
  country: "Türkiye"
}
test.describe("Visibility of custom sensitive information", () => {
  test.describe("Users", () => {
    test("Should be able to find the non counterpart interlocutor with sensitive information", async () => {
      await Home.open("/", DEFAULT_USERNAME)
      await (
        await Home.getSearchBar()
      ).fill(String(NON_COUNTERPART_INTERLOCUTOR.name))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundPeopleTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundPeopleTable(), "visible")
      await (
        await Search.linkOfPersonFound(NON_COUNTERPART_INTERLOCUTOR.name)
      ).click()
    })
    test("Should not be able to see political position field if not authorized", async () => {
      await waitFor(await ShowPerson.getPoliticalPosition(), "visible", {
        timeout: 1000,
        reverse: true
      })
    })
    test("Should be able to see birthday field with the correct value if authorized", async () => {
      await waitFor(await ShowPerson.getBirthday(), "visible")
      await pwExpect(await ShowPerson.getBirthday()).toHaveText(
        NON_COUNTERPART_INTERLOCUTOR.birthday,
        {
          useInnerText: true
        }
      )
    })
    test("Should be able to find the counterpart interlocutor with sensitive information", async () => {
      await Home.open("/", DEFAULT_USERNAME)
      await (
        await Home.getSearchBar()
      ).fill(String(COUNTERPART_INTERLOCUTOR.name))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundPeopleTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundPeopleTable(), "visible")
      await (
        await Search.linkOfPersonFound(COUNTERPART_INTERLOCUTOR.name)
      ).click()
    })
    test("Should be able to see political position field with the correct value if counterpart", async () => {
      await waitFor(await ShowPerson.getPoliticalPosition(), "visible")
      await pwExpect(await ShowPerson.getPoliticalPosition()).toHaveText(
        COUNTERPART_INTERLOCUTOR.politicalPosition,
        {
          useInnerText: true
        }
      )
    })
    test("Should be able to see birthday field with the correct value if counterpart", async () => {
      await waitFor(await ShowPerson.getBirthday(), "visible")
      await pwExpect(await ShowPerson.getBirthday()).toHaveText(
        COUNTERPART_INTERLOCUTOR.birthday,
        {
          useInnerText: true
        }
      )
    })
    test("Should logout", async () => {
      await ShowPerson.logout()
    })
  })
  test.describe("Superusers", () => {
    test("Should be able to find the interlocutor with sensitive information", async () => {
      await Home.openAsSuperuser()
      await (
        await Home.getSearchBar()
      ).fill(String(NON_COUNTERPART_INTERLOCUTOR.name))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundPeopleTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundPeopleTable(), "visible")
      await (
        await Search.linkOfPersonFound(NON_COUNTERPART_INTERLOCUTOR.name)
      ).click()
    })
    test("Should not be able to see political position field if not authorized", async () => {
      await waitFor(await ShowPerson.getPoliticalPosition(), "visible", {
        timeout: 1000,
        reverse: true
      })
    })
    test("Should be able to see birthday field with the correct value if authorized", async () => {
      await waitFor(await ShowPerson.getBirthday(), "visible")
      await pwExpect(await ShowPerson.getBirthday()).toHaveText(
        NON_COUNTERPART_INTERLOCUTOR.birthday,
        {
          useInnerText: true
        }
      )
    })
    test("Should logout", async () => {
      await ShowPerson.logout()
    })
  })
  test.describe("Admins", () => {
    test("Should be able to find the interlocutor with sensitive information", async () => {
      await Home.openAsAdminUser()
      await (
        await Home.getSearchBar()
      ).fill(String(NON_COUNTERPART_INTERLOCUTOR.name))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundPeopleTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundPeopleTable(), "visible")
      await (
        await Search.linkOfPersonFound(NON_COUNTERPART_INTERLOCUTOR.name)
      ).click()
    })
    test("Should be able to see political position field with the correct value", async () => {
      await waitFor(await ShowPerson.getPoliticalPosition(), "visible")
      await pwExpect(await ShowPerson.getPoliticalPosition()).toHaveText(
        NON_COUNTERPART_INTERLOCUTOR.politicalPosition,
        {
          useInnerText: true
        }
      )
    })
    test("Should be able to see birthday field with the correct value", async () => {
      await waitFor(await ShowPerson.getBirthday(), "visible")
      await pwExpect(await ShowPerson.getBirthday()).toHaveText(
        NON_COUNTERPART_INTERLOCUTOR.birthday,
        {
          useInnerText: true
        }
      )
    })
    test("Should logout", async () => {
      await ShowPerson.logout()
    })
  })
})
test.describe("Creating and editing custom sensitive information", () => {
  test.describe("Superusers", () => {
    test("Should be able load a new person form and fill normal required fields", async () => {
      await CreatePerson.openAsSuperuser()
      await waitFor(await CreatePerson.getForm(), "attached")
      await waitFor(await CreatePerson.getForm(), "visible")
      // fill other required fields at the beginning
      await (
        await CreatePerson.getFamilyName()
      ).fill(String(NEW_PERSON_FIELDS_1.familyName))
      await (
        await CreatePerson.getRank()
      ).selectOption(NEW_PERSON_FIELDS_1.rank)
      await (
        await CreatePerson.getGender()
      ).selectOption(NEW_PERSON_FIELDS_1.gender)
      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).fill(String(NEW_PERSON_FIELDS_1.country))
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        NEW_PERSON_FIELDS_1.country
      )
      await pwExpect(
        await CreatePerson.getCountryAdvancedSelectFirstItem()
      ).toContainText(NEW_PERSON_FIELDS_1.country, {
        useInnerText: true
      })
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await waitFor(await CreatePerson.getCountryHelpBlock(), "attached", {
        reverse: true
      })
    })
    test("Should not be able to edit sensitive fields if not authorized", async () => {
      await waitFor(
        await CreatePerson.getPoliticalPositionSensitiveFieldContainer(),
        "visible",
        {
          timeout: 1000,
          reverse: true
        }
      )
    })
    test("Should be able to create a new person with sensitive information", async () => {
      await CreatePerson.deleteInput(CreatePerson.getBirthday())
      await (await CreatePerson.getBirthday()).fill("08-06-1963")
      await (await CreatePerson.getFamilyName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      await pwExpect(await ShowPerson.getBirthday()).toHaveText("8 June 1963", {
        useInnerText: true
      })
    })
    test("Should be able to edit sensitive information if authorized", async () => {
      await (await ShowPerson.getEditButton()).click()
      await waitFor(await CreatePerson.getForm(), "attached")
      await waitFor(await CreatePerson.getForm(), "visible")
      await CreatePerson.deleteInput(CreatePerson.getBirthday())
      await (await CreatePerson.getBirthday()).fill("01-01-1956")
      await (await CreatePerson.getFamilyName()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      await pwExpect(await ShowPerson.getBirthday()).toHaveText(
        "1 January 1956",
        {
          useInnerText: true
        }
      )
    })
    test("Should logout", async () => {
      await CreatePerson.logout()
    })
  })
  test.describe("Admins", () => {
    test("Should be able load a new person form and fill normal required fields", async () => {
      await CreatePerson.openAsAdmin()
      await waitFor(await CreatePerson.getForm(), "attached")
      await waitFor(await CreatePerson.getForm(), "visible")
      // fill other required fields at the beginning
      await (
        await CreatePerson.getFamilyName()
      ).fill(String(NEW_PERSON_FIELDS_2.familyName))
      await (
        await CreatePerson.getRank()
      ).selectOption(NEW_PERSON_FIELDS_2.rank)
      await (
        await CreatePerson.getGender()
      ).selectOption(NEW_PERSON_FIELDS_2.gender)
      await (await CreatePerson.getCountryInput()).click()
      await (
        await CreatePerson.getCountryInput()
      ).fill(String(NEW_PERSON_FIELDS_2.country))
      await CreatePerson.waitForCountryAdvancedSelectToChange(
        NEW_PERSON_FIELDS_2.country
      )
      await pwExpect(
        await CreatePerson.getCountryAdvancedSelectFirstItem()
      ).toContainText(NEW_PERSON_FIELDS_2.country, {
        useInnerText: true
      })
      await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
      await waitFor(await CreatePerson.getCountryHelpBlock(), "attached", {
        reverse: true
      })
    })
    test("Should be able to create a new person with sensitive information", async () => {
      await CreatePerson.deleteInput(CreatePerson.getBirthday())
      await (await CreatePerson.getBirthday()).fill("01-01-1956")
      await (await CreatePerson.getFamilyName()).click()
      await (await CreatePerson.getMiddleButton()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      await pwExpect(await ShowPerson.getBirthday()).toHaveText(
        "1 January 1956",
        {
          useInnerText: true
        }
      )
      await pwExpect(await ShowPerson.getPoliticalPosition()).toHaveText(
        "Middle",
        {
          useInnerText: true
        }
      )
    })
    test("Should be able to edit sensitive information", async () => {
      await (await ShowPerson.getEditButton()).click()
      await waitFor(await CreatePerson.getForm(), "attached")
      await waitFor(await CreatePerson.getForm(), "visible")
      await CreatePerson.deleteInput(CreatePerson.getBirthday())
      await (await CreatePerson.getBirthday()).fill("08-06-1963")
      await (await CreatePerson.getFamilyName()).click()
      await (await CreatePerson.getLeftButton()).click()
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
      await pwExpect(await ShowPerson.getBirthday()).toHaveText("8 June 1963", {
        useInnerText: true
      })
      await pwExpect(await ShowPerson.getPoliticalPosition()).toHaveText(
        "Left",
        {
          useInnerText: true
        }
      )
    })
    test("Should logout", async () => {
      await CreatePerson.logout()
    })
  })
})
