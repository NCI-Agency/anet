import { expect, test } from "@playwright/test"
import MergeLocationsPageObject from "../pages/mergeLocations.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, MergeLocations
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    MergeLocations = new MergeLocationsPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const EXAMPLE_LOCATIONS = {
    childLeft: {
      search: "Kabul Hospital",
      name: "Kabul Hospital",
      fullName: "Kabul Hospital"
    },
    parentRight: {
      search: "Afghanistan",
      name: "Afghanistan",
      fullName: "Afghanistan"
    },
    left: {
      search: "Location Winner",
      uuid: "64795e03-ba83-4bc3-b647-d37fcb1c0694",
      name: "Merge Location Winner",
      type: "Point location",
      fullName: "Merge Location Winner",
      latLon: "38.58809, -28.71611",
      geoJson: "No shape defined",
      status: "ACTIVE",
      parentLocations: "Name Type\nPortugal\nCountry",
      planningApprovalSteps:
        "Step 1: Location planning approval for merge winner\nPerson Position\nOF-2 ELIZAWELL, Elizabeth\nEF 1.1 Advisor A",
      approvalSteps:
        "Step 1: Location publication approval for merge winner\nPerson Position\nUnfilled\nEF 1.1 Advisor B"
    },
    leftCountry: {
      search: "Andorra",
      name: "Andorra",
      type: "Country",
      fullName: "Andorra",
      latLon: "",
      geoJson: "No shape defined",
      status: "ACTIVE",
      parentLocations: "No locations found",
      digram: "AN",
      trigram: "AND",
      planningApprovalSteps: "",
      approvalSteps: ""
    },
    right: {
      search: "Location Loser",
      uuid: "4694bb3c-275a-4e74-9197-033e8e9c53ed",
      name: "Merge Location Loser",
      type: "Point location",
      fullName: "Merge Location Loser",
      latLon: "-46.4035948, 51.69093",
      geoJson: "No shape defined",
      status: "ACTIVE",
      parentLocations: "Name Type\nFrench Southern Territories\nCountry",
      planningApprovalSteps:
        "Step 1: Location planning approval for merge loser\nPerson Position\nCIV Reina Reinton\nEF 2.2 Advisor C",
      approvalSteps:
        "Step 1: Location publication approval for merge loser\nPerson Position\nCIV Erin Erinson\nEF 2.2 Advisor D"
    }
  }
  test.describe("Merge locations error", () => {
    test("Should show an error when merging locations would create a loop", async () => {
      await MergeLocations.openPage()
      await (
        await MergeLocations.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (await MergeLocations.getLeftLocationField()).click()
      await (
        await MergeLocations.getLeftLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.childLeft.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.childLeft.fullName
      )
      await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.childLeft.name,
        "left",
        "Name"
      )
      await (await MergeLocations.getRightLocationField()).click()
      await (
        await MergeLocations.getRightLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.parentRight.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.parentRight.fullName
      )
      await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.parentRight.name,
        "right",
        "Name"
      )
      await (await MergeLocations.getUseAllButton("left")).click()
      await (await MergeLocations.getMergeLocationsButton()).click()
      await MergeLocations.waitForAlertDangerToLoad()
      await expect(await MergeLocations.getAlertDanger()).toHaveText(
        "Location can not be its own (grand…)parent",
        {
          useInnerText: true
        }
      )
      // attempt to leave when both locations are selected, should show warning
      await MergeLocations.clickLogo()
      await expect(await MergeLocations.getModalDialog()).not.toHaveCount(0)
      await (await page.locator(".btn-danger").first()).click()
      await MergeLocations.logout()
    })
  })
  test.describe("Merge locations page", () => {
    test("Should display a warning when leaving the page with unsaved changes", async () => {
      await MergeLocations.openPage()
      await (
        await MergeLocations.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (
        await MergeLocations.getLeftLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.leftCountry.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.leftCountry.fullName
      )
      await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
      // attempt to leave when only one location is selected, should allow to leave
      await MergeLocations.clickLogo()
      await expect(await MergeLocations.getModalDialog()).toHaveCount(0)
      await MergeLocations.openPage()
      await (
        await MergeLocations.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (
        await MergeLocations.getLeftLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.leftCountry.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.leftCountry.fullName
      )
      await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
      await (
        await MergeLocations.getRightLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.right.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.right.fullName
      )
      await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
      // attempt to leave when both locations are selected, should show warning
      await MergeLocations.clickLogo()
      await expect(await MergeLocations.getModalDialog()).not.toHaveCount(0)
      await (await page.locator(".btn-danger").first()).click()
      await MergeLocations.logout()
    })
    test("Should display fields values of the left location", async () => {
      await MergeLocations.openPage()
      await (
        await MergeLocations.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (
        await MergeLocations.getLeftLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.leftCountry.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.leftCountry.fullName
      )
      await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from left side.
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.leftCountry.name,
        "left",
        "Name"
      )
      await expect(
        await MergeLocations.getColumnContent("left", "Name")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.name, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("left", "Type")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.type, {
        useInnerText: true
      })
    })
    test("Should not allow to select the same location", async () => {
      await (
        await MergeLocations.getRightLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.leftCountry.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.leftCountry.fullName
      )
      await expect(
        await MergeLocations.getFirstItemRadioButtonFromAdvancedSelect()
      ).toHaveCount(0)
    })
    test("Should be able to select to incompatible locations to merge", async () => {
      await (
        await MergeLocations.getRightLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.right.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.right.fullName
      )
      await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from right side.
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.right.uuid,
        "right",
        "UUID"
      )
      await expect(
        await MergeLocations.getColumnContent("right", "UUID")
      ).toHaveText(EXAMPLE_LOCATIONS.right.uuid, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("right", "Name")
      ).toHaveText(EXAMPLE_LOCATIONS.right.name, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("right", "Type")
      ).toHaveText(EXAMPLE_LOCATIONS.right.type, {
        useInnerText: true
      })
      // should show an alert
      await MergeLocations.waitForAlertWarningToLoad()
      await expect(await MergeLocations.getAlertWarning()).toHaveText(
        "Locations you are about to merge have different types. " +
          "Before continuing, please be aware that this merge operation might cause problems in the future!",
        {
          useInnerText: true
        }
      )
    })
    test("Should autoMerge some identical fields from both locations", async () => {
      await expect(
        await MergeLocations.getColumnContent("mid", "Status")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.status, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Status")
      ).toHaveText(EXAMPLE_LOCATIONS.right.status, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Shape (GeoJSON)")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.geoJson, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Shape (GeoJSON)")
      ).toHaveText(EXAMPLE_LOCATIONS.right.geoJson, {
        useInnerText: true
      })
    })
    test("Should be able to select all fields from left location", async () => {
      await (await MergeLocations.getUseAllButton("left")).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from left side.
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.leftCountry.name,
        "mid",
        "Name"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "Name")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.name, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Type")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.type, {
        useInnerText: true
      })

      // the digram and trigram fields should now be visible
      await expect(
        await MergeLocations.getColumnContent("left", "Alpha-2 code")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.digram, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("left", "Alpha-3 code")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.trigram, {
        useInnerText: true
      })

      // and should be selectable for the merged location
      await (
        await MergeLocations.getSelectButton("left", "Alpha-2 code")
      ).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.leftCountry.digram,
        "mid",
        "Alpha-2 code"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "Alpha-2 code")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.digram, {
        useInnerText: true
      })
      await (
        await MergeLocations.getSelectButton("left", "Alpha-3 code")
      ).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.leftCountry.trigram,
        "mid",
        "Alpha-3 code"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "Alpha-3 code")
      ).toHaveText(EXAMPLE_LOCATIONS.leftCountry.trigram, {
        useInnerText: true
      })

      // on the right side they should be empty
      await expect(
        await MergeLocations.getColumnContent("right", "Alpha-2 code")
      ).toHaveText("", {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("right", "Alpha-3 code")
      ).toHaveText("", {
        useInnerText: true
      })
    })
    test("Should be able to select all fields from right location", async () => {
      await (await MergeLocations.getUseAllButton("right")).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from right side.
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.right.uuid,
        "mid",
        "UUID"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "UUID")
      ).toHaveText(EXAMPLE_LOCATIONS.right.uuid, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Name")
      ).toHaveText(EXAMPLE_LOCATIONS.right.name, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Type")
      ).toHaveText(EXAMPLE_LOCATIONS.right.type, {
        useInnerText: true
      })
      // the digram and trigram fields should now no longer be visible

      await expect(
        await MergeLocations.getColumnContent("left", "Alpha-2 code")
      ).toHaveCount(0)
      await expect(
        await MergeLocations.getColumnContent("left", "Alpha-3 code")
      ).toHaveCount(0)
      await expect(
        await MergeLocations.getColumnContent("mid", "Alpha-2 code")
      ).toHaveCount(0)
      await expect(
        await MergeLocations.getColumnContent("mid", "Alpha-3 code")
      ).toHaveCount(0)
      await expect(
        await MergeLocations.getColumnContent("right", "Alpha-2 code")
      ).toHaveCount(0)
      await expect(
        await MergeLocations.getColumnContent("right", "Alpha-3 code")
      ).toHaveCount(0)
    })
    test("Should be able to select to compatible locations to merge", async () => {
      await (
        await MergeLocations.getLeftLocationField()
      ).fill(String(EXAMPLE_LOCATIONS.left.search))
      await MergeLocations.waitForAdvancedSelectLoading(
        EXAMPLE_LOCATIONS.left.fullName
      )
      await (await MergeLocations.getFirstItemFromAdvancedSelect()).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from left side.
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.left.uuid,
        "left",
        "UUID"
      )
      await expect(
        await MergeLocations.getColumnContent("left", "UUID")
      ).toHaveText(EXAMPLE_LOCATIONS.left.uuid, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("left", "Name")
      ).toHaveText(EXAMPLE_LOCATIONS.left.name, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("left", "Type")
      ).toHaveText(EXAMPLE_LOCATIONS.left.type, {
        useInnerText: true
      })
      // alert should be gone now

      await expect(await MergeLocations.getAlertWarning()).toHaveCount(0)
    })
    test("Should autoMerge identical fields after replacing the left location", async () => {
      await expect(
        await MergeLocations.getColumnContent("mid", "Type")
      ).toHaveText(EXAMPLE_LOCATIONS.left.type, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Type")
      ).toHaveText(EXAMPLE_LOCATIONS.right.type, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Status")
      ).toHaveText(EXAMPLE_LOCATIONS.left.status, {
        useInnerText: true
      })
      await expect(
        await MergeLocations.getColumnContent("mid", "Status")
      ).toHaveText(EXAMPLE_LOCATIONS.right.status, {
        useInnerText: true
      })
    })
    test("Should be able to select from both left and right side", async () => {
      await (await MergeLocations.getSelectButton("left", "UUID")).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.left.uuid,
        "mid",
        "UUID"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "UUID")
      ).toHaveText(EXAMPLE_LOCATIONS.left.uuid, {
        useInnerText: true
      })
      await (await MergeLocations.getSelectButton("left", "Name")).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.left.name,
        "mid",
        "Name"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "Name")
      ).toHaveText(EXAMPLE_LOCATIONS.left.name, {
        useInnerText: true
      })
      await (
        await MergeLocations.getSelectButton("left", "Latitude, Longitude")
      ).click()
      await MergeLocations.waitForColumnToStartWith(
        EXAMPLE_LOCATIONS.left.latLon,
        "mid",
        "Latitude, Longitude"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "Latitude, Longitude")
      ).toContainText(EXAMPLE_LOCATIONS.left.latLon, {
        useInnerText: true
      })
      await (
        await MergeLocations.getSelectButton("left", "Parent locations")
      ).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.left.parentLocations,
        "mid",
        "Parent locations"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "Parent locations")
      ).toHaveText(EXAMPLE_LOCATIONS.left.parentLocations, {
        useInnerText: true
      })
      await (
        await MergeLocations.getSelectButton("right", "Planning Approval Steps")
      ).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.right.planningApprovalSteps,
        "mid",
        "Planning Approval Steps"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "Planning Approval Steps")
      ).toHaveText(EXAMPLE_LOCATIONS.right.planningApprovalSteps, {
        useInnerText: true
      })
      await (
        await MergeLocations.getSelectButton("left", "Approval Steps")
      ).click()
      await MergeLocations.waitForColumnToChange(
        EXAMPLE_LOCATIONS.left.approvalSteps,
        "mid",
        "Approval Steps"
      )
      await expect(
        await MergeLocations.getColumnContent("mid", "Approval Steps")
      ).toHaveText(EXAMPLE_LOCATIONS.left.approvalSteps, {
        useInnerText: true
      })
    })
    test("Should be able to merge both locations", async () => {
      await (await MergeLocations.getUseAllButton("left")).click()
      // wait for the rendering of custom fields
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
      await expect(await MergeLocations.getField("name")).toHaveText(
        EXAMPLE_LOCATIONS.left.name,
        {
          useInnerText: true
        }
      )
      await expect(await MergeLocations.getField("location")).toHaveText(
        EXAMPLE_LOCATIONS.left.latLon,
        {
          useInnerText: true
        }
      )
      await expect(await MergeLocations.getField("parentLocations")).toHaveText(
        EXAMPLE_LOCATIONS.left.parentLocations,
        {
          useInnerText: true
        }
      )
      await expect(
        await MergeLocations.getFieldset("planningApprovals")
      ).toHaveText(EXAMPLE_LOCATIONS.right.planningApprovalSteps, {
        useInnerText: true
      })
      await expect(await MergeLocations.getFieldset("approvals")).toHaveText(
        EXAMPLE_LOCATIONS.left.approvalSteps,
        {
          useInnerText: true
        }
      )
    })
  })
})
