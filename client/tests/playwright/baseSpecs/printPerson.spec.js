import { expect } from "@playwright/test"
import Home from "../pages/home.page.js"
import Search from "../pages/search.page.js"
import ShowPerson from "../pages/showPerson.page.js"
import { test, waitFor } from "../support.js"

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
    await waitFor(await Search.getFoundPeopleTable(), "attached", {
      timeout: 20000
    })
    await waitFor(await Search.getFoundPeopleTable(), "visible")
    await (await Search.linkOfPersonFound("Roger")).click()
    await (await ShowPerson.getCompactViewButton()).click()
    await waitFor(await ShowPerson.getCompactView(), "visible")
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
      await waitFor(
        await ShowPerson.getSensitiveInformationWarning(),
        "visible"
      )
    })
    test("Exclude sensitive fields preset should select correct fields", async () => {
      await (await ShowPerson.getPresetsButton()).click()
      await (await ShowPerson.getWithoutSensitivePreset()).click()
      await ShowPerson.waitForCompactField(
        false,
        ...PRESET_WITHOUT_SENSITIVE_LABELS
      )
      await waitFor(
        await ShowPerson.getSensitiveInformationWarning(),
        "visible",
        {
          reverse: true
        }
      )
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
      await waitFor(await ShowPerson.getCompactViewButton(), "visible")
    })
  })
})
