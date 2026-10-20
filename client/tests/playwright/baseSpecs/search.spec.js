import { expect as pwExpect } from "@playwright/test"
import Home from "../pages/home.page.js"
import Search from "../pages/search.page.js"
import { test } from "../support.js"

test.describe("When using search", () => {
  test("Should show results counter and table when searching in all entities and results found", async () => {
    await Home.openAsSuperuser()
    await (await Home.getSearchBar()).fill("")
    await (await Home.getSubmitSearch()).click()
    // Wait for search results

    // Reports
    await pwExpect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("reports")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(await Search.getFoundReportTable()).not.toHaveCount(0)
    // People
    await pwExpect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("people")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(await Search.getFoundPeopleTable()).not.toHaveCount(0)
    // Organizations
    await pwExpect
      .poll(async () =>
        parseInt(
          (
            await (await Search.getFoundCounter("organizations")).innerText()
          ).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(await Search.getFoundOrganizationTable()).not.toHaveCount(0)
    // Positions
    await pwExpect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("positions")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(await Search.getFoundPositionTable()).not.toHaveCount(0)
    // Locations
    await pwExpect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("locations")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(await Search.getFoundLocationTable()).not.toHaveCount(0)
    // Tasks
    await pwExpect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("tasks")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(await Search.getFoundTaskTable()).not.toHaveCount(0)
    // Communities
    await pwExpect
      .poll(async () =>
        parseInt(
          (
            await (
              await Search.getFoundCounter("authorizationGroups")
            ).innerText()
          ).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(
      await Search.getFoundAuthorizationGroupTable()
    ).not.toHaveCount(0)
    // Events
    await pwExpect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("events")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(await Search.getFoundEventTable()).not.toHaveCount(0)
    // EventSeries
    await pwExpect
      .poll(async () =>
        parseInt(
          (
            await (await Search.getFoundCounter("eventSeries")).innerText()
          ).trim()
        )
      )
      .toBeGreaterThan(0)
    await pwExpect(await Search.getFoundEventSeriesTable()).not.toHaveCount(0)
  })
  test("Should not show results counters when searching in all entities and no results found", async () => {
    await Home.openAsSuperuser()
    await (await Home.getSearchBar()).fill("·$%&")
    await (await Home.getSubmitSearch()).click()
    // Wait for search results

    await pwExpect(await Search.getNoResultsFound()).toBeVisible()
    // Reports
    await pwExpect(await Search.getFoundCounter("reports")).toHaveCount(0)
    await pwExpect(await Search.getFoundCounter("people")).toHaveCount(0)
    await pwExpect(await Search.getFoundCounter("organizations")).toHaveCount(0)
    await pwExpect(await Search.getFoundCounter("positions")).toHaveCount(0)
    await pwExpect(await Search.getFoundCounter("locations")).toHaveCount(0)
    await pwExpect(await Search.getFoundCounter("tasks")).toHaveCount(0)
    await pwExpect(
      await Search.getFoundCounter("authorizationGroups")
    ).toHaveCount(0)
    await pwExpect(await Search.getFoundCounter("events")).toHaveCount(0)
    await pwExpect(await Search.getFoundCounter("eventSeries")).toHaveCount(0)
  })
})
