import { expect, test } from "@playwright/test"
import CreatePersonPageObject from "../pages/createNewPerson.page.js"
import HomePageObject from "../pages/home.page.js"
import SearchPageObject from "../pages/search.page.js"
import ShowPersonPageObject from "../pages/showPerson.page.js"

test.describe(() => {
  let CreatePerson, Home, Search, ShowPerson
  test.beforeEach(async ({ page }) => {
    CreatePerson = new CreatePersonPageObject(page)
    Home = new HomePageObject(page)
    Search = new SearchPageObject(page)
    ShowPerson = new ShowPersonPageObject(page)
  })
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
  test("Visibility of custom sensitive information", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 15)

    await test.step("Users", async () => {
      await test.step(
        "Should be able to find the non counterpart interlocutor with sensitive information",
        async () => {
          await Home.open("/", DEFAULT_USERNAME)
          await (
            await Home.getSearchBar()
          ).fill(String(NON_COUNTERPART_INTERLOCUTOR.name))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundPeopleTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundPeopleTable()
          ).waitFor({
            state: "visible"
          })
          await (
            await Search.linkOfPersonFound(NON_COUNTERPART_INTERLOCUTOR.name)
          ).click()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not be able to see political position field if not authorized",
        async () => {
          await (
            await ShowPerson.getPoliticalPosition()
          ).waitFor({
            state: "hidden",
            timeout: 1000
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to see birthday field with the correct value if authorized",
        async () => {
          await (
            await ShowPerson.getBirthday()
          ).waitFor({
            state: "visible"
          })
          await expect(await ShowPerson.getBirthday()).toHaveText(
            NON_COUNTERPART_INTERLOCUTOR.birthday,
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to find the counterpart interlocutor with sensitive information",
        async () => {
          await Home.open("/", DEFAULT_USERNAME)
          await (
            await Home.getSearchBar()
          ).fill(String(COUNTERPART_INTERLOCUTOR.name))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundPeopleTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundPeopleTable()
          ).waitFor({
            state: "visible"
          })
          await (
            await Search.linkOfPersonFound(COUNTERPART_INTERLOCUTOR.name)
          ).click()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to see political position field with the correct value if counterpart",
        async () => {
          await (
            await ShowPerson.getPoliticalPosition()
          ).waitFor({
            state: "visible"
          })
          await expect(await ShowPerson.getPoliticalPosition()).toHaveText(
            COUNTERPART_INTERLOCUTOR.politicalPosition,
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to see birthday field with the correct value if counterpart",
        async () => {
          await (
            await ShowPerson.getBirthday()
          ).waitFor({
            state: "visible"
          })
          await expect(await ShowPerson.getBirthday()).toHaveText(
            COUNTERPART_INTERLOCUTOR.birthday,
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should logout",
        async () => {
          await ShowPerson.logout()
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("Superusers", async () => {
      await test.step(
        "Should be able to find the interlocutor with sensitive information",
        async () => {
          await Home.openAsSuperuser()
          await (
            await Home.getSearchBar()
          ).fill(String(NON_COUNTERPART_INTERLOCUTOR.name))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundPeopleTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundPeopleTable()
          ).waitFor({
            state: "visible"
          })
          await (
            await Search.linkOfPersonFound(NON_COUNTERPART_INTERLOCUTOR.name)
          ).click()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not be able to see political position field if not authorized",
        async () => {
          await (
            await ShowPerson.getPoliticalPosition()
          ).waitFor({
            state: "hidden",
            timeout: 1000
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to see birthday field with the correct value if authorized",
        async () => {
          await (
            await ShowPerson.getBirthday()
          ).waitFor({
            state: "visible"
          })
          await expect(await ShowPerson.getBirthday()).toHaveText(
            NON_COUNTERPART_INTERLOCUTOR.birthday,
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should logout",
        async () => {
          await ShowPerson.logout()
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("Admins", async () => {
      await test.step(
        "Should be able to find the interlocutor with sensitive information",
        async () => {
          await Home.openAsAdminUser()
          await (
            await Home.getSearchBar()
          ).fill(String(NON_COUNTERPART_INTERLOCUTOR.name))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundPeopleTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundPeopleTable()
          ).waitFor({
            state: "visible"
          })
          await (
            await Search.linkOfPersonFound(NON_COUNTERPART_INTERLOCUTOR.name)
          ).click()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to see political position field with the correct value",
        async () => {
          await (
            await ShowPerson.getPoliticalPosition()
          ).waitFor({
            state: "visible"
          })
          await expect(await ShowPerson.getPoliticalPosition()).toHaveText(
            NON_COUNTERPART_INTERLOCUTOR.politicalPosition,
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to see birthday field with the correct value",
        async () => {
          await (
            await ShowPerson.getBirthday()
          ).waitFor({
            state: "visible"
          })
          await expect(await ShowPerson.getBirthday()).toHaveText(
            NON_COUNTERPART_INTERLOCUTOR.birthday,
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should logout",
        async () => {
          await ShowPerson.logout()
        },
        { timeout: stepTimeout }
      )
    })
  })
  test("Creating and editing custom sensitive information", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 9)

    await test.step("Superusers", async () => {
      await test.step(
        "Should be able load a new person form and fill normal required fields",
        async () => {
          await CreatePerson.openAsSuperuser()
          await (
            await CreatePerson.getForm()
          ).waitFor({
            state: "visible"
          })
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
          await expect(
            await CreatePerson.getCountryAdvancedSelectFirstItem()
          ).toContainText(NEW_PERSON_FIELDS_1.country, {
            useInnerText: true
          })
          await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
          await (
            await CreatePerson.getCountryHelpBlock()
          ).waitFor({
            state: "detached"
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not be able to edit sensitive fields if not authorized",
        async () => {
          await (
            await CreatePerson.getPoliticalPositionSensitiveFieldContainer()
          ).waitFor({
            state: "hidden",
            timeout: 1000
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to create a new person with sensitive information",
        async () => {
          await CreatePerson.deleteInput(CreatePerson.getBirthday())
          await (await CreatePerson.getBirthday()).fill("08-06-1963")
          await (await CreatePerson.getFamilyName()).click()
          await CreatePerson.submitForm()
          await CreatePerson.waitForAlertSuccessToLoad()
          await expect(await ShowPerson.getBirthday()).toHaveText(
            "8 June 1963",
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to edit sensitive information if authorized",
        async () => {
          await (await ShowPerson.getEditButton()).click()
          await (
            await CreatePerson.getForm()
          ).waitFor({
            state: "visible"
          })
          await CreatePerson.deleteInput(CreatePerson.getBirthday())
          await (await CreatePerson.getBirthday()).fill("01-01-1956")
          await (await CreatePerson.getFamilyName()).click()
          await CreatePerson.submitForm()
          await CreatePerson.waitForAlertSuccessToLoad()
          await expect(await ShowPerson.getBirthday()).toHaveText(
            "1 January 1956",
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should logout",
        async () => {
          await CreatePerson.logout()
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("Admins", async () => {
      await test.step(
        "Should be able load a new person form and fill normal required fields",
        async () => {
          await CreatePerson.openAsAdmin()
          await (
            await CreatePerson.getForm()
          ).waitFor({
            state: "visible"
          })
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
          await expect(
            await CreatePerson.getCountryAdvancedSelectFirstItem()
          ).toContainText(NEW_PERSON_FIELDS_2.country, {
            useInnerText: true
          })
          await (await CreatePerson.getCountryAdvancedSelectFirstItem()).click()
          await (
            await CreatePerson.getCountryHelpBlock()
          ).waitFor({
            state: "detached"
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to create a new person with sensitive information",
        async () => {
          await CreatePerson.deleteInput(CreatePerson.getBirthday())
          await (await CreatePerson.getBirthday()).fill("01-01-1956")
          await (await CreatePerson.getFamilyName()).click()
          await (await CreatePerson.getMiddleButton()).click()
          await CreatePerson.submitForm()
          await CreatePerson.waitForAlertSuccessToLoad()
          await expect(await ShowPerson.getBirthday()).toHaveText(
            "1 January 1956",
            {
              useInnerText: true
            }
          )
          await expect(await ShowPerson.getPoliticalPosition()).toHaveText(
            "Middle",
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should be able to edit sensitive information",
        async () => {
          await (await ShowPerson.getEditButton()).click()
          await (
            await CreatePerson.getForm()
          ).waitFor({
            state: "visible"
          })
          await CreatePerson.deleteInput(CreatePerson.getBirthday())
          await (await CreatePerson.getBirthday()).fill("08-06-1963")
          await (await CreatePerson.getFamilyName()).click()
          await (await CreatePerson.getLeftButton()).click()
          await CreatePerson.submitForm()
          await CreatePerson.waitForAlertSuccessToLoad()
          await expect(await ShowPerson.getBirthday()).toHaveText(
            "8 June 1963",
            {
              useInnerText: true
            }
          )
          await expect(await ShowPerson.getPoliticalPosition()).toHaveText(
            "Left",
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should logout",
        async () => {
          await CreatePerson.logout()
        },
        { timeout: stepTimeout }
      )
    })
  })
})
