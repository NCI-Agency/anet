import { expect } from "chai"
import AdvancedSearch from "../pages/advancedSearch"
import Home from "../pages/home.page"

const ANET_OBJECT_TYPES = {
  Reports: {
    sampleFilter: "Author"
  },
  People: {
    sampleFilter: "Organization"
  },
  Organizations: {
    sampleFilter: "Type"
  },
  Positions: {
    sampleFilter: "Type"
  },
  Locations: {
    sampleFilter: "Type"
  },
  "Objective / Efforts": {
    sampleFilter: "Organization"
  }
}
const COMMON_FILTER_TEXT = "Status"
const ALL_COMMON_FILTERS = [COMMON_FILTER_TEXT, "Subscribed"]

const PERSON_DEFAULT_FILTER = "Pending Verification"
const PERSON_INDEX = 1

const ADD_FILTER_BUTTON_TEXT = "+ Add another filter"
describe("When using advanced search", () => {
  it("Should show a link like button with correct text under search bar that opens a popover", async() => {
    await Home.open()
    await (await AdvancedSearch.getAdvancedSearchForm()).waitForExist()
    await (await AdvancedSearch.getAdvancedSearchForm()).waitForDisplayed()
    await (
      await AdvancedSearch.getAdvancedSearchPopoverTrigger()
    ).waitForExist()

    await (
      await AdvancedSearch.getAdvancedSearchPopoverTrigger()
    ).waitForDisplayed()

    expect(
      await (await AdvancedSearch.getAdvancedSearchPopoverTrigger()).getText()
    ).to.equal("Everything filtered on Status: Active")
  })
  it("Should open the popover when clicked to the text", async() => {
    await (await AdvancedSearch.getAdvancedSearchPopoverTrigger()).click()
    await (await AdvancedSearch.getAdvancedSearchPopover()).waitForExist()
    await (await AdvancedSearch.getAdvancedSearchPopover()).waitForDisplayed()
  })
  it("Should show a list of anet object types on toggle buttons in the popover", async() => {
    const buttons = await AdvancedSearch.getAnetObjectSearchToggleButtons()
    for (const [i, button] of buttons.entries()) {
      expect(await button.getText()).to.equal(await getObjectType(i))
    }
  })
  it("Should show the common filter even when no object type selected", async() => {
    expect(
      await (await AdvancedSearch.getCommonSearchFilter()).getText()
    ).to.equal(COMMON_FILTER_TEXT)
  })
  it("Should show the additional common filters when no object type selected", async() => {
    expect(
      await (await AdvancedSearch.getAddFilterButtonText()).getText()
    ).to.equal(ADD_FILTER_BUTTON_TEXT)
    await (await AdvancedSearch.getAddFilterButton()).click()
    await (await AdvancedSearch.getAddFilterPopover()).waitForExist()
    await (await AdvancedSearch.getAddFilterPopover()).waitForDisplayed()
    expect(
      await (await AdvancedSearch.getAddFilterPopover()).getText()
    ).to.match(new RegExp(ALL_COMMON_FILTERS.join("\n")))
    // Select all common filters now
    for (const filter of ALL_COMMON_FILTERS) {
      if (await (await AdvancedSearch.getSearchFilter(filter)).isClickable()) {
        await (await AdvancedSearch.getSearchFilter(filter)).click()
      }
    }
  })
  it("Should show the common filter and default filters for each anet object type", async() => {
    const buttons = await AdvancedSearch.getAnetObjectSearchToggleButtons()
    for (const [i, button] of buttons.entries()) {
      await button.click()
      expect(
        await (await AdvancedSearch.getCommonSearchFilter()).isExisting()
      ).to.equal(true)
      if (i === PERSON_INDEX) {
        await (
          await AdvancedSearch.getPendingVerificationFilter()
        ).waitForExist()
        await (
          await AdvancedSearch.getPendingVerificationFilter()
        ).waitForDisplayed()
        expect(
          await (await AdvancedSearch.getPendingVerificationFilter()).getText()
        ).to.equal(PERSON_DEFAULT_FILTER)
      }
    }
  })
  it("Should show add another filter button with correct text", async() => {
    const buttons = await AdvancedSearch.getAnetObjectSearchToggleButtons()
    for (const [, button] of buttons.entries()) {
      await button.click()
      await (await AdvancedSearch.getAddFilterButtonText()).waitForExist()
      await (await AdvancedSearch.getAddFilterButtonText()).waitForDisplayed()
      expect(
        await (await AdvancedSearch.getAddFilterButtonText()).getText()
      ).to.equal(ADD_FILTER_BUTTON_TEXT)
    }
  })

  it("Should show correct sample filters in the additional filters popover", async() => {
    const buttons = await AdvancedSearch.getAnetObjectSearchToggleButtons()
    for (const [i, button] of buttons.entries()) {
      await button.click()
      await (await AdvancedSearch.getAddFilterButtonText()).waitForExist()
      await (await AdvancedSearch.getAddFilterButtonText()).waitForDisplayed()
      await (await AdvancedSearch.getAddFilterButton()).click()
      await (await AdvancedSearch.getAddFilterPopover()).waitForExist()
      await (await AdvancedSearch.getAddFilterPopover()).waitForDisplayed()
      expect(
        await (await AdvancedSearch.getAddFilterPopover()).getText()
      ).to.match(
        new RegExp(ANET_OBJECT_TYPES[await getObjectType(i)].sampleFilter)
      )
    }
  })
})

async function getObjectType(index) {
  return Object.keys(ANET_OBJECT_TYPES)[index]
}
