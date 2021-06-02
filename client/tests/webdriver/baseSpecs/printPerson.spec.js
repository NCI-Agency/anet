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
  domainUsername: {
    id: "domainUsername",
    fieldLabel: "Domain username"
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
  "Domain username",
  "Position on the political spectrum",
  "Rank",
  "Biography"
]

const PRESET_WITHOUT_SENSITIVE_LABELS = [
  "Current Position",
  "Previous Positions",
  "Phone",
  "Nationality",
  "Domain username",
  "Rank",
  "Biography"
]

describe("Show person page", () => {
  beforeEach("Should have print button", () => {
    Home.openAsAdminUser()
    Home.searchBar.setValue("Roger")
    Home.submitSearch.click()
    Search.foundPeopleTable.waitForExist({ timeout: 20000 })
    Search.foundPeopleTable.waitForDisplayed()
    Search.linkOfPersonFound("Roger").click()
    ShowPerson.compactViewButton.waitForExist()
    ShowPerson.compactViewButton.waitForDisplayed()
    ShowPerson.compactViewButton.click()
    ShowPerson.compactView.waitForExist()
    ShowPerson.compactView.waitForDisplayed()
  })
  describe("When on the print person page", () => {
    it("All fields can be selected using the optional fields dropdown", () => {
      ShowPerson.optionalFieldsButton.click()
      ShowPerson.selectAllButton.waitForDisplayed()
      ShowPerson.selectAllButton.click()
      ShowPerson.waitForCompactField(
        false,
        ...Object.values(SOME_FIELDS).map(field => field.fieldLabel)
      )
    })
    it("All fields can be cleared using the optional fields dropdown", () => {
      ShowPerson.optionalFieldsButton.click()
      ShowPerson.clearAllButton.waitForDisplayed()
      ShowPerson.clearAllButton.click()
      ShowPerson.waitForCompactField(
        true,
        ...Object.values(SOME_FIELDS).map(field => field.fieldLabel)
      )
    })
    it("Individual fields can be selected using optional fields dropdown", () => {
      ShowPerson.optionalFieldsButton.click()
      ShowPerson.clearAllButton.waitForDisplayed()
      ShowPerson.clearAllButton.click()
      ShowPerson.pickACompactField(SOME_FIELDS.currentPosition.id)
      ShowPerson.waitForCompactField(
        false,
        SOME_FIELDS.currentPosition.fieldLabel
      )
      ShowPerson.pickACompactField(SOME_FIELDS.birthday.id)
      ShowPerson.waitForCompactField(false, SOME_FIELDS.birthday.fieldLabel)
    })
    it("Default preset should select correct fields and display sensitive information warning", () => {
      ShowPerson.presetsButton.click()
      ShowPerson.defaultPreset.waitForDisplayed()
      ShowPerson.defaultPreset.click()
      ShowPerson.waitForCompactField(false, ...PRESET_DEFAULT_LABELS)
      ShowPerson.sensitiveInformationWarning.waitForDisplayed()
    })
    it("Exclude sensitive fields preset should select correct fields", () => {
      ShowPerson.presetsButton.click()
      ShowPerson.withoutSensitivePreset.waitForDisplayed()
      ShowPerson.withoutSensitivePreset.click()
      ShowPerson.waitForCompactField(false, ...PRESET_WITHOUT_SENSITIVE_LABELS)
      ShowPerson.sensitiveInformationWarning.waitForDisplayed({ reverse: true })
    })
    it("Should select the number of fields on the left", () => {
      ShowPerson.optionalFieldsButton.click()
      ShowPerson.selectAllButton.waitForDisplayed()
      ShowPerson.selectAllButton.click()
      ShowPerson.leftColumnNumber.setValue(4)
      // Left column contains 2 additional fields name and avatar
      expect(ShowPerson.leftTableFields.length).to.equal(6)
    })
    it("Should return to the show person page when detailed view button clicked", () => {
      ShowPerson.detailedViewButton.click()
      ShowPerson.compactViewButton.waitForExist()
      ShowPerson.compactViewButton.waitForDisplayed()
    })
  })
})
