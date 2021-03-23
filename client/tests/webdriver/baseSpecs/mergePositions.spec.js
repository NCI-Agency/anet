import { expect } from "chai"
import MergePositions from "../pages/mergePositions.page"

const EXAMPLE_POSITIONS = {
  left: {
    search: "cost",
    fullName: "Cost Adder - MoD"
  },
  right: {
    search: "Director",
    fullName: "Director of Budgeting - MoD"
  }
}

describe("Merge positions page", () => {
  it("Should be able to select to positions to merge", () => {
    MergePositions.open()
    MergePositions.title.waitForExist()
    MergePositions.title.waitForDisplayed()

    MergePositions.leftPositionField.setValue(EXAMPLE_POSITIONS.left.search)
    MergePositions.waitForAdvancedSelectLoading(EXAMPLE_POSITIONS.left.fullName)
    MergePositions.firstItemFromAdvancedSelect.click()
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.left.fullName,
      "left"
    )

    expect(MergePositions.getColumnPositionName("left").getText()).to.eq(
      EXAMPLE_POSITIONS.left.fullName
    )

    MergePositions.rightPositionField.setValue(EXAMPLE_POSITIONS.right.search)
    MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.right.fullName
    )
    MergePositions.firstItemFromAdvancedSelect.click()
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.right.fullName,
      "right"
    )

    expect(MergePositions.getColumnPositionName("right").getText()).to.eq(
      EXAMPLE_POSITIONS.right.fullName
    )
  })

  it("Should be able to select all fields from left position", () => {
    MergePositions.getUseAllButton("left").click()
    MergePositions.waitForColumnToChange(EXAMPLE_POSITIONS.left.fullName, "mid")

    expect(MergePositions.getColumnPositionName("mid").getText()).to.eq(
      EXAMPLE_POSITIONS.left.fullName
    )
  })

  it("Should be able to select all fields from right position", () => {
    MergePositions.getUseAllButton("right").click()
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.right.fullName,
      "mid"
    )

    expect(MergePositions.getColumnPositionName("mid").getText()).to.eq(
      EXAMPLE_POSITIONS.right.fullName
    )
  })

  it("Should be able to merge both positions when winner is left position", () => {
    MergePositions.getUseAllButton("left").click()
    MergePositions.waitForColumnToChange(EXAMPLE_POSITIONS.left.fullName, "mid")

    MergePositions.mergePositionsButton.click()

    MergePositions.waitForSuccessAlert()
  })
})
