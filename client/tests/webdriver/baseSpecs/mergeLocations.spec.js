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
  it("Should be able to select to locations to merge", () => {
    MergeLocations.open()
    MergeLocations.title.waitForExist()
    MergeLocations.title.waitForDisplayed()

    MergeLocations.leftLocationField.setValue(EXAMPLE_LOCATIONS.left.search)
    MergeLocations.waitForAdvancedSelectLoading(EXAMPLE_LOCATIONS.left.fullName)
    MergeLocations.firstItemFromAdvancedSelect.click()
    browser.pause(500) // wait for the rendering of custom fields
    MergeLocations.waitForColumnToChange(EXAMPLE_LOCATIONS.left.name, "left")

    expect(MergeLocations.getColumnLocationName("left").getText()).to.eq(
      EXAMPLE_LOCATIONS.left.name
    )

    MergeLocations.rightLocationField.setValue(EXAMPLE_LOCATIONS.right.search)
    MergeLocations.waitForAdvancedSelectLoading(
      EXAMPLE_LOCATIONS.right.fullName
    )
    MergeLocations.firstItemFromAdvancedSelect.click()
    browser.pause(500) // wait for the rendering of custom fields
    MergeLocations.waitForColumnToChange(EXAMPLE_LOCATIONS.right.name, "right")

    expect(MergeLocations.getColumnLocationName("right").getText()).to.eq(
      EXAMPLE_LOCATIONS.right.name
    )
  })

  it("Should be able to select all fields from left location", () => {
    MergeLocations.getUseAllButton("left").click()
    browser.pause(500) // wait for the rendering of custom fields
    MergeLocations.waitForColumnToChange(EXAMPLE_LOCATIONS.left.name, "mid")

    expect(MergeLocations.getColumnLocationName("mid").getText()).to.eq(
      EXAMPLE_LOCATIONS.left.name
    )
  })

  it("Should be able to select all fields from right location", () => {
    MergeLocations.getUseAllButton("right").click()
    browser.pause(500) // wait for the rendering of custom fields
    MergeLocations.waitForColumnToChange(EXAMPLE_LOCATIONS.right.name, "mid")

    expect(MergeLocations.getColumnLocationName("mid").getText()).to.eq(
      EXAMPLE_LOCATIONS.right.name
    )
  })

  it("Should be able to merge both locations when winner is left location", () => {
    MergeLocations.getUseAllButton("left").click()
    browser.pause(500) // wait for the rendering of custom fields
    MergeLocations.waitForColumnToChange(EXAMPLE_LOCATIONS.left.name, "mid")

    MergeLocations.mergeLocationsButton.click()

    MergeLocations.waitForSuccessAlert()
  })
})
