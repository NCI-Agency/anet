import { expect } from "chai"
import LocationFilter from "../../pages/searchFilters/locationFilter.page"

describe("When using the location filter on the reports search", () => {
  it("Should show all the locations", async () => {
    await LocationFilter.open()
    await LocationFilter.openLocationFilter()

    // depending on the test run sequence, one more locations may have been created
    expect(await LocationFilter.getLocationCount()).to.be.within(260, 264)

    await LocationFilter.openAllCollapsedLocations()
    expect(await LocationFilter.getLocationCount()).to.be.within(292, 295)
  })

  it("Should show only the filtered locations", async () => {
    await LocationFilter.searchLocations("Mart")
    expect(await LocationFilter.getLocationCount()).to.equal(2)
    // the locations should already load expanded, so it should yield the same result
    await LocationFilter.openAllCollapsedLocations()
    expect(await LocationFilter.getLocationCount()).to.equal(4)
    await LocationFilter.closeLocationFilter()

    await LocationFilter.searchLocations("Afghanistan")
    expect(await LocationFilter.getLocationCount()).to.equal(1)
    // the only location should now expand, leading to a bigger location count
    await LocationFilter.openAllCollapsedLocations()
    expect(await LocationFilter.getLocationCount()).to.equal(19)
    await LocationFilter.closeLocationFilter()
  })
})
