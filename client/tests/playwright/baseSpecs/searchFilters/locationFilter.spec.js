import { test as base, expect } from "@playwright/test"
import LocationFilterPageObject from "../../pages/searchFilters/locationFilter.page.js"
import {
  getLocationInventory,
  isLocationInventoryResponse
} from "./locationInventory.js"

const test = base.extend({
  locationFilterSession: async ({ page }, runTest) => {
    const locationFilter = new LocationFilterPageObject(page)
    await locationFilter.open()
    // Start observing before opening the widget; never query a later DB snapshot.
    const [response] = await Promise.all([
      page.waitForResponse(isLocationInventoryResponse, { timeout: 10000 }),
      (async () => {
        await locationFilter.openLocationFilter()
        await locationFilter.openLocationPopover()
      })()
    ])
    expect(response.ok()).toBe(true)
    const payload = await response.json()
    expect(payload.errors).toBeUndefined()
    const locations = payload.data.locationList
    expect(locations.list).not.toHaveLength(0)
    expect(locations.list).toHaveLength(locations.totalCount)
    await runTest({
      filter: locationFilter,
      inventory: getLocationInventory(locations.list)
    })
  }
})

test.describe(() => {
  test.describe("When using the location filter on the reports search", () => {
    test("Should show all the locations", async ({
      locationFilterSession: { filter: LocationFilter, inventory }
    }) => {
      // Assert the complete returned hierarchy, not records left by other specs.
      await expect
        .poll(() => LocationFilter.getLocationRowPresentation(), {
          message: "Complete collapsed location hierarchy"
        })
        .toEqual(inventory.collapsed)
      await LocationFilter.openAllCollapsedLocations()
      await expect
        .poll(() => LocationFilter.getLocationRowPresentation(), {
          message: "Complete expanded location hierarchy"
        })
        .toEqual(inventory.expanded)
    })
    test("Should show only the filtered locations", async ({
      locationFilterSession: { filter: LocationFilter }
    }) => {
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
})
