import { expect } from "chai"
import MergePositions from "../pages/mergePositions.page"

const EXAMPLE_POSITIONS = {
  left: {
    search: "cost",
    fullName: "Cost Adder - MoD",
    Organization: "MoD",
    Type: "PRINCIPAL",
    Code: "MOD-Bud-00003",
    Status: "ACTIVE",
    Person: "LtCol STEVESON, Steve",
    AssociatedPositions: {
      Name: "Capt ELIZAWELL, Elizabeth",
      Position: "EF 1.1 Advisor A"
    },
    PreviousPeople: {
      Name: "LtCol STEVESON, Steve",
      Dates: function() {
        const today = new Date()
        const day = today.getDate()
        const month = today.toLocaleString("default", { month: "long" })
        const year = today.getFullYear()
        return `${day} ${month} ${year} -  `
      }
    },
    Location: "MoD Headquarters Kabul"
  },
  right: {
    search: "Director",
    fullName: "Director of Budgeting - MoD",
    Organization: "MoD",
    Type: "PRINCIPAL",
    Code: "MOD-Bud-00001",
    Status: "ACTIVE",
    Person: "Unspecified",
    AssociatedPositions: {
      Name: "",
      Position: ""
    },
    PreviousPeople: {
      Name: "",
      Dates: ""
    },
    Location: "Unspecified"
  }
}

describe("Merge positions page", () => {
  it("Should be able to select to positions to merge", () => {
    // Open merge positions page.
    MergePositions.open()
    MergePositions.title.waitForExist()
    MergePositions.title.waitForDisplayed()

    // Search and select a position from left position field.
    MergePositions.leftPositionField.setValue(EXAMPLE_POSITIONS.left.search)
    MergePositions.waitForAdvancedSelectLoading(EXAMPLE_POSITIONS.left.fullName)
    MergePositions.firstItemFromAdvancedSelect.click()
    // Check if the fields displayed properly after selecting a position from left side.
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.left.fullName,
      "left",
      "Name"
    )
    expect(MergePositions.getColumnContent("left", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.left.fullName
    )
    expect(
      MergePositions.getColumnContent("left", "Organization").getText()
    ).to.eq(EXAMPLE_POSITIONS.left.Organization)
    expect(MergePositions.getColumnContent("left", "Type").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Type
    )
    expect(MergePositions.getColumnContent("left", "Code").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Code
    )
    expect(MergePositions.getColumnContent("left", "Status").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Status
    )
    expect(MergePositions.getColumnContent("left", "Person").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Person
    )
    expect(
      MergePositions.getAssociatedPosition("left", "Name").getText()
    ).to.eq(EXAMPLE_POSITIONS.left.AssociatedPositions.Name)
    expect(
      MergePositions.getAssociatedPosition("left", "Position").getText()
    ).to.eq(EXAMPLE_POSITIONS.left.AssociatedPositions.Position)
    expect(MergePositions.getPreviousPeople("left", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.left.PreviousPeople.Name
    )
    expect(
      MergePositions.getPreviousPeople("left", "Dates").getText()
    ).to.include(EXAMPLE_POSITIONS.left.PreviousPeople.Dates())
    expect(MergePositions.getColumnContent("left", "Location").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Location
    )

    // Search and select a position from right position field.
    MergePositions.rightPositionField.setValue(EXAMPLE_POSITIONS.right.search)
    MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.right.fullName
    )
    MergePositions.firstItemFromAdvancedSelect.click()
    // Check if the fields displayed properly after selecting a position from right side.
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.right.fullName,
      "right",
      "Name"
    )
    expect(MergePositions.getColumnContent("right", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.right.fullName
    )
    expect(
      MergePositions.getColumnContent("right", "Organization").getText()
    ).to.eq(EXAMPLE_POSITIONS.right.Organization)
    expect(MergePositions.getColumnContent("right", "Type").getText()).to.eq(
      EXAMPLE_POSITIONS.right.Type
    )
    expect(MergePositions.getColumnContent("right", "Code").getText()).to.eq(
      EXAMPLE_POSITIONS.right.Code
    )
    expect(MergePositions.getColumnContent("right", "Person").getText()).to.eq(
      EXAMPLE_POSITIONS.right.Person
    )
    expect(
      MergePositions.getColumnContent("right", "Location").getText()
    ).to.eq(EXAMPLE_POSITIONS.right.Location)
  })

  it("Should be able to select all fields from left position", () => {
    MergePositions.getUseAllButton("left").click()

    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.left.fullName,
      "mid",
      "Name"
    )
    expect(MergePositions.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.left.fullName
    )
    expect(
      MergePositions.getColumnContent("mid", "Organization").getText()
    ).to.eq(EXAMPLE_POSITIONS.left.Organization)
    expect(MergePositions.getColumnContent("mid", "Type").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Type
    )
    expect(MergePositions.getColumnContent("mid", "Code").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Code
    )
    expect(MergePositions.getColumnContent("mid", "Status").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Status
    )
    expect(MergePositions.getColumnContent("mid", "Person").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Person
    )
    expect(MergePositions.getAssociatedPosition("mid", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.left.AssociatedPositions.Name
    )
    expect(
      MergePositions.getAssociatedPosition("mid", "Position").getText()
    ).to.eq(EXAMPLE_POSITIONS.left.AssociatedPositions.Position)
    expect(MergePositions.getPreviousPeople("mid", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.left.PreviousPeople.Name
    )
    expect(
      MergePositions.getPreviousPeople("mid", "Dates").getText()
    ).to.include(EXAMPLE_POSITIONS.left.PreviousPeople.Dates())
    expect(MergePositions.getColumnContent("mid", "Location").getText()).to.eq(
      EXAMPLE_POSITIONS.left.Location
    )
  })

  it("Should be able to select all fields from right position", () => {
    MergePositions.getUseAllButton("right").click()
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.right.fullName,
      "mid",
      "Name"
    )
    expect(MergePositions.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.right.fullName
    )
    expect(
      MergePositions.getColumnContent("mid", "Organization").getText()
    ).to.eq(EXAMPLE_POSITIONS.right.Organization)
    expect(MergePositions.getColumnContent("mid", "Type").getText()).to.eq(
      EXAMPLE_POSITIONS.right.Type
    )
    expect(MergePositions.getColumnContent("mid", "Code").getText()).to.eq(
      EXAMPLE_POSITIONS.right.Code
    )
    expect(MergePositions.getColumnContent("mid", "Person").getText()).to.eq(
      EXAMPLE_POSITIONS.right.Person
    )
    expect(MergePositions.getColumnContent("mid", "Location").getText()).to.eq(
      EXAMPLE_POSITIONS.right.Location
    )
  })

  it("Should be able to merge both positions when winner is left position", () => {
    MergePositions.getUseAllButton("left").click()
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.left.fullName,
      "mid",
      "Name"
    )

    MergePositions.mergePositionsButton.click()

    MergePositions.waitForSuccessAlert()
  })
})
