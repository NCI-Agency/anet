import { expect } from "chai"
import MergeLocations from "../pages/mergeLocations.page"

const EXAMPLE_LOCATIONS = {
  left: {
    search: "Cabot",
    name: "Cabot Tower",
    fullName: "Cabot Tower 47.57001,-52.68177"
  },
  right: {
    search: "Fort",
    name: "Fort Amherst",
    fullName: "Fort Amherst 47.563763,-52.68059"
  }
}

describe("Merge locations page", () => {
  it("Should be able to select to locations to merge", async() => {
    await MergeLocations.open()
    await (await MergeLocations.getTitle()).waitForExist()
    await (await MergeLocations.getTitle()).waitForDisplayed()

    await (
      await MergeLocations.getLeftLocationField()
    ).setValue(EXAMPLE_LOCATIONS.left.search)
    await MergeLocations.waitForAdvancedSelectLoading(
      EXAMPLE_LOCATIONS.left.fullName
    )
    await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.left.name,
      "left"
    )

    expect(
      await (await MergeLocations.getColumnLocationName("left")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.left.name)

    await (
      await MergeLocations.getRightLocationField()
    ).setValue(EXAMPLE_LOCATIONS.right.search)
    await MergeLocations.waitForAdvancedSelectLoading(
      EXAMPLE_LOCATIONS.right.fullName
    )
    await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.right.name,
      "right"
    )

    expect(
      await (await MergeLocations.getColumnLocationName("right")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.right.name)
  })

  it("Should be able to select all fields from left location", async() => {
    await (await MergeLocations.getUseAllButton("left")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.left.name,
      "mid"
    )

    expect(
      await (await MergeLocations.getColumnLocationName("mid")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.left.name)
  })

  it("Should be able to select all fields from right location", async() => {
    await (await MergeLocations.getUseAllButton("right")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.right.name,
      "mid"
    )

    expect(
      await (await MergeLocations.getColumnLocationName("mid")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.right.name)
  })

  it("Should be able to merge both locations when winner is left location", async() => {
    await (await MergeLocations.getUseAllButton("left")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.left.name,
      "mid"
    )

    await (await MergeLocations.getMergeLocationsButton()).click()

    await MergeLocations.waitForSuccessAlert()
  })
})
