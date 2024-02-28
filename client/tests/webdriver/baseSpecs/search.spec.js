import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"

describe("When using search", () => {
  it("Should show results counter and table when searching in all entities and results found", async() => {
    await Home.openAsSuperuser()
    await (await Home.getSearchBar()).setValue("")
    await (await Home.getSubmitSearch()).click()
    // Reports
    expect(
      parseInt(
        await (
          await Search.getFoundElement(Search.getFoundCounter("reports"))
        ).getText()
      )
    ).to.be.greaterThan(0)
    await Search.getFoundElement(Search.getFoundReportTable())
    // People
    expect(
      parseInt(
        await (
          await Search.getFoundElement(Search.getFoundCounter("people"))
        ).getText()
      )
    ).to.be.greaterThan(0)
    await Search.getFoundElement(Search.getFoundPeopleTable())
    // Organizations
    expect(
      parseInt(
        await (
          await Search.getFoundElement(Search.getFoundCounter("organizations"))
        ).getText()
      )
    ).to.be.greaterThan(0)
    await Search.getFoundElement(Search.getFoundOrganizationTable())
    // Positions
    expect(
      parseInt(
        await (
          await Search.getFoundElement(Search.getFoundCounter("positions"))
        ).getText()
      )
    ).to.be.greaterThan(0)
    await Search.getFoundElement(Search.getFoundPositionTable())
    // Locations
    expect(
      parseInt(
        await (
          await Search.getFoundElement(Search.getFoundCounter("locations"))
        ).getText()
      )
    ).to.be.greaterThan(0)
    await Search.getFoundElement(Search.getFoundLocationTable())
    // Tasks
    expect(
      parseInt(
        await (
          await Search.getFoundElement(Search.getFoundCounter("tasks"))
        ).getText()
      )
    ).to.be.greaterThan(0)
    await Search.getFoundElement(Search.getFoundTaskTable())
    // Authorization groups
    expect(
      parseInt(
        await (await Search.getFoundCounter("authorizationGroups")).getText()
      )
    ).to.be.greaterThan(0)
    await Search.getFoundElement(Search.getFoundAuthorizationGroupTable())
  })
  it("Should not show results counters when searching in all entities and no results found", async() => {
    await Home.openAsSuperuser()
    await (await Home.getSearchBar()).setValue("·$%&")
    await (await Home.getSubmitSearch()).click()
    expect(await (await Search.getNoResultsFound()).isDisplayed()).to.equal(
      true
    )
    // Reports
    expect(
      await (await Search.getFoundCounter("reports")).isDisplayed()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("people")).isDisplayed()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("organizations")).isDisplayed()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("positions")).isDisplayed()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("locations")).isDisplayed()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("tasks")).isDisplayed()
    ).to.equal(false)
    expect(
      await (await Search.getFoundCounter("authorizationGroups")).isDisplayed()
    ).to.equal(false)
  })
})
