import { expect } from "@playwright/test"
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
    await expect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("reports")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await expect(await Search.getFoundReportTable()).not.toHaveCount(0)
    // People
    await expect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("people")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await expect(await Search.getFoundPeopleTable()).not.toHaveCount(0)
    // Organizations
    await expect
      .poll(async () =>
        parseInt(
          (
            await (await Search.getFoundCounter("organizations")).innerText()
          ).trim()
        )
      )
      .toBeGreaterThan(0)
    await expect(await Search.getFoundOrganizationTable()).not.toHaveCount(0)
    // Positions
    await expect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("positions")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await expect(await Search.getFoundPositionTable()).not.toHaveCount(0)
    // Locations
    await expect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("locations")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await expect(await Search.getFoundLocationTable()).not.toHaveCount(0)
    // Tasks
    await expect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("tasks")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await expect(await Search.getFoundTaskTable()).not.toHaveCount(0)
    // Communities
    await expect
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
    await expect(
      await Search.getFoundAuthorizationGroupTable()
    ).not.toHaveCount(0)
    // Events
    await expect
      .poll(async () =>
        parseInt(
          (await (await Search.getFoundCounter("events")).innerText()).trim()
        )
      )
      .toBeGreaterThan(0)
    await expect(await Search.getFoundEventTable()).not.toHaveCount(0)
    // EventSeries
    await expect
      .poll(async () =>
        parseInt(
          (
            await (await Search.getFoundCounter("eventSeries")).innerText()
          ).trim()
        )
      )
      .toBeGreaterThan(0)
    await expect(await Search.getFoundEventSeriesTable()).not.toHaveCount(0)
  })
  test("Should not show results counters when searching in all entities and no results found", async () => {
    await Home.openAsSuperuser()
    await (await Home.getSearchBar()).fill("·$%&")
    await (await Home.getSubmitSearch()).click()
    // Wait for search results

    await expect(await Search.getNoResultsFound()).toBeVisible()
    // Reports
    await expect(await Search.getFoundCounter("reports")).toHaveCount(0)
    await expect(await Search.getFoundCounter("people")).toHaveCount(0)
    await expect(await Search.getFoundCounter("organizations")).toHaveCount(0)
    await expect(await Search.getFoundCounter("positions")).toHaveCount(0)
    await expect(await Search.getFoundCounter("locations")).toHaveCount(0)
    await expect(await Search.getFoundCounter("tasks")).toHaveCount(0)
    await expect(
      await Search.getFoundCounter("authorizationGroups")
    ).toHaveCount(0)
    await expect(await Search.getFoundCounter("events")).toHaveCount(0)
    await expect(await Search.getFoundCounter("eventSeries")).toHaveCount(0)
  })
})
