import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"

describe("When using search", () => {
  it("Should show results counter and table when searching in all entities and results found", async() => {
    await Home.openAsSuperuser()
    await (await Home.getSearchBar()).setValue("")
    await (await Home.getSubmitSearch()).click()
    // Wait for search results
    await browser.pause(2000)
    // Reports
    expect(
      parseInt(await (await Search.getFoundCounter("reports")).getText())
    ).to.be.greaterThan(0)
    expect(await (await Search.getFoundReportTable()).isExisting()).to.equal(
      true
    )
    // People
    expect(
      parseInt(await (await Search.getFoundCounter("people")).getText())
    ).to.be.greaterThan(0)
    expect(await (await Search.getFoundPeopleTable()).isExisting()).to.equal(
      true
    )
    // Organizations
    expect(
      parseInt(await (await Search.getFoundCounter("organizations")).getText())
    ).to.be.greaterThan(0)
    expect(
      await (await Search.getFoundOrganizationTable()).isExisting()
    ).to.equal(true)
    // Positions
    expect(
      parseInt(await (await Search.getFoundCounter("positions")).getText())
    ).to.be.greaterThan(0)
    expect(await (await Search.getFoundPositionTable()).isExisting()).to.equal(
      true
    )
    // Locations
    expect(
      parseInt(await (await Search.getFoundCounter("locations")).getText())
    ).to.be.greaterThan(0)
    expect(await (await Search.getFoundLocationTable()).isExisting()).to.equal(
      true
    )
    // Tasks
    expect(
      parseInt(await (await Search.getFoundCounter("tasks")).getText())
    ).to.be.greaterThan(0)
    expect(await (await Search.getFoundTaskTable()).isExisting()).to.equal(true)
    // Communities
    expect(
      parseInt(
        await (await Search.getFoundCounter("authorizationGroups")).getText()
      )
    ).to.be.greaterThan(0)
    expect(
      await (await Search.getFoundAuthorizationGroupTable()).isExisting()
    ).to.equal(true)
    // Events
    expect(
      parseInt(await (await Search.getFoundCounter("events")).getText())
    ).to.be.greaterThan(0)
    expect(await (await Search.getFoundEventTable()).isExisting()).to.equal(
      true
    )
  })
  it("Should not show results counters when searching in all entities and no results found", async() => {
    await Home.openAsSuperuser()
    await (await Home.getSearchBar()).setValue("·$%&")
    await (await Home.getSubmitSearch()).click()
    // Wait for search results
    await browser.pause(2000)
    expect(await (await Search.getNoResultsFound()).isDisplayed()).to.equal(
      true
    )
    // Reports
    expect(
      await (await Search.getFoundCounter("reports")).isExisting()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("people")).isExisting()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("organizations")).isExisting()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("positions")).isExisting()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("locations")).isExisting()
    ).to.equal(false)
    expect(await (await Search.getFoundCounter("tasks")).isExisting()).to.equal(
      false
    )
    expect(
      await (await Search.getFoundCounter("authorizationGroups")).isExisting()
    ).to.equal(false)
  })
})
