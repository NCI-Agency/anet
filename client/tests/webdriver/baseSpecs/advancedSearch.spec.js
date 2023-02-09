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
    sampleFilter: "Location Type"
  },
  "Objective / Efforts": {
    sampleFilter: "Project status"
  }
}
const COMMON_FILTER_TEXT = "Status"
const ALL_COMMON_FILTERS = [COMMON_FILTER_TEXT, "Subscribed"]

const PERSON_DEFAULT_FILTER = "Pending Verification"
const PERSON_INDEX = 1

const ADD_FILTER_BUTTON_TEXT = "+ Add another filter"
describe("When using advanced search", () => {
  it("Should show a link like button with correct text under search bar that opens a popover", () => {
    Home.open()
    AdvancedSearch.getAdvancedSearchForm().waitForExist()
    AdvancedSearch.getAdvancedSearchForm().waitForDisplayed()
    AdvancedSearch.getAdvancedSearchPopoverTrigger().waitForExist()

    AdvancedSearch.getAdvancedSearchPopoverTrigger().waitForDisplayed()

    expect(AdvancedSearch.getAdvancedSearchPopoverTrigger().getText()).to.equal(
      "Everything filtered on Status: Active"
    )
  })
  it("Should open the popover when clicked to the text", () => {
    AdvancedSearch.getAdvancedSearchPopoverTrigger().click()
    AdvancedSearch.getAdvancedSearchPopover().waitForExist()
    AdvancedSearch.getAdvancedSearchPopover().waitForDisplayed()
  })
  it("Should show a list of anet object types on toggle buttons in the popover", () => {
    AdvancedSearch.getAnetObjectSearchToggleButtons().forEach((button, i) => {
      expect(button.getText()).to.equal(getObjectType(i))
    })
  })
  it("Should show the common filter even when no object type selected", () => {
    expect(AdvancedSearch.getCommonSearchFilter().getText()).to.equal(
      COMMON_FILTER_TEXT
    )
  })
  it("Should show the additional common filters when no object type selected", () => {
    expect(AdvancedSearch.getAddFilterButtonText().getText()).to.equal(
      ADD_FILTER_BUTTON_TEXT
    )
    AdvancedSearch.getAddFilterButton().click()
    AdvancedSearch.getAddFilterPopover().waitForExist()
    AdvancedSearch.getAddFilterPopover().waitForDisplayed()
    expect(AdvancedSearch.getAddFilterPopover().getText()).to.match(
      new RegExp(ALL_COMMON_FILTERS.join("\n"))
    )
    // Select all common filters now
    ALL_COMMON_FILTERS.forEach(filter => {
      if (AdvancedSearch.getSearchFilter(filter).isClickable()) {
        AdvancedSearch.getSearchFilter(filter).click()
      }
    })
  })
  it("Should show the common filter and default filters for each anet object type", () => {
    AdvancedSearch.getAnetObjectSearchToggleButtons().forEach((button, i) => {
      button.click()
      expect(AdvancedSearch.getCommonSearchFilter().isExisting()).to.equal(true)
      if (i === PERSON_INDEX) {
        AdvancedSearch.getPendingVerificationFilter().waitForExist()
        AdvancedSearch.getPendingVerificationFilter().waitForDisplayed()
        expect(
          AdvancedSearch.getPendingVerificationFilter().getText()
        ).to.equal(PERSON_DEFAULT_FILTER)
      }
    })
  })
  it("Should show add another filter button with correct text", () => {
    AdvancedSearch.getAnetObjectSearchToggleButtons().forEach((button, i) => {
      button.click()
      AdvancedSearch.getAddFilterButtonText().waitForExist()
      AdvancedSearch.getAddFilterButtonText().waitForDisplayed()
      expect(AdvancedSearch.getAddFilterButtonText().getText()).to.equal(
        ADD_FILTER_BUTTON_TEXT
      )
    })
  })

  it("Should show correct sample filters in the additional filters popover", () => {
    AdvancedSearch.getAnetObjectSearchToggleButtons().forEach((button, i) => {
      button.click()
      AdvancedSearch.getAddFilterButtonText().waitForExist()
      AdvancedSearch.getAddFilterButtonText().waitForDisplayed()
      AdvancedSearch.getAddFilterButton().click()
      AdvancedSearch.getAddFilterPopover().waitForExist()
      AdvancedSearch.getAddFilterPopover().waitForDisplayed()
      expect(AdvancedSearch.getAddFilterPopover().getText()).to.match(
        new RegExp(ANET_OBJECT_TYPES[getObjectType(i)].sampleFilter)
      )
    })
  })
})

function getObjectType(index) {
  return Object.keys(ANET_OBJECT_TYPES)[index]
}
