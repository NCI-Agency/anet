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
      parseInt(await (await Search.getFoundCounter("reports")).getText())
    ).to.be.greaterThan(0)
    await (await Search.getFoundReportTable()).waitForExist({ timeout: 20000 })
    // People
    expect(
      parseInt(await (await Search.getFoundCounter("people")).getText())
    ).to.be.greaterThan(0)
    await (await Search.getFoundPeopleTable()).waitForExist({ timeout: 20000 })
    // Organizations
    expect(
      parseInt(await (await Search.getFoundCounter("organizations")).getText())
    ).to.be.greaterThan(0)
    await (
      await Search.getFoundOrganizationTable()
    ).waitForExist({ timeout: 20000 })
    // Positions
    expect(
      parseInt(await (await Search.getFoundCounter("positions")).getText())
    ).to.be.greaterThan(0)
    await (
      await Search.getFoundPositionTable()
    ).waitForExist({ timeout: 20000 })
    // Locations
    expect(
      parseInt(await (await Search.getFoundCounter("locations")).getText())
    ).to.be.greaterThan(0)
    await (
      await Search.getFoundLocationTable()
    ).waitForExist({ timeout: 20000 })
    // Tasks
    expect(
      parseInt(await (await Search.getFoundCounter("tasks")).getText())
    ).to.be.greaterThan(0)
    await (await Search.getFoundTaskTable()).waitForExist({ timeout: 20000 })
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
  })
})
