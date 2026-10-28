import { expect } from "@playwright/test"
import _isEmpty from "lodash/isEmpty.js"
import AdvancedSearch from "../pages/advancedSearch.page.js"
import Home from "../pages/home.page.js"
import { isClickable, mapSequential, test, waitFor } from "../support.js"

const ANET_OBJECT_TYPES = {
  Reports: {
    sampleFilters: ["Author"]
  },
  People: {
    sampleFilters: ["Within Organization", "Holding Position As"]
  },
  Organizations: {
    sampleFilters: ["Within Organization"]
  },
  Positions: {
    sampleFilters: ["Type"]
  },
  Locations: {
    sampleFilters: ["Type"]
  },
  Objectives: {
    sampleFilters: ["Within Organization"]
  },
  Communities: {
    sampleFilters: []
  },
  Attachments: {
    sampleFilters: ["MIME Type"]
  },
  Events: {
    sampleFilters: ["Type"]
  },
  EventSeries: {
    sampleFilters: []
  }
}
const COMMON_FILTER_TEXT = "Status"
const ALL_COMMON_FILTERS = [COMMON_FILTER_TEXT, "Subscribed", "With Email"]
const PERSON_DEFAULT_FILTER = "Pending Verification"
const PERSON_INDEX = 1
const ADD_FILTER_BUTTON_TEXT = "+ Add another filter"
test.describe("When using advanced search", () => {
  test("Should show a link like button with correct text under search bar that opens a popover", async () => {
    await Home.open()
    await waitFor(await AdvancedSearch.getAdvancedSearchForm(), "visible")
    await waitFor(
      await AdvancedSearch.getAdvancedSearchPopoverTrigger(),
      "visible"
    )
    await expect(
      await AdvancedSearch.getAdvancedSearchPopoverTrigger()
    ).toHaveText("Everything filtered on Status: Active", {
      useInnerText: true
    })
  })
  test("Should open the popover when clicked to the text", async () => {
    await (await AdvancedSearch.getAdvancedSearchPopoverTrigger()).click()
    await waitFor(await AdvancedSearch.getAdvancedSearchPopover(), "visible")
  })
  test("Should show a list of anet object types on toggle buttons in the popover", async () => {
    const buttons = await AdvancedSearch.getAnetObjectSearchToggleButtons()
    await mapSequential(buttons, async (button, i) => {
      const expectedText = (await getObjectType(i)).replace(
        "EventSeries",
        "Event Series"
      )
      await expect(button).toHaveText(expectedText, {
        useInnerText: true
      })
    })
  })
  test("Should show the common filter even when no object type selected", async () => {
    await expect(await AdvancedSearch.getCommonSearchFilter()).toHaveText(
      COMMON_FILTER_TEXT,
      {
        useInnerText: true
      }
    )
  })
  test("Should show the additional common filters when no object type selected", async () => {
    await expect(await AdvancedSearch.getAddFilterButtonText()).toHaveText(
      ADD_FILTER_BUTTON_TEXT,
      {
        useInnerText: true
      }
    )
    await (await AdvancedSearch.getAddFilterButton()).click()
    await waitFor(await AdvancedSearch.getAddFilterPopover(), "visible")
    await expect(await AdvancedSearch.getAddFilterPopover()).toContainText(
      new RegExp(ALL_COMMON_FILTERS.join("\n")),
      {
        useInnerText: true
      }
    )
    // Select all common filters now
    for (const filter of ALL_COMMON_FILTERS) {
      if (await isClickable(await AdvancedSearch.getSearchFilter(filter))) {
        await (await AdvancedSearch.getSearchFilter(filter)).click()
      }
    }
  })
  test("Should show the common filter and default filters for each anet object type", async () => {
    const buttons = await AdvancedSearch.getAnetObjectSearchToggleButtons()
    await mapSequential(buttons, async (button, i) => {
      await button.click()
      await expect(
        await AdvancedSearch.getCommonSearchFilter()
      ).not.toHaveCount(0)
      if (i === PERSON_INDEX) {
        await waitFor(
          await AdvancedSearch.getPendingVerificationFilter(),
          "visible"
        )
        await expect(
          await AdvancedSearch.getPendingVerificationFilter()
        ).toHaveText(PERSON_DEFAULT_FILTER, {
          useInnerText: true
        })
      }
    })
  })
  test("Should show add another filter button with correct text", async () => {
    const buttons = await AdvancedSearch.getAnetObjectSearchToggleButtons()
    await mapSequential(buttons, async (button, i) => {
      await button.click()
      const sampleFilters =
        ANET_OBJECT_TYPES[await getObjectType(i)].sampleFilters
      if (!_isEmpty(sampleFilters)) {
        await waitFor(await AdvancedSearch.getAddFilterButtonText(), "visible")
        await expect(await AdvancedSearch.getAddFilterButtonText()).toHaveText(
          ADD_FILTER_BUTTON_TEXT,
          {
            useInnerText: true
          }
        )
      }
    })
  })
  test("Should show correct sample filters in the additional filters popover", async () => {
    const buttons = await AdvancedSearch.getAnetObjectSearchToggleButtons()
    await mapSequential(buttons, async (button, i) => {
      await button.click()
      const sampleFilters =
        ANET_OBJECT_TYPES[await getObjectType(i)].sampleFilters
      if (!_isEmpty(sampleFilters)) {
        for (const sampleFilter of sampleFilters) {
          await (await AdvancedSearch.getAddFilterButton()).click()
          await waitFor(await AdvancedSearch.getAddFilterPopover(), "visible")
          await expect(
            await AdvancedSearch.getAddFilterPopover()
          ).toContainText(new RegExp(sampleFilter), {
            useInnerText: true
          })
          await (await AdvancedSearch.getSearchFilter(sampleFilter)).click()
        }
      }
    })
  })
})
async function getObjectType(index) {
  return Object.keys(ANET_OBJECT_TYPES)[index]
}
