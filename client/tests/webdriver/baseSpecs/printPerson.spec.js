import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowPerson from "../pages/showPerson.page"

const SOME_FIELDS = {
  currentPosition: {
    id: "position",
    fieldLabel: "Current Position"
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
  "Current Position",
  "Previous Positions",
  "Phone",
  "Nationality",
  "Date of birth",
  "Position on the political spectrum",
  "Rank",
  "Biography"
]

const PRESET_WITHOUT_SENSITIVE_LABELS = [
  "Current Position",
  "Previous Positions",
  "Phone",
  "Nationality",
  "Rank",
  "Biography"
]

describe("Show person page", () => {
  beforeEach("Should have print button", async () => {
    await Home.openAsAdminUser()
    await (await Home.getSearchBar()).setValue("Roger")
    await (await Home.getSubmitSearch()).click()
    await (await Search.getFoundPeopleTable()).waitForExist({ timeout: 20000 })
    await (await Search.getFoundPeopleTable()).waitForDisplayed()
    await (await Search.linkOfPersonFound("Roger")).click()
    await (await ShowPerson.getCompactViewButton()).waitForExist()
    await (await ShowPerson.getCompactViewButton()).waitForDisplayed()
    await (await ShowPerson.getCompactViewButton()).click()
    await (await ShowPerson.getCompactView()).waitForExist()
    await (await ShowPerson.getCompactView()).waitForDisplayed()
  })
  describe("When on the print person page", () => {
    it("All fields can be selected using the optional fields dropdown", async () => {
      await (await ShowPerson.getOptionalFieldsButton()).click()
      await (await ShowPerson.getSelectAllButton()).waitForDisplayed()
      await (await ShowPerson.getSelectAllButton()).click()
      await ShowPerson.waitForCompactField(
        false,
        ...Object.values(SOME_FIELDS).map(field => field.fieldLabel)
      )
    })
    it("All fields can be cleared using the optional fields dropdown", async () => {
      await (await ShowPerson.getOptionalFieldsButton()).click()
      await (await ShowPerson.getClearAllButton()).waitForDisplayed()
      await (await ShowPerson.getClearAllButton()).click()
      await ShowPerson.waitForCompactField(
        true,
        ...Object.values(SOME_FIELDS).map(field => field.fieldLabel)
      )
    })
    it("Individual fields can be selected using optional fields dropdown", async () => {
      await (await ShowPerson.getOptionalFieldsButton()).click()
      await (await ShowPerson.getClearAllButton()).waitForDisplayed()
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
    it("Default preset should select correct fields and display sensitive information warning", async () => {
      await (await ShowPerson.getPresetsButton()).click()
      await (await ShowPerson.getDefaultPreset()).waitForDisplayed()
      await (await ShowPerson.getDefaultPreset()).click()
      await ShowPerson.waitForCompactField(false, ...PRESET_DEFAULT_LABELS)
      await (
        await ShowPerson.getSensitiveInformationWarning()
      ).waitForDisplayed()
    })
    it("Exclude sensitive fields preset should select correct fields", async () => {
      await (await ShowPerson.getPresetsButton()).click()
      await (await ShowPerson.getWithoutSensitivePreset()).waitForDisplayed()
      await (await ShowPerson.getWithoutSensitivePreset()).click()
      await ShowPerson.waitForCompactField(
        false,
        ...PRESET_WITHOUT_SENSITIVE_LABELS
      )
      await (
        await ShowPerson.getSensitiveInformationWarning()
      ).waitForDisplayed({
        reverse: true
      })
    })
    it("Should select the number of fields on the left", async () => {
      await (await ShowPerson.getOptionalFieldsButton()).click()
      await (await ShowPerson.getSelectAllButton()).waitForDisplayed()
      await (await ShowPerson.getSelectAllButton()).click()
      await (await ShowPerson.getLeftColumnNumber()).setValue(4)
      // Left column contains 2 additional fields name and avatar
      expect((await ShowPerson.getLeftTableFields()).length).to.equal(6)
    })
    it("Should return to the show person page when detailed view button clicked", async () => {
      await (await ShowPerson.getDetailedViewButton()).click()
      await (await ShowPerson.getCompactViewButton()).waitForExist()
      await (await ShowPerson.getCompactViewButton()).waitForDisplayed()
    })
  })
})
