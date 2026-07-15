import { expect } from "chai"
import MergeEventSeries from "../pages/mergeEventSeries.page"

const EXAMPLE_EVENT_SERIES = {
  validLeft: {
    search: "Merged Duplicated Winner",
    name: "Merged Duplicated Winner",
    status: "ACTIVE"
  },
  validRight: {
    search: "Merged Duplicated Loser",
    name: "Merged Duplicated Loser",
    description: "Loser test event series that will be merged",
    status: "ACTIVE"
  },
  result: {
    name: "Merged Duplicated Winner",
    description: "Loser test event series that will be merged",
    ownerOrganization: "EF 2.2",
    adminOrganization: "EF 2.2",
    hosts: ["EF 2.1", "EF 2.2"]
  }
}

describe("Merge event series page", () => {
  it("Should display a warning when leaving the page with unsaved changes", async () => {
    await MergeEventSeries.openPage()
    await (await MergeEventSeries.getTitle()).waitForExist()
    await (await MergeEventSeries.getTitle()).waitForDisplayed()
    await (await MergeEventSeries.getLeftEventSeriesField()).click()
    await (
      await MergeEventSeries.getLeftEventSeriesField()
    ).setValue(EXAMPLE_EVENT_SERIES.validLeft.search)
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    // attempt to leave when only one event series is selected, should allow to leave
    await MergeEventSeries.clickLogo()
    // eslint-disable-next-line no-unused-expressions
    expect(await (await MergeEventSeries.getModalDialog()).isExisting()).to.be
      .false

    await MergeEventSeries.openPage()
    await (await MergeEventSeries.getTitle()).waitForExist()
    await (await MergeEventSeries.getTitle()).waitForDisplayed()
    await (await MergeEventSeries.getLeftEventSeriesField()).click()
    await (
      await MergeEventSeries.getLeftEventSeriesField()
    ).setValue(EXAMPLE_EVENT_SERIES.validLeft.search)
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    await (await MergeEventSeries.getRightEventSeriesField()).click()
    await (
      await MergeEventSeries.getRightEventSeriesField()
    ).setValue(EXAMPLE_EVENT_SERIES.validRight.search)
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validRight.name
    )
    // attempt to leave when both event series are selected, should show warning
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    await MergeEventSeries.clickLogo()
    // eslint-disable-next-line no-unused-expressions
    expect(await (await MergeEventSeries.getModalDialog()).isExisting()).to.be
      .true
    await $(".btn-danger").click()
  })
  it("Should display field values of the left event series", async () => {
    await MergeEventSeries.openPage()
    await (await MergeEventSeries.getTitle()).waitForExist()
    await (await MergeEventSeries.getTitle()).waitForDisplayed()

    await (await MergeEventSeries.getLeftEventSeriesField()).click()
    await (
      await MergeEventSeries.getLeftEventSeriesField()
    ).setValue(EXAMPLE_EVENT_SERIES.validLeft.search)
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validLeft.name,
      "left",
      "Name"
    )
    expect(
      await (await MergeEventSeries.getColumnContent("left", "Name")).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.validLeft.name)
  })

  it("Should not allow to select the same event series", async () => {
    await (
      await MergeEventSeries.getRightEventSeriesField()
    ).setValue(EXAMPLE_EVENT_SERIES.validLeft.search)
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    // eslint-disable-next-line no-unused-expressions
    expect(
      await (
        await MergeEventSeries.getItemRadioButtonFromAdvancedSelect()
      ).isExisting()
    ).to.be.false
  })

  it("Should display field values of the right event series", async () => {
    await (await MergeEventSeries.getRightEventSeriesField()).click()
    await (
      await MergeEventSeries.getRightEventSeriesField()
    ).setValue(EXAMPLE_EVENT_SERIES.validRight.search)
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validRight.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validRight.name,
      "right",
      "Name"
    )
    expect(
      await (await MergeEventSeries.getColumnContent("right", "Name")).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.validRight.name)
  })

  it("Should autoMerge some identical fields from both event series", async () => {
    expect(
      await (await MergeEventSeries.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.validLeft.status)
    expect(
      await (await MergeEventSeries.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.validRight.status)
  })

  it("Should be able to select all fields from left event series", async () => {
    await (await MergeEventSeries.getUseAllButton("left")).click()
    await browser.pause(500)

    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validLeft.name,
      "mid",
      "Name"
    )
    expect(
      await (await MergeEventSeries.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.validLeft.name)
  })

  it("Should be able to select all fields from right event series", async () => {
    await (await MergeEventSeries.getUseAllButton("right")).click()
    await browser.pause(500)

    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validRight.name,
      "mid",
      "Name"
    )
    expect(
      await (await MergeEventSeries.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.validRight.name)
  })

  it("Should be able to select from both left and right side", async () => {
    await (await MergeEventSeries.getLeftEventSeriesField()).click()
    await (
      await MergeEventSeries.getLeftEventSeriesField()
    ).setValue(EXAMPLE_EVENT_SERIES.validLeft.search)
    await MergeEventSeries.waitForAdvancedSelectLoading(
      EXAMPLE_EVENT_SERIES.validLeft.name
    )
    await (await MergeEventSeries.getItemFromAdvancedSelect()).click()
    await browser.pause(500)

    await (await MergeEventSeries.getSelectButton("left", "Name")).click()
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validLeft.name,
      "mid",
      "Name"
    )
    expect(
      await (await MergeEventSeries.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.validLeft.name)

    await (
      await MergeEventSeries.getSelectButton("right", "Description")
    ).click()
    await MergeEventSeries.waitForColumnToChange(
      EXAMPLE_EVENT_SERIES.validRight.description,
      "mid",
      "Description"
    )
    expect(
      await (
        await MergeEventSeries.getColumnContent("mid", "Description")
      ).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.validRight.description)
  })

  it("Should be able to merge both event series when winner is left event series but right event series description is selected", async () => {
    await (await MergeEventSeries.getUseAllButton("left")).click()
    await browser.pause(500)
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

  it("Should have correctly set the name of the left event series", async () => {
    await (await MergeEventSeries.getName()).waitForExist()
    await (await MergeEventSeries.getName()).waitForDisplayed()
    expect(await (await MergeEventSeries.getName()).getText()).to.eq(
      EXAMPLE_EVENT_SERIES.result.name
    )
  })

  it("Should have correctly set the description of the right event series", async () => {
    await (await MergeEventSeries.getDescription()).waitForExist()
    await (await MergeEventSeries.getDescription()).waitForDisplayed()
    expect(await (await MergeEventSeries.getDescription()).getText()).to.eq(
      EXAMPLE_EVENT_SERIES.result.description
    )
  })

  it("Should have correctly set the owner organization of the left event series", async () => {
    await (await MergeEventSeries.getOwnerOrganization()).waitForExist()
    await (await MergeEventSeries.getOwnerOrganization()).waitForDisplayed()
    expect(
      await (await MergeEventSeries.getOwnerOrganization()).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.result.ownerOrganization)
  })

  it("Should have correctly set the admin organization of the left event series", async () => {
    await (await MergeEventSeries.getAdminOrganization()).waitForExist()
    await (await MergeEventSeries.getAdminOrganization()).waitForDisplayed()
    expect(
      await (await MergeEventSeries.getAdminOrganization()).getText()
    ).to.eq(EXAMPLE_EVENT_SERIES.result.adminOrganization)
  })

  it("Should have correctly set the hosts of the left event series", async () => {
    expect(await MergeEventSeries.getHostNames()).to.have.members(
      EXAMPLE_EVENT_SERIES.result.hosts
    )
  })
})
