import { expect as pwExpect } from "@playwright/test"
import moment from "moment"
import MergePositions from "../pages/mergePositions.page.js"
import { currentPage, test, waitFor } from "../support.js"

const EXAMPLE_POSITIONS = {
  validLeft: {
    search: "merge one",
    uuid: "25fe500c-3503-4ba8-a9a4-09b29b50c1f1",
    name: "Merge One",
    fullName: "Merge One, MOD-M1-HQ-00001",
    organization: "MoD | Ministry of Defense",
    type: "Regular position",
    role: "Deputy",
    status: "ACTIVE",
    email: "Network Address\nInternet mergeOne@mod.example.com",
    person: "CIV Myposwill Bemerged",
    associatedPositions: [
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor B"
      },
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor C"
      }
    ],
    previousPeople: [
      {
        name: "CIV Myposwill Bemerged",
        date: `${moment("2020-01-01").format("D MMMM YYYY")} -`
      }
    ],
    location: "Unspecified",
    notes: ["Merge one position note"]
  },
  validRight: {
    search: "merge two",
    uuid: "e87f0f60-ad13-4c1c-96f7-672c595b81c7",
    name: "Merge Two",
    fullName: "Merge Two, MOD-M2-HQ-00001",
    organization: "MoD | Ministry of Defense",
    type: "Regular position",
    role: "Leader",
    status: "ACTIVE",
    email: "No email addresses available",
    person: "Unspecified",
    associatedPositions: [
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor C"
      },
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor D"
      }
    ],
    previousPeople: [],
    location: "Unspecified",
    posUuid: "e87f0f60-ad13-4c1c-96f7-672c595b81c7",
    notes: ["Merge two position note"]
  },
  occupiedRight: {
    search: "cost adder",
    fullName: "Cost Adder - MoD, MOD-Bud-00003"
  }
}
test.describe("Merge positions page", () => {
  test("Should display a warning when leaving the page with unsaved changes", async () => {
    await MergePositions.openPage()
    await waitFor(await MergePositions.getTitle(), "attached")
    await waitFor(await MergePositions.getTitle(), "visible")
    await (
      await MergePositions.getLeftPositionField()
    ).fill(String(EXAMPLE_POSITIONS.validLeft.search))
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()
    // attempt to leave when only one position is selected, should allow to leave
    await MergePositions.clickLogo()
    await pwExpect(await MergePositions.getModalDialog()).toHaveCount(0)
    await MergePositions.openPage()
    await waitFor(await MergePositions.getTitle(), "attached")
    await waitFor(await MergePositions.getTitle(), "visible")
    await (
      await MergePositions.getLeftPositionField()
    ).fill(String(EXAMPLE_POSITIONS.validLeft.search))
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()
    await (
      await MergePositions.getRightPositionField()
    ).fill(String(EXAMPLE_POSITIONS.validRight.search))
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validRight.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()
    // attempt to leave when both positions are selected, should show warning
    await MergePositions.clickLogo()
    await pwExpect(await MergePositions.getModalDialog()).not.toHaveCount(0)
    await (await currentPage().locator(".btn-danger").first()).click()
  })
  test("Should display fields values of the left position", async () => {
    // Open merge positions page.
    await MergePositions.openPage()
    await waitFor(await MergePositions.getTitle(), "attached")
    await waitFor(await MergePositions.getTitle(), "visible")

    // Search and select a position from left position field.
    await (
      await MergePositions.getLeftPositionField()
    ).fill(String(EXAMPLE_POSITIONS.validLeft.search))
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validLeft.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a position from left side.
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.uuid,
      "left",
      "UUID"
    )
    await pwExpect(
      await MergePositions.getColumnContent("left", "UUID")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.uuid, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("left", "Position Name")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.name, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("left", "Organization")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.organization, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("left", "Type")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.type, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("left", "Position Role")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.role, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("left", "Status")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.status, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("left", "Email addresses")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.email, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("left", "Person")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.person, {
      useInnerText: true
    })
    await pwExpect
      .poll(async () => await MergePositions.getAssociatedPositions("left"))
      .toEqual(EXAMPLE_POSITIONS.validLeft.associatedPositions)
    await pwExpect
      .poll(async () => await MergePositions.getPreviousPeople("left"))
      .toEqual(EXAMPLE_POSITIONS.validLeft.previousPeople)
  })
  test("Should display fields values of the right position", async () => {
    // Search and select a position from right position field.
    await (
      await MergePositions.getRightPositionField()
    ).fill(String(EXAMPLE_POSITIONS.validRight.search))
    await MergePositions.waitForAdvancedSelectLoading(
      EXAMPLE_POSITIONS.validRight.fullName
    )
    await (await MergePositions.getFirstItemFromAdvancedSelect()).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a position from left side.
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validRight.uuid,
      "right",
      "UUID"
    )
    await pwExpect(
      await MergePositions.getColumnContent("right", "UUID")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.uuid, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("right", "Position Name")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.name, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("right", "Organization")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.organization, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("right", "Type")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.type, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("right", "Position Role")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.role, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("right", "Status")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.status, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("right", "Email addresses")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.email, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("right", "Person")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.person, {
      useInnerText: true
    })
    await pwExpect
      .poll(async () => await MergePositions.getAssociatedPositions("right"))
      .toEqual(EXAMPLE_POSITIONS.validRight.associatedPositions)
    await pwExpect
      .poll(async () => await MergePositions.getPreviousPeople("right"))
      .toEqual(EXAMPLE_POSITIONS.validRight.previousPeople)
  })
  test("Should autoMerge some identical fields from both positions", async () => {
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.status, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.status, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Location")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.location, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Location")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.location, {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from left position", async () => {
    await (await MergePositions.getUseAllButton("left")).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a position from left side.
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.uuid,
      "mid",
      "UUID"
    )
    await pwExpect(
      await MergePositions.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.uuid, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Position Name")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.name, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Organization")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.organization, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Type")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.type, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Position Role")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.role, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.status, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.email, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Person")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.person, {
      useInnerText: true
    })
    await pwExpect
      .poll(async () => await MergePositions.getAssociatedPositions("mid"))
      .toEqual(EXAMPLE_POSITIONS.validLeft.associatedPositions)
    await pwExpect
      .poll(async () => await MergePositions.getPreviousPeople("mid"))
      .toEqual(EXAMPLE_POSITIONS.validLeft.previousPeople)
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Location")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.location, {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from right position", async () => {
    await (await MergePositions.getUseAllButton("right")).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting a position from left side.
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validRight.uuid,
      "mid",
      "UUID"
    )
    await pwExpect(
      await MergePositions.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.uuid, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Position Name")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.name, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Organization")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.organization, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Type")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.type, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Position Role")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.role, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.status, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Email addresses")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.email, {
      useInnerText: true
    })
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Person")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.person, {
      useInnerText: true
    })
    await pwExpect
      .poll(async () => await MergePositions.getAssociatedPositions("mid"))
      .toEqual(EXAMPLE_POSITIONS.validRight.associatedPositions)
    await pwExpect
      .poll(async () => await MergePositions.getPreviousPeople("mid"))
      .toEqual(EXAMPLE_POSITIONS.validRight.previousPeople)
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Location")
    ).toHaveText(EXAMPLE_POSITIONS.validRight.location, {
      useInnerText: true
    })
  })
  test("Should be able to select from both left and right side", async () => {
    await (await MergePositions.getSelectButton("left", "UUID")).click()
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.uuid,
      "mid",
      "UUID"
    )
    await pwExpect(
      await MergePositions.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.uuid, {
      useInnerText: true
    })
    await (
      await MergePositions.getSelectButton("left", "Position Name")
    ).click()
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.name,
      "mid",
      "Position Name"
    )
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Position Name")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.name, {
      useInnerText: true
    })
    await (
      await MergePositions.getSelectButton("left", "Position Role")
    ).click()
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.role,
      "mid",
      "Position Role"
    )
    await pwExpect(
      await MergePositions.getColumnContent("mid", "Position Role")
    ).toHaveText(EXAMPLE_POSITIONS.validLeft.role, {
      useInnerText: true
    })
    await (
      await MergePositions.getSelectButton("left", "Associated Positions")
    ).click()
    await pwExpect
      .poll(async () => await MergePositions.getAssociatedPositions("mid"))
      .toEqual(EXAMPLE_POSITIONS.validLeft.associatedPositions)
    await (
      await MergePositions.getSelectButton("left", "Previous People")
    ).click()
    await pwExpect
      .poll(async () => await MergePositions.getPreviousPeople("mid"))
      .toEqual(EXAMPLE_POSITIONS.validLeft.previousPeople)
  })
  test("Should display correct values on the left column", async () => {
    await (await MergePositions.getUseAllButton("left")).click()
    // wait for the rendering of custom fields
    await MergePositions.waitForColumnToChange(
      EXAMPLE_POSITIONS.validLeft.name,
      "mid",
      "Position Name"
    )
    await (await MergePositions.getEditAssociatedPositionsButton()).click()
    await waitFor(
      await MergePositions.getEditAssociatedPositionsModal(),
      "visible"
    )
    await pwExpect
      .poll(
        async () => await MergePositions.getAssociatedPositionsInModal("left")
      )
      .toEqual(EXAMPLE_POSITIONS.validLeft.associatedPositions)
  })
  test("Should display correct values on the right column", async () => {
    await pwExpect
      .poll(
        async () => await MergePositions.getAssociatedPositionsInModal("right")
      )
      .toEqual(EXAMPLE_POSITIONS.validRight.associatedPositions)
  })
  test("Should display left column values on the middle column", async () => {
    await pwExpect
      .poll(
        async () => await MergePositions.getAssociatedPositionsInModal("mid")
      )
      .toEqual(await MergePositions.getAssociatedPositionsInModal("left"))
  })
  test("Should be able to remove items from the middle column", async () => {
    const index = 0
    const afterFirstRemove = [
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor C"
      }
    ]
    const afterSecondRemove = []
    await waitFor(
      await MergePositions.getAssociatedPositionActionButton("mid", index),
      "visible"
    )
    await (
      await MergePositions.getAssociatedPositionActionButton("mid", index)
    ).scrollIntoViewIfNeeded()
    await (
      await MergePositions.getAssociatedPositionActionButton("mid", index)
    ).click()
    await pwExpect
      .poll(
        async () => await MergePositions.getAssociatedPositionsInModal("mid")
      )
      .toEqual(afterFirstRemove)
    await (
      await MergePositions.getAssociatedPositionActionButton("mid", index)
    ).click()
    await pwExpect
      .poll(
        async () => await MergePositions.getAssociatedPositionsInModal("mid")
      )
      .toEqual(afterSecondRemove)
  })
  test("Should be able to select items from right and left and save", async () => {
    const leftItemIndex = 0
    const rightItemIndex = 1
    const afterPicked = [
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor B"
      },
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor D"
      }
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
    await pwExpect
      .poll(
        async () => await MergePositions.getAssociatedPositionsInModal("mid")
      )
      .toEqual(afterPicked)
    await (await MergePositions.getSaveAssociatedPositionsButton()).click()
    await pwExpect
      .poll(async () => await MergePositions.getAssociatedPositions("mid"))
      .toEqual(afterPicked)
  })
  test("Should be able to merge both positions when winner is left position", async () => {
    await (await MergePositions.getMergePositionsButton()).click()
    await MergePositions.waitForSuccessAlert()
  })
  test("Should have merged positions when winner's associated positions are a combination from both positions", async () => {
    const winnerApsAfterMerge = [
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor B"
      },
      {
        person: "Unfilled",
        position: "EF 1.1 Advisor D"
      }
    ]
    await pwExpect
      .poll(async () => await MergePositions.getWinnerAssociatedPositions())
      .toEqual(winnerApsAfterMerge)
  })
  test("Should have merged notes of the both positions", async () => {
    await (await MergePositions.getShowNotesButton()).click()
    // Wait for offcanvas to open

    await pwExpect
      .poll(
        async () =>
          await MergePositions.areNotesExist([
            ...EXAMPLE_POSITIONS.validLeft.notes,
            ...EXAMPLE_POSITIONS.validRight.notes
          ])
      )
      .toEqual(true)
  })
  test("Should have deleted the loser position", async () => {
    await MergePositions.openPage(
      `/positions/${EXAMPLE_POSITIONS.validRight.posUuid}`
    )
    await waitFor(await MergePositions.getErrorTitle(), "attached")
    await pwExpect(await MergePositions.getErrorTitle()).toHaveText(
      `Position #${EXAMPLE_POSITIONS.validRight.posUuid} not found.`,
      {
        useInnerText: true
      }
    )
  })
})
