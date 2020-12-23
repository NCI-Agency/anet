import { expect } from "chai"
import AdvancedSearch from "../pages/advancedSearch"
import Home from "../pages/home.page"

const ANET_OBJECT_TYPES = {
  Reports: {
    sampleFilter: "Attendee"
  },
  People: {
    sampleFilter: "Role"
  },
  Organizations: {
    sampleFilter: "Organization Type"
  },
  Positions: {
    sampleFilter: "Position Type"
  },
  Locations: {
    sampleFilter: null
  },
  "Objective / Efforts": {
    sampleFilter: "Project status"
  }
}
const COMMON_FILTER_TEXT = "Status"

const PERSON_DEFAULT_FILTER = "Pending Verification"
const PERSON_INDEX = 1

const ADD_FILTER_BUTTON_TEXT = "+ Add another filter"

const NO_ADDITIONAL_FILTERS_TEXT = "No additional filters available"

describe("When using advanced search", () => {
  it("Should show a link like button with correct text under search bar that opens a popover", () => {
    Home.open()
    AdvancedSearch.advancedSearchForm.waitForExist()
    AdvancedSearch.advancedSearchForm.waitForDisplayed()
    console.log(AdvancedSearch.advancedSearchForm.getHTML())
    AdvancedSearch.advancedSearchPopoverTrigger.waitForExist()

    AdvancedSearch.advancedSearchPopoverTrigger.waitForDisplayed()

    expect(AdvancedSearch.advancedSearchPopoverTrigger.getText()).to.equal(
      "Everything filtered on Status: Active"
    )
  })
  it("Should open the popover when clicked to the text", () => {
    AdvancedSearch.advancedSearchPopoverTrigger.click()
    AdvancedSearch.advancedSearchPopover.waitForExist()
    AdvancedSearch.advancedSearchPopover.waitForDisplayed()
  })
  it("Should show a list of anet object types on toggle buttons in the popover", () => {
    AdvancedSearch.anetObjectSearchToggleButtons.forEach((button, i) => {
      expect(button.getText()).to.equal(getObjectType(i))
    })
  })
  it("Should show the common filter even when no object type selected", () => {
    expect(AdvancedSearch.commonSearchFilter.getText()).to.equal(
      COMMON_FILTER_TEXT
    )
  })
  it("Should show the common filter and default filters for each anet object type", () => {
    AdvancedSearch.anetObjectSearchToggleButtons.forEach((button, i) => {
      button.click()
      expect(AdvancedSearch.commonSearchFilter.isExisting()).to.equal(true)
      if (i === PERSON_INDEX) {
        AdvancedSearch.pendingVerificationFilter.waitForExist()
        AdvancedSearch.pendingVerificationFilter.waitForDisplayed()
        expect(AdvancedSearch.pendingVerificationFilter.getText()).to.equal(
          PERSON_DEFAULT_FILTER
        )
      }
    })
  })
  it("Should show add another filter button with correct text", () => {
    AdvancedSearch.anetObjectSearchToggleButtons.forEach((button, i) => {
      button.click()
      AdvancedSearch.addFilterButtonText.waitForExist()
      AdvancedSearch.addFilterButtonText.waitForDisplayed()

      // Types other than Locations have additional filters
      if (getObjectType(i) !== "Locations") {
        expect(AdvancedSearch.addFilterButtonText.getText()).to.equal(
          ADD_FILTER_BUTTON_TEXT
        )
      } else {
        expect(AdvancedSearch.addFilterButtonText.getText()).to.equal(
          NO_ADDITIONAL_FILTERS_TEXT
        )
      }
    })
  })

  it("Should show correct sample filters in the additional filters popover", () => {
    AdvancedSearch.anetObjectSearchToggleButtons.forEach((button, i) => {
      button.click()
      AdvancedSearch.addFilterButtonText.waitForExist()
      AdvancedSearch.addFilterButtonText.waitForDisplayed()
      // If there is no additional filters for an object, it should display something different
      // And we shouldn't try to open additional filters popover
      // Types other than Locations have additional filters
      if (getObjectType(i) !== "Locations") {
        AdvancedSearch.addFilterButton.click()
        AdvancedSearch.addFilterPopover.waitForExist()
        AdvancedSearch.addFilterPopover.waitForDisplayed()
        expect(AdvancedSearch.addFilterPopover.getText()).to.match(
          new RegExp(ANET_OBJECT_TYPES[getObjectType(i)].sampleFilter)
        )
      }
    })
  })
})

function getObjectType(index) {
  return Object.keys(ANET_OBJECT_TYPES)[index]
}
