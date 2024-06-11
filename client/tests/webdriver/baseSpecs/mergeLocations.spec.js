import { expect } from "chai"
import MergeLocations from "../pages/mergeLocations.page"

const EXAMPLE_LOCATIONS = {
  left: {
    search: "Location Winner",
    name: "Merge Location Winner",
    type: "Point location",
    fullName: "Merge Location Winner 38.58809,-28.71611",
    latLon: "38.58809, -28.71611",
    parentLocations: "Name Type\nPortugal Country",
    planningApprovalSteps:
      "Location planning approval for merge winner\nPerson Position\nOF-2 ELIZAWELL, Elizabeth EF 1.1 Advisor A",
    approvalSteps:
      "Location publication approval for merge winner\nPerson Position\nUnfilled EF 1.1 Advisor B"
  },
  leftCountry: {
    search: "Andorra",
    name: "Andorra",
    type: "Country",
    fullName: "Andorra",
    latLon: "",
    parentLocations: "No locations found",
    digram: "AN",
    trigram: "AND",
    planningApprovalSteps: "",
    approvalSteps: ""
  },
  right: {
    search: "Location Loser",
    type: "Point location",
    name: "Merge Location Loser",
    fullName: "Merge Location Loser -46.4035948,51.69093",
    latLon: "-46.4035948, 51.69093",
    parentLocations: "Name Type\nFrench Southern Territories Country",
    planningApprovalSteps:
      "Location planning approval for merge loser\nPerson Position\nCIV REINTON, Reina EF 2.2 Advisor C",
    approvalSteps:
      "Location publication approval for merge loser\nPerson Position\nCIV ERINSON, Erin EF 2.2 Advisor D"
  }
}

describe("Merge locations page", () => {
  it("Should be able to select to incompatible locations to merge", async() => {
    await MergeLocations.open()
    await (await MergeLocations.getTitle()).waitForExist()
    await (await MergeLocations.getTitle()).waitForDisplayed()

    await (
      await MergeLocations.getLeftLocationField()
    ).setValue(EXAMPLE_LOCATIONS.leftCountry.search)
    await MergeLocations.waitForAdvancedSelectLoading(
      EXAMPLE_LOCATIONS.leftCountry.fullName
    )
    await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.leftCountry.name,
      "left",
      "Name"
    )

    expect(
      await (await MergeLocations.getColumnContent("left", "Name")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.leftCountry.name)
    expect(
      await (await MergeLocations.getColumnContent("left", "Type")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.leftCountry.type)

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
      "right",
      "Name"
    )

    expect(
      await (await MergeLocations.getColumnContent("right", "Name")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.right.name)
    expect(
      await (await MergeLocations.getColumnContent("right", "Type")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.right.type)
    // should show an alert
    await MergeLocations.waitForAlertWarningToLoad()
    expect(await (await MergeLocations.getAlertWarning()).getText()).to.eq(
      "Locations you are about to merge have different types. " +
        "Before continuing, please be aware that this merge operation might cause problems in the future!"
    )
  })

  it("Should be able to select all fields from left location", async() => {
    await (await MergeLocations.getUseAllButton("left")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.leftCountry.name,
      "mid",
      "Name"
    )

    expect(
      await (await MergeLocations.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.leftCountry.name)
    expect(
      await (await MergeLocations.getColumnContent("mid", "Type")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.leftCountry.type)
    // the digram and trigram fields should now be visible, and selected for the merged location
    expect(
      await (
        await MergeLocations.getColumnContent("left", "Alpha-2 code")
      ).getText()
    ).to.eq(EXAMPLE_LOCATIONS.leftCountry.digram)
    expect(
      await (
        await MergeLocations.getColumnContent("left", "Alpha-3 code")
      ).getText()
    ).to.eq(EXAMPLE_LOCATIONS.leftCountry.trigram)
    expect(
      await (
        await MergeLocations.getColumnContent("mid", "Alpha-2 code")
      ).getText()
    ).to.eq(EXAMPLE_LOCATIONS.leftCountry.digram)
    expect(
      await (
        await MergeLocations.getColumnContent("mid", "Alpha-3 code")
      ).getText()
    ).to.eq(EXAMPLE_LOCATIONS.leftCountry.trigram)
    expect(
      await (
        await MergeLocations.getColumnContent("right", "Alpha-2 code")
      ).getText()
    ).to.eq("")
    expect(
      await (
        await MergeLocations.getColumnContent("right", "Alpha-3 code")
      ).getText()
    ).to.eq("")
  })

  it("Should be able to select all fields from right location", async() => {
    await (await MergeLocations.getUseAllButton("right")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.right.name,
      "mid",
      "Name"
    )

    expect(
      await (await MergeLocations.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.right.name)
    expect(
      await (await MergeLocations.getColumnContent("mid", "Type")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.right.type)
    // the digram and trigram fields should now no longer be visible
    /* eslint-disable no-unused-expressions */
    expect(
      await (
        await MergeLocations.getColumnContent("left", "Alpha-2 code")
      ).isExisting()
    ).to.be.false
    expect(
      await (
        await MergeLocations.getColumnContent("left", "Alpha-3 code")
      ).isExisting()
    ).to.be.false
    expect(
      await (
        await MergeLocations.getColumnContent("mid", "Alpha-2 code")
      ).isExisting()
    ).to.be.false
    expect(
      await (
        await MergeLocations.getColumnContent("mid", "Alpha-3 code")
      ).isExisting()
    ).to.be.false
    expect(
      await (
        await MergeLocations.getColumnContent("right", "Alpha-2 code")
      ).isExisting()
    ).to.be.false
    expect(
      await (
        await MergeLocations.getColumnContent("right", "Alpha-3 code")
      ).isExisting()
    ).to.be.false
    /* eslint-enable no-unused-expressions */
  })

  it("Should be able to select to compatible locations to merge", async() => {
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
      "left",
      "Name"
    )

    expect(
      await (await MergeLocations.getColumnContent("left", "Name")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.left.name)
    expect(
      await (await MergeLocations.getColumnContent("left", "Type")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.left.type)
    // alert should be gone now
    // eslint-disable-next-line no-unused-expressions
    expect(await (await MergeLocations.getAlertWarning()).isExisting()).to.be
      .false
  })

  it("Should be able to select from both left and right side.", async() => {
    await (await MergeLocations.getSelectButton("left", "Name")).click()
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.left.name,
      "mid",
      "Name"
    )
    expect(
      await (await MergeLocations.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_LOCATIONS.left.name)

    await (
      await MergeLocations.getSelectButton("left", "Latitude, Longitude")
    ).click()
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.left.latLon,
      "mid",
      "Latitude, Longitude"
    )
    expect(
      await (
        await MergeLocations.getColumnContent("mid", "Latitude, Longitude")
      ).getText()
    ).to.equal(EXAMPLE_LOCATIONS.left.latLon)

    await (
      await MergeLocations.getSelectButton("left", "Parent locations")
    ).click()
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.left.parentLocations,
      "mid",
      "Parent locations"
    )
    expect(
      await (
        await MergeLocations.getColumnContent("mid", "Parent locations")
      ).getText()
    ).to.equal(EXAMPLE_LOCATIONS.left.parentLocations)

    await (
      await MergeLocations.getSelectButton("right", "Planning Approval Steps")
    ).click()
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.right.planningApprovalSteps,
      "mid",
      "Planning Approval Steps"
    )
    expect(
      await (
        await MergeLocations.getColumnContent("mid", "Planning Approval Steps")
      ).getText()
    ).to.equal(EXAMPLE_LOCATIONS.right.planningApprovalSteps)

    await (
      await MergeLocations.getSelectButton("left", "Approval Steps")
    ).click()
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.left.approvalSteps,
      "mid",
      "Approval Steps"
    )
    expect(
      await (
        await MergeLocations.getColumnContent("mid", "Approval Steps")
      ).getText()
    ).to.equal(EXAMPLE_LOCATIONS.left.approvalSteps)
  })

  it("Should be able to merge both locations", async() => {
    await (await MergeLocations.getUseAllButton("left")).click()
    await browser.pause(500) // wait for the rendering of custom fields
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.left.name,
      "mid",
      "Name"
    )

    await (
      await MergeLocations.getSelectButton("right", "Planning Approval Steps")
    ).click()
    await MergeLocations.waitForColumnToChange(
      EXAMPLE_LOCATIONS.right.planningApprovalSteps,
      "mid",
      "Planning Approval Steps"
    )

    await (await MergeLocations.getMergeLocationsButton()).click()

    await MergeLocations.waitForSuccessAlert()

    // Check the results of the merge
    expect(await (await MergeLocations.getField("name")).getText()).to.equal(
      EXAMPLE_LOCATIONS.left.name
    )
    expect(
      await (await MergeLocations.getField("location")).getText()
    ).to.equal(EXAMPLE_LOCATIONS.left.latLon)
    expect(
      await (await MergeLocations.getField("parentLocations")).getText()
    ).to.equal(EXAMPLE_LOCATIONS.left.parentLocations)
    expect(
      await (await MergeLocations.getFieldset("planningApprovals")).getText()
    ).to.equal(`Step 1: ${EXAMPLE_LOCATIONS.right.planningApprovalSteps}`)
    expect(
      await (await MergeLocations.getFieldset("approvals")).getText()
    ).to.equal(`Step 1: ${EXAMPLE_LOCATIONS.left.approvalSteps}`)
  })
})
