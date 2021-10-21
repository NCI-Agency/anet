import { expect } from "chai"
import moment from "moment"
import MergePositions from "../pages/mergePositions.page"

const EXAMPLE_POSITIONS = {
  validLeft: {
    search: "merge one",
    fullName: "Merge One",
    organization: "MoD",
    type: "PRINCIPAL",
    code: "MOD-M1-HQ-00001",
    status: "ACTIVE",
    person: "CIV BEMERGED, Myposwill",
    associatedPositions: [
      { person: "Unfilled", position: "EF 1.1 Advisor B" },
      { person: "Unfilled", position: "EF 1.1 Advisor C" }
    ],
    previousPeople: [
      {
        name: "CIV BEMERGED, Myposwill",
        date: `${moment().format("DD MMMM YYYY")} -  `
      }
    ],
    location: "Unspecified",
    notes: ["Merge one position note"]
  },
  validRight: {
    search: "merge two",
    fullName: "Merge Two",
    organization: "MoD",
    type: "PRINCIPAL",
    code: "MOD-M2-HQ-00001",
    status: "ACTIVE",
    person: "Unspecified",
    associatedPositions: [
      { person: "Unfilled", position: "EF 1.1 Advisor C" },
      { person: "Unfilled", position: "EF 1.1 Advisor D" }
    ],
    previousPeople: [],
    location: "Unspecified",
    posUuid: "e87f0f60-ad13-4c1c-96f7-672c595b81c7",
    notes: ["Merge two position note"]
  },
  occupiedRight: {
    search: "cost adder",
    fullName: "Cost Adder - MoD"
  }
}

describe("Merge positions page", () => {
  it("Should display fields values of the left position", () => {
    // Open merge positions page.
    MergePositions.open()
    MergePositions.title.waitForExist()
    MergePositions.title.waitForDisplayed()

    // Search and select a position from left position field.
    MergePositions.leftPositionField.setValue(
      EXAMPLE_POSITIONS.validLeft.search
    )
    MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    MergePositions.firstItemFromAdvancedSelect.click()
    // Check if the fields displayed properly after selecting a position from left side.
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.fullName,
      "left",
      "Name"
    )
    expect(MergePositions.getColumnContent("left", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    expect(
      MergePositions.getColumnContent("left", "Organization").getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.organization)
    expect(MergePositions.getColumnContent("left", "Type").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.type
    )
    expect(MergePositions.getColumnContent("left", "Code").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.code
    )
    expect(MergePositions.getColumnContent("left", "Status").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.status
    )
    expect(MergePositions.getColumnContent("left", "Person").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.person
    )
    expect(MergePositions.getAssociatedPositions("left")).to.eql(
      EXAMPLE_POSITIONS.validLeft.associatedPositions
    )
    expect(MergePositions.getPreviousPeople("left")).to.eql(
      EXAMPLE_POSITIONS.validLeft.previousPeople
    )
  })

  it("Should not allow to select the same positions", () => {
    MergePositions.rightPositionField.setValue(
      EXAMPLE_POSITIONS.validLeft.search
    )
    MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    MergePositions.firstItemFromAdvancedSelect.click()

    MergePositions.samePositionsToast.waitForDisplayed()
  })

  it("Should not allow to select two occupied positions", () => {
    MergePositions.rightPositionField.setValue(
      EXAMPLE_POSITIONS.occupiedRight.search
    )
    MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.occupiedRight.fullName
    )
    MergePositions.firstItemFromAdvancedSelect.click()

    MergePositions.occupiedPositionsToast.waitForDisplayed()
  })

  it("Should display fields values of the right position", () => {
    // Search and select a position from right position field.
    MergePositions.rightPositionField.setValue(
      EXAMPLE_POSITIONS.validRight.search
    )
    MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validRight.fullName
    )
    MergePositions.firstItemFromAdvancedSelect.click()
    // Check if the fields displayed properly after selecting a position from left side.
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validRight.fullName,
      "right",
      "Name"
    )
    expect(MergePositions.getColumnContent("right", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.fullName
    )
    expect(
      MergePositions.getColumnContent("right", "Organization").getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.organization)
    expect(MergePositions.getColumnContent("right", "Type").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.type
    )
    expect(MergePositions.getColumnContent("right", "Code").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.code
    )
    expect(MergePositions.getColumnContent("right", "Status").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.status
    )
    expect(MergePositions.getColumnContent("right", "Person").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.person
    )
    expect(MergePositions.getAssociatedPositions("right")).to.eql(
      EXAMPLE_POSITIONS.validRight.associatedPositions
    )
    expect(MergePositions.getPreviousPeople("right")).to.eql(
      EXAMPLE_POSITIONS.validRight.previousPeople
    )
  })

  it("Should be able to select all fields from left position", () => {
    MergePositions.getUseAllButton("left").click()

    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.fullName,
      "mid",
      "Name"
    )
    expect(MergePositions.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    expect(
      MergePositions.getColumnContent("mid", "Organization").getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.organization)
    expect(MergePositions.getColumnContent("mid", "Type").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.type
    )
    expect(MergePositions.getColumnContent("mid", "Code").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.code
    )
    expect(MergePositions.getColumnContent("mid", "Status").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.status
    )
    expect(MergePositions.getColumnContent("mid", "Person").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.person
    )
    expect(MergePositions.getAssociatedPositions("mid")).to.eql(
      EXAMPLE_POSITIONS.validLeft.associatedPositions
    )
    expect(MergePositions.getPreviousPeople("mid")).to.eql(
      EXAMPLE_POSITIONS.validLeft.previousPeople
    )
    expect(MergePositions.getColumnContent("mid", "Location").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.location
    )
  })

  it("Should be able to select all fields from right position", () => {
    MergePositions.getUseAllButton("right").click()

    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validRight.fullName,
      "mid",
      "Name"
    )
    expect(MergePositions.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.fullName
    )
    expect(
      MergePositions.getColumnContent("mid", "Organization").getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.organization)
    expect(MergePositions.getColumnContent("mid", "Type").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.type
    )
    expect(MergePositions.getColumnContent("mid", "Code").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.code
    )
    expect(MergePositions.getColumnContent("mid", "Status").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.status
    )
    expect(MergePositions.getColumnContent("mid", "Person").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.person
    )
    expect(MergePositions.getAssociatedPositions("mid")).to.eql(
      EXAMPLE_POSITIONS.validRight.associatedPositions
    )
    expect(MergePositions.getPreviousPeople("mid")).to.eql(
      EXAMPLE_POSITIONS.validRight.previousPeople
    )
    expect(MergePositions.getColumnContent("mid", "Location").getText()).to.eq(
      EXAMPLE_POSITIONS.validRight.location
    )
  })

  it("Sould be able to select from both left and right side.", () => {
    MergePositions.getSelectButton("left", "Name").click()
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.fullName,
      "mid",
      "Name"
    )
    expect(MergePositions.getColumnContent("mid", "Name").getText()).to.eq(
      EXAMPLE_POSITIONS.validLeft.fullName
    )

    MergePositions.getSelectButton("left", "Code").click()
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.code,
      "mid",
      "Code"
    )
    expect(MergePositions.getColumnContent("mid", "Code").getText()).to.equal(
      EXAMPLE_POSITIONS.validLeft.code
    )

    MergePositions.getSelectButton("left", "Associated Positions").click()
    expect(MergePositions.getAssociatedPositions("mid")).to.eql(
      EXAMPLE_POSITIONS.validLeft.associatedPositions
    )

    MergePositions.getSelectButton("left", "Previous People").click()
    expect(MergePositions.getPreviousPeople("mid")).to.eql(
      EXAMPLE_POSITIONS.validLeft.previousPeople
    )
  })

  it("Should display correct values on the left column", () => {
    MergePositions.getUseAllButton("left").click()
    MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.fullName,
      "mid",
      "Name"
    )
    MergePositions.editAssociatedPositionsButton.click()
    MergePositions.editAssociatedPositionsModal.waitForDisplayed()
    expect(MergePositions.getAssociatedPositionsInModal("left")).to.eql(
      EXAMPLE_POSITIONS.validLeft.associatedPositions
    )
  })
  it("Should display correct values on the right column", () => {
    expect(MergePositions.getAssociatedPositionsInModal("right")).to.eql(
      EXAMPLE_POSITIONS.validRight.associatedPositions
    )
  })
  it("Should display left column values on the middle column", () => {
    expect(MergePositions.getAssociatedPositionsInModal("mid")).to.eql(
      MergePositions.getAssociatedPositionsInModal("left")
    )
  })
  it("Should be able to remove items from the middle column", () => {
    const index = 0
    const afterFirstRemove = [
      { person: "Unfilled", position: "EF 1.1 Advisor C" }
    ]
    const afterSecondRemove = []
    MergePositions.getAssociatedPositionActionButton(
      "mid",
      index
    ).waitForDisplayed()
    MergePositions.getAssociatedPositionActionButton(
      "mid",
      index
    ).scrollIntoView()
    MergePositions.getAssociatedPositionActionButton("mid", index).click()
    expect(MergePositions.getAssociatedPositionsInModal("mid")).to.eql(
      afterFirstRemove
    )
    MergePositions.getAssociatedPositionActionButton("mid", index).click()
    expect(MergePositions.getAssociatedPositionsInModal("mid")).to.eql(
      afterSecondRemove
    )
  })
  it("Should be able to select items from right and left and save", () => {
    const leftItemIndex = 0
    const rightItemIndex = 1
    const afterPicked = [
      { person: "Unfilled", position: "EF 1.1 Advisor B" },
      { person: "Unfilled", position: "EF 1.1 Advisor D" }
    ]
    MergePositions.getAssociatedPositionActionButton(
      "left",
      leftItemIndex
    ).click()
    MergePositions.getAssociatedPositionActionButton(
      "right",
      rightItemIndex
    ).click()
    expect(MergePositions.getAssociatedPositionsInModal("mid")).to.eql(
      afterPicked
    )
    MergePositions.saveAssociatedPositionsButton.click()
    expect(MergePositions.getAssociatedPositions("mid")).to.eql(afterPicked)
  })

  it("Should be able to merge both positions when winner is left position", () => {
    MergePositions.mergePositionsButton.click()
    MergePositions.waitForSuccessAlert()
  })

  it("Should merge positions when winner's associated positions are a combination from both positions", () => {
    const winnerApsAfterMerge = [
      { person: "Unfilled", position: "EF 1.1 Advisor B" },
      { person: "Unfilled", position: "EF 1.1 Advisor D" }
    ]
    expect(MergePositions.winnerAssociatedPositions).to.eql(winnerApsAfterMerge)
  })

  it("Should merge notes of the both positions", () => {
    MergePositions.showNotesButton.click()
    // Wait for offcanvas to open
    browser.pause(100)
    expect(
      MergePositions.areNotesExist([
        ...EXAMPLE_POSITIONS.validLeft.notes,
        ...EXAMPLE_POSITIONS.validRight.notes
      ])
    ).to.eq(true)
  })

  it("Should be able to delete the loser position", () => {
    MergePositions.openPage(
      `/positions/${EXAMPLE_POSITIONS.validRight.posUuid}`
    )
    MergePositions.errorTitle.waitForExist()
    expect(MergePositions.errorTitle.getText()).to.equal(
      `Position #${EXAMPLE_POSITIONS.validRight.posUuid} not found.`
    )
  })
})
