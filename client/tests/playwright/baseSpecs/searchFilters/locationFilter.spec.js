import { expect } from "@playwright/test"
import LocationFilter from "../../pages/searchFilters/locationFilter.page.js"
import { test } from "../../support.js"

test.describe("When using the location filter on the reports search", () => {
  test("Should show all the locations", async () => {
    await LocationFilter.open()
    await LocationFilter.openLocationFilter()
    await LocationFilter.openLocationPopover()

    // depending on the test run sequence, one more locations may have been created
    await expect
      .poll(async () => (await LocationFilter.getLocationRows()).count(), {
        message: "Number of locations, searching for any location"
      })
      .toBeGreaterThanOrEqual(256)
    await expect
      .poll(async () => (await LocationFilter.getLocationRows()).count(), {
        message: "Number of locations, searching for any location"
      })
      .toBeLessThanOrEqual(260)
    await LocationFilter.openAllCollapsedLocations()
    await expect
      .poll(async () => (await LocationFilter.getLocationRows()).count(), {
        message: "Number of uncollapsed locations, searching for any location"
      })
      .toBeGreaterThanOrEqual(288)
    await expect
      .poll(async () => (await LocationFilter.getLocationRows()).count(), {
        message: "Number of uncollapsed locations, searching for any location"
      })
      .toBeLessThanOrEqual(291)
  })
  test("Should show only the filtered locations", async () => {
    await LocationFilter.searchLocations("Mart")
    await expect(await LocationFilter.getLocationRows()).toHaveCount(2)
    // the locations should already load expanded, so it should yield the same result
    await LocationFilter.openAllCollapsedLocations()
    await expect(await LocationFilter.getLocationRows()).toHaveCount(4)
    await LocationFilter.closeLocationFilter()
    await LocationFilter.searchLocations("Afghanistan")
    await expect(await LocationFilter.getLocationRows()).toHaveCount(1)
    // the only location should now expand, leading to a bigger location count
    await LocationFilter.openAllCollapsedLocations()
    await expect(await LocationFilter.getLocationRows()).toHaveCount(19)
    await LocationFilter.closeLocationFilter()
  })
})
