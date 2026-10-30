import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import SearchPageObject from "../pages/search.page.js"
import ShowPersonPageObject from "../pages/showPerson.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, Search, ShowPerson
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    Search = new SearchPageObject(page)
    ShowPerson = new ShowPersonPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const SOME_FIELDS = {
    currentPosition: {
      id: "position",
      fieldLabel: "Primary Position"
    },
    previousPositions: {
      id: "prevPositions",
      fieldLabel: "Previous Positions"
    },
    phone: {
      id: "phoneNumber",
      fieldLabel: "Phone"
    },
    gender: {
      id: "gender",
      fieldLabel: "Gender"
    },
    birthday: {
      id: "birthday",
      fieldLabel: "Date of birth"
    }
  }
  const PRESET_DEFAULT_LABELS = [
    "Primary Position",
    "Previous Positions",
    "Phone",
    "Nationality",
    "Date of birth",
    "Position on the political spectrum",
    "Rank",
    "Biography"
  ]
  const PRESET_WITHOUT_SENSITIVE_LABELS = [
    "Primary Position",
    "Previous Positions",
    "Phone",
    "Nationality",
    "Rank",
    "Biography"
  ]
  test.describe("Show person page", () => {
    test.beforeEach("Should have print button", async () => {
      await Home.openAsAdminUser()
      await (await Home.getSearchBar()).fill("Roger Rogwell")
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
        state: "visible",
        timeout: 10000
      })
      await (await Search.linkOfPersonFound("Roger")).click()
      await (await ShowPerson.getCompactViewButton()).click()
      await (
        await ShowPerson.getCompactView()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
    })
    test.describe("When on the print person page", () => {
      test("All fields can be selected using the optional fields dropdown", async () => {
        await (await ShowPerson.getOptionalFieldsButton()).click()
        await (await ShowPerson.getSelectAllButton()).click()
        await ShowPerson.waitForCompactField(
          false,
          ...Object.values(SOME_FIELDS).map(field => field.fieldLabel)
        )
      })
      test("All fields can be cleared using the optional fields dropdown", async () => {
        await (await ShowPerson.getOptionalFieldsButton()).click()
        await (await ShowPerson.getClearAllButton()).click()
        await ShowPerson.waitForCompactField(
          true,
          ...Object.values(SOME_FIELDS).map(field => field.fieldLabel)
        )
      })
      test("Individual fields can be selected using optional fields dropdown", async () => {
        await (await ShowPerson.getOptionalFieldsButton()).click()
        await (await ShowPerson.getClearAllButton()).click()
        await ShowPerson.pickACompactField(SOME_FIELDS.currentPosition.id)
        await ShowPerson.waitForCompactField(
          false,
          SOME_FIELDS.currentPosition.fieldLabel
        )
        await ShowPerson.pickACompactField(SOME_FIELDS.birthday.id)
        await ShowPerson.waitForCompactField(
          false,
          SOME_FIELDS.birthday.fieldLabel
        )
      })
      test("Default preset should select correct fields and display sensitive information warning", async () => {
        await (await ShowPerson.getPresetsButton()).click()
        await (await ShowPerson.getDefaultPreset()).click()
        await ShowPerson.waitForCompactField(false, ...PRESET_DEFAULT_LABELS)
        await (
          await ShowPerson.getSensitiveInformationWarning()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      })
      test("Exclude sensitive fields preset should select correct fields", async () => {
        await (await ShowPerson.getPresetsButton()).click()
        await (await ShowPerson.getWithoutSensitivePreset()).click()
        await ShowPerson.waitForCompactField(
          false,
          ...PRESET_WITHOUT_SENSITIVE_LABELS
        )
        await (
          await ShowPerson.getSensitiveInformationWarning()
        ).waitFor({
          state: "hidden",
          timeout: 10000
        })
      })
      test("Should select the number of fields on the left", async () => {
        await (await ShowPerson.getOptionalFieldsButton()).click()
        await (await ShowPerson.getSelectAllButton()).click()
        await (await ShowPerson.getLeftColumnNumber()).fill(String(4))
        // Left column contains 2 additional fields name and avatar
        expect((await ShowPerson.getLeftTableFields()).length).toBe(4)
      })
      test("Should return to the show person page when detailed view button clicked", async () => {
        await (await ShowPerson.getDetailedViewButton()).click()
        await (
          await ShowPerson.getCompactViewButton()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      })
    })
  })
})
