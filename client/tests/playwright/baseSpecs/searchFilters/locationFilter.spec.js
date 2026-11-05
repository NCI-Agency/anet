import { expect, test } from "@playwright/test"
import LocationFilterPageObject from "../../pages/searchFilters/locationFilter.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, LocationFilter
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    LocationFilter = new LocationFilterPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
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
})
