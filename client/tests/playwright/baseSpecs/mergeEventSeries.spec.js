import { expect } from "@playwright/test"
import MergeEventSeries from "../pages/mergeEventSeries.page.js"
import { currentPage, test, waitFor } from "../support.js"

const EXAMPLE_EVENT_SERIES = {
  validLeft: {
    search: "Merged Duplicated Winner",
    uuid: "19a98fee-4864-4b04-a983-b837aadbfe8c",
    name: "Merged Duplicated Winner",
    status: "ACTIVE"
  },
  validRight: {
    search: "Merged Duplicated Loser",
    uuid: "071ce130-78fa-4c81-951f-9175b677c7b1",
    name: "Merged Duplicated Loser",
    description: "Loser test event series that will be merged",
    status: "ACTIVE"
  },
  result: {
    uuid: "19a98fee-4864-4b04-a983-b837aadbfe8c",
    name: "Merged Duplicated Winner",
    description: "Loser test event series that will be merged",
    ownerOrganization: "EF 2.2",
    adminOrganization: "EF 2.2",
    hosts: ["EF 2.1", "EF 2.2"]
  }
}
test.describe("Merge event series page", () => {
  test("Should display a warning when leaving the page with unsaved changes", async () => {
    await MergeEventSeries.openPage()
    await waitFor(await MergeEventSeries.getTitle(), "visible")
    await (await MergeEventSeries.getLeftEventSeriesField()).click()
    await (
      await MergeEventSeries.getLeftEventSeriesField()
    ).fill(String(EXAMPLE_EVENT_SERIES.validLeft.search))
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    // attempt to leave when only one event series is selected, should allow to leave
    await MergeEventSeries.clickLogo()
    await expect(await MergeEventSeries.getModalDialog()).toHaveCount(0)
    await MergeEventSeries.openPage()
    await waitFor(await MergeEventSeries.getTitle(), "visible")
    await (await MergeEventSeries.getLeftEventSeriesField()).click()
    await (
      await MergeEventSeries.getLeftEventSeriesField()
    ).fill(String(EXAMPLE_EVENT_SERIES.validLeft.search))
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    await (await MergeEventSeries.getRightEventSeriesField()).click()
    await (
      await MergeEventSeries.getRightEventSeriesField()
    ).fill(String(EXAMPLE_EVENT_SERIES.validRight.search))
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validRight.name
    )
    // attempt to leave when both event series are selected, should show warning
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    await MergeEventSeries.clickLogo()
    await expect(await MergeEventSeries.getModalDialog()).not.toHaveCount(0)
    await currentPage().locator(".btn-danger").first().click()
  })
  test("Should display field values of the left event series", async () => {
    await MergeEventSeries.openPage()
    await waitFor(await MergeEventSeries.getTitle(), "visible")
    await (await MergeEventSeries.getLeftEventSeriesField()).click()
    await (
      await MergeEventSeries.getLeftEventSeriesField()
    ).fill(String(EXAMPLE_EVENT_SERIES.validLeft.search))
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from left side.
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validLeft.uuid,
      "left",
      "UUID"
    )
    await expect(
      await MergeEventSeries.getColumnContent("left", "UUID")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validLeft.uuid, {
      useInnerText: true
    })
    await expect(
      await MergeEventSeries.getColumnContent("left", "Name")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validLeft.name, {
      useInnerText: true
    })
  })
  test("Should not allow to select the same event series", async () => {
    await (
      await MergeEventSeries.getRightEventSeriesField()
    ).fill(String(EXAMPLE_EVENT_SERIES.validLeft.search))
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    await expect(
      await MergeEventSeries.getItemRadioButtonFromAdvancedSelect()
    ).toHaveCount(0)
  })
  test("Should display field values of the right event series", async () => {
    await (await MergeEventSeries.getRightEventSeriesField()).click()
    await (
      await MergeEventSeries.getRightEventSeriesField()
    ).fill(String(EXAMPLE_EVENT_SERIES.validRight.search))
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validRight.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from right side.
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validRight.uuid,
      "right",
      "UUID"
    )
    await expect(
      await MergeEventSeries.getColumnContent("right", "UUID")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validRight.uuid, {
      useInnerText: true
    })
    await expect(
      await MergeEventSeries.getColumnContent("right", "Name")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validRight.name, {
      useInnerText: true
    })
  })
  test("Should autoMerge some identical fields from both event series", async () => {
    await expect(
      await MergeEventSeries.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validLeft.status, {
      useInnerText: true
    })
    await expect(
      await MergeEventSeries.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validRight.status, {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from left event series", async () => {
    await (await MergeEventSeries.getUseAllButton("left")).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from left side.
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validLeft.uuid,
      "mid",
      "UUID"
    )
    await expect(
      await MergeEventSeries.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validLeft.uuid, {
      useInnerText: true
    })
    await expect(
      await MergeEventSeries.getColumnContent("mid", "Name")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validLeft.name, {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from right event series", async () => {
    await (await MergeEventSeries.getUseAllButton("right")).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from right side.
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validRight.uuid,
      "mid",
      "UUID"
    )
    await expect(
      await MergeEventSeries.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validRight.uuid, {
      useInnerText: true
    })
    await expect(
      await MergeEventSeries.getColumnContent("mid", "Name")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validRight.name, {
      useInnerText: true
    })
  })
  test("Should be able to select from both left and right side", async () => {
    await (await MergeEventSeries.getSelectButton("left", "UUID")).click()
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validLeft.uuid,
      "mid",
      "UUID"
    )
    await expect(
      await MergeEventSeries.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validLeft.uuid, {
      useInnerText: true
    })
    await (await MergeEventSeries.getSelectButton("left", "Name")).click()
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validLeft.name,
      "mid",
      "Name"
    )
    await expect(
      await MergeEventSeries.getColumnContent("mid", "Name")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validLeft.name, {
      useInnerText: true
    })
    await (
      await MergeEventSeries.getSelectButton("right", "Description")
    ).click()
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validRight.description,
      "mid",
      "Description"
    )
    await expect(
      await MergeEventSeries.getColumnContent("mid", "Description")
    ).toHaveText(EXAMPLE_EVENT_SERIES.validRight.description, {
      useInnerText: true
    })
  })
  test("Should be able to merge both event series when winner is left event series but right event series description is selected", async () => {
    await (await MergeEventSeries.getUseAllButton("left")).click()
    await (
      await MergeEventSeries.getSelectButton("right", "Description")
    ).click()
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validRight.description,
      "mid",
      "Description"
    )
    await (await MergeEventSeries.getMergeEventSeriesButton()).click()
    await MergeEventSeries.waitForSuccessAlert()
  })
  test("Should have correctly set the name of the left event series", async () => {
    await waitFor(await MergeEventSeries.getName(), "visible")
    await expect(await MergeEventSeries.getName()).toHaveText(
      EXAMPLE_EVENT_SERIES.result.name,
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the description of the right event series", async () => {
    await waitFor(await MergeEventSeries.getDescription(), "visible")
    await expect(await MergeEventSeries.getDescription()).toHaveText(
      EXAMPLE_EVENT_SERIES.result.description,
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the owner organization of the left event series", async () => {
    await waitFor(await MergeEventSeries.getOwnerOrganization(), "visible")
    await expect(await MergeEventSeries.getOwnerOrganization()).toHaveText(
      EXAMPLE_EVENT_SERIES.result.ownerOrganization,
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the admin organization of the left event series", async () => {
    await waitFor(await MergeEventSeries.getAdminOrganization(), "visible")
    await expect(await MergeEventSeries.getAdminOrganization()).toHaveText(
      EXAMPLE_EVENT_SERIES.result.adminOrganization,
      {
        useInnerText: true
      }
    )
  })
  test("Should have correctly set the hosts of the left event series", async () => {
    expect(new Set(await MergeEventSeries.getHostNames())).toEqual(
      new Set(EXAMPLE_EVENT_SERIES.result.hosts)
    )
  })
})
