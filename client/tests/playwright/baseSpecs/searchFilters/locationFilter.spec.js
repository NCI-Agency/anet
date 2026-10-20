import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import LocationFilter from "../../pages/searchFilters/locationFilter.page.js"
import { test } from "../../support.js"

test.describe("When using the location filter on the reports search", () => {
  test("Should show all the locations", async () => {
    await LocationFilter.open()
    await LocationFilter.openLocationFilter()

    // depending on the test run sequence, one more locations may have been created
    expect(await LocationFilter.getLocationCount()).to.be.within(
      256,
      260,
      "Number of locations, searching for any location"
    )
    await LocationFilter.openAllCollapsedLocations()
    expect(await LocationFilter.getLocationCount()).to.be.within(
      288,
      291,
      "Number of uncollapsed locations, searching for any location"
    )
  })
  test("Should show only the filtered locations", async () => {
    await LocationFilter.searchLocations("Mart")
    await pwExpect
      .poll(async () => await LocationFilter.getLocationCount())
      .toEqual(2)
    // the locations should already load expanded, so it should yield the same result
    await LocationFilter.openAllCollapsedLocations()
    await pwExpect
      .poll(async () => await LocationFilter.getLocationCount())
      .toEqual(4)
    await LocationFilter.closeLocationFilter()
    await LocationFilter.searchLocations("Afghanistan")
    await pwExpect
      .poll(async () => await LocationFilter.getLocationCount())
      .toEqual(1)
    // the only location should now expand, leading to a bigger location count
    await LocationFilter.openAllCollapsedLocations()
    await pwExpect
      .poll(async () => await LocationFilter.getLocationCount())
      .toEqual(19)
    await LocationFilter.closeLocationFilter()
  })
})
