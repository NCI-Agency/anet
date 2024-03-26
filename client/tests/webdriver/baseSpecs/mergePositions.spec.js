import { expect } from "chai"
import moment from "moment"
import MergePositions from "../pages/mergePositions.page"

const EXAMPLE_POSITIONS = {
  validLeft: {
    search: "merge one",
    fullName: "Merge One",
    organization: "MoD | Ministry of Defense",
    type: "REGULAR",
    role: "Deputy",
    status: "ACTIVE",
    email: "Network Address\nInternet mergeOne@mod.example.com",
    person: "CIV BEMERGED, Myposwill",
    associatedPositions: [
      { person: "Unfilled", position: "EF 1.1 Advisor B" },
      { person: "Unfilled", position: "EF 1.1 Advisor C" }
    ],
    previousPeople: [
      {
        name: "CIV BEMERGED, Myposwill",
        date: `${moment().format("D MMMM YYYY")} -  `
      }
    ],
    location: "Unspecified",
    notes: ["Merge one position note"]
  },
  validRight: {
    search: "merge two",
    fullName: "Merge Two",
    organization: "MoD | Ministry of Defense",
    type: "REGULAR",
    role: "Leader",
    status: "ACTIVE",
    email: "No email addresses available",
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
  it("Should display fields values of the left position", async() => {
    // Open merge positions page.
    await MergePositions.open()
    await (await MergePositions.getTitle()).waitForExist()
    await (await MergePositions.getTitle()).waitForDisplayed()

    // Search and select a position from left position field.
    await (
      await MergePositions.getLeftPositionField()
    ).setValue(EXAMPLE_POSITIONS.validLeft.search)
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500) // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a position from left side.
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.fullName,
      "left",
      "Position Name"
    )
    expect(
      await (
        await MergePositions.getColumnContent("left", "Position Name")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.fullName)
    expect(
      await (
        await MergePositions.getColumnContent("left", "Organization")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.organization)
    expect(
      await (await MergePositions.getColumnContent("left", "Type")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.type)
    expect(
      await (
        await MergePositions.getColumnContent("left", "Position Role")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.role)
    expect(
      await (await MergePositions.getColumnContent("left", "Status")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.status)
    expect(
      await (
        await MergePositions.getColumnContent("left", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.email)
    expect(
      await (await MergePositions.getColumnContent("left", "Person")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.person)
    expect(await MergePositions.getAssociatedPositions("left")).to.eql(
      EXAMPLE_POSITIONS.validLeft.associatedPositions
    )
    expect(await MergePositions.getPreviousPeople("left")).to.eql(
      EXAMPLE_POSITIONS.validLeft.previousPeople
    )
  })
  it("Should not allow to select the same positions", async() => {
    await (
      await MergePositions.getRightPositionField()
    ).setValue(EXAMPLE_POSITIONS.validLeft.search)
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()

    await (await MergePositions.getSamePositionsToast()).waitForDisplayed()
  })
  it("Should not allow to select two occupied positions", async() => {
    await (
      await MergePositions.getRightPositionField()
    ).setValue(EXAMPLE_POSITIONS.occupiedRight.search)
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.occupiedRight.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()

    await (await MergePositions.getOccupiedPositionsToast()).waitForDisplayed()
  })
  it("Should display fields values of the right position", async() => {
    // Search and select a position from right position field.
    await (
      await MergePositions.getRightPositionField()
    ).setValue(EXAMPLE_POSITIONS.validRight.search)
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validRight.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500) // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a position from left side.
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validRight.fullName,
      "right",
      "Position Name"
    )
    expect(
      await (
        await MergePositions.getColumnContent("right", "Position Name")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.fullName)
    expect(
      await (
        await MergePositions.getColumnContent("right", "Organization")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.organization)
    expect(
      await (await MergePositions.getColumnContent("right", "Type")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.type)
    expect(
      await (
        await MergePositions.getColumnContent("right", "Position Role")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.role)
    expect(
      await (await MergePositions.getColumnContent("right", "Status")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.status)
    expect(
      await (
        await MergePositions.getColumnContent("right", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.email)
    expect(
      await (await MergePositions.getColumnContent("right", "Person")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.person)
    expect(await MergePositions.getAssociatedPositions("right")).to.eql(
      EXAMPLE_POSITIONS.validRight.associatedPositions
    )
    expect(await MergePositions.getPreviousPeople("right")).to.eql(
      EXAMPLE_POSITIONS.validRight.previousPeople
    )
  })
  it("Should be able to select all fields from left position", async() => {
    await (await MergePositions.getUseAllButton("left")).click()
    await browser.pause(500) // wait for the rendering of custom fields

    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.fullName,
      "mid",
      "Position Name"
    )
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Position Name")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.fullName)
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Organization")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.organization)
    expect(
      await (await MergePositions.getColumnContent("mid", "Type")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.type)
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Position Role")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.role)
    expect(
      await (await MergePositions.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.status)
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.email)
    expect(
      await (await MergePositions.getColumnContent("mid", "Person")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.person)
    expect(await MergePositions.getAssociatedPositions("mid")).to.eql(
      EXAMPLE_POSITIONS.validLeft.associatedPositions
    )
    expect(await MergePositions.getPreviousPeople("mid")).to.eql(
      EXAMPLE_POSITIONS.validLeft.previousPeople
    )
    expect(
      await (await MergePositions.getColumnContent("mid", "Location")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.location)
  })
  it("Should be able to select all fields from right position", async() => {
    await (await MergePositions.getUseAllButton("right")).click()
    await browser.pause(500) // wait for the rendering of custom fields

    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validRight.fullName,
      "mid",
      "Position Name"
    )
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Position Name")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.fullName)
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Organization")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.organization)
    expect(
      await (await MergePositions.getColumnContent("mid", "Type")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.type)
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Position Role")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.role)
    expect(
      await (await MergePositions.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.status)
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Email addresses")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.email)
    expect(
      await (await MergePositions.getColumnContent("mid", "Person")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.person)
    expect(await MergePositions.getAssociatedPositions("mid")).to.eql(
      EXAMPLE_POSITIONS.validRight.associatedPositions
    )
    expect(await MergePositions.getPreviousPeople("mid")).to.eql(
      EXAMPLE_POSITIONS.validRight.previousPeople
    )
    expect(
      await (await MergePositions.getColumnContent("mid", "Location")).getText()
    ).to.eq(EXAMPLE_POSITIONS.validRight.location)
  })
  it("Should be able to select from both left and right side.", async() => {
    await (
      await MergePositions.getSelectButton("left", "Position Name")
    ).click()
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.fullName,
      "mid",
      "Position Name"
    )
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Position Name")
      ).getText()
    ).to.eq(EXAMPLE_POSITIONS.validLeft.fullName)

    await (
      await MergePositions.getSelectButton("left", "Position Role")
    ).click()
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.role,
      "mid",
      "Position Role"
    )
    expect(
      await (
        await MergePositions.getColumnContent("mid", "Position Role")
      ).getText()
    ).to.equal(EXAMPLE_POSITIONS.validLeft.role)

    await (
      await MergePositions.getSelectButton("left", "Associated Positions")
    ).click()
    expect(await MergePositions.getAssociatedPositions("mid")).to.eql(
      EXAMPLE_POSITIONS.validLeft.associatedPositions
    )

    await (
      await MergePositions.getSelectButton("left", "Previous People")
    ).click()
    expect(await MergePositions.getPreviousPeople("mid")).to.eql(
      EXAMPLE_POSITIONS.validLeft.previousPeople
    )
  })
  it("Should display correct values on the left column", async() => {
    await (await MergePositions.getUseAllButton("left")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.fullName,
      "mid",
      "Position Name"
    )
    await (await MergePositions.getEditAssociatedPositionsButton()).click()
    await (
      await MergePositions.getEditAssociatedPositionsModal()
    ).waitForDisplayed()
    expect(await MergePositions.getAssociatedPositionsInModal("left")).to.eql(
      EXAMPLE_POSITIONS.validLeft.associatedPositions
    )
  })
  it("Should display correct values on the right column", async() => {
    expect(await MergePositions.getAssociatedPositionsInModal("right")).to.eql(
      EXAMPLE_POSITIONS.validRight.associatedPositions
    )
  })
  it("Should display left column values on the middle column", async() => {
    expect(await MergePositions.getAssociatedPositionsInModal("mid")).to.eql(
      await MergePositions.getAssociatedPositionsInModal("left")
    )
  })
  it("Should be able to remove items from the middle column", async() => {
    const index = 0
    const afterFirstRemove = [
      { person: "Unfilled", position: "EF 1.1 Advisor C" }
    ]
    const afterSecondRemove = []
    await (
      await MergePositions.getAssociatedPositionActionButton("mid", index)
    ).waitForDisplayed()
    await (
      await MergePositions.getAssociatedPositionActionButton("mid", index)
    ).scrollIntoView()
    await (
      await MergePositions.getAssociatedPositionActionButton("mid", index)
    ).click()
    expect(await MergePositions.getAssociatedPositionsInModal("mid")).to.eql(
      afterFirstRemove
    )
    await (
      await MergePositions.getAssociatedPositionActionButton("mid", index)
    ).click()
    expect(await MergePositions.getAssociatedPositionsInModal("mid")).to.eql(
      afterSecondRemove
    )
  })
  it("Should be able to select items from right and left and save", async() => {
    const leftItemIndex = 0
    const rightItemIndex = 1
    const afterPicked = [
      { person: "Unfilled", position: "EF 1.1 Advisor B" },
      { person: "Unfilled", position: "EF 1.1 Advisor D" }
    ]
    await (
      await MergePositions.getAssociatedPositionActionButton(
        "left",
        leftItemIndex
      )
    ).click()
    await (
      await MergePositions.getAssociatedPositionActionButton(
        "right",
        rightItemIndex
      )
    ).click()
    expect(await MergePositions.getAssociatedPositionsInModal("mid")).to.eql(
      afterPicked
    )
    await (await MergePositions.getSaveAssociatedPositionsButton()).click()
    expect(await MergePositions.getAssociatedPositions("mid")).to.eql(
      afterPicked
    )
  })
  it("Should be able to merge both positions when winner is left position", async() => {
    await (await MergePositions.getMergePositionsButton()).click()
    await MergePositions.waitForSuccessAlert()
  })
  it("Should merge positions when winner's associated positions are a combination from both positions", async() => {
    const winnerApsAfterMerge = [
      { person: "Unfilled", position: "EF 1.1 Advisor B" },
      { person: "Unfilled", position: "EF 1.1 Advisor D" }
    ]
    expect(await MergePositions.getWinnerAssociatedPositions()).to.eql(
      winnerApsAfterMerge
    )
  })
  it("Should merge notes of the both positions", async() => {
    await (await MergePositions.getShowNotesButton()).click()
    // Wait for offcanvas to open
    await browser.pause(100)
    expect(
      await MergePositions.areNotesExist([
        ...EXAMPLE_POSITIONS.validLeft.notes,
        ...EXAMPLE_POSITIONS.validRight.notes
      ])
    ).to.eq(true)
  })
  it("Should be able to delete the loser position", async() => {
    await MergePositions.openPage(
      `/positions/${EXAMPLE_POSITIONS.validRight.posUuid}`
    )
    await (await MergePositions.getErrorTitle()).waitForExist()
    expect(await (await MergePositions.getErrorTitle()).getText()).to.equal(
      `Position #${EXAMPLE_POSITIONS.validRight.posUuid} not found.`
    )
  })
})
