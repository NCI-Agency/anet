import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import MergeOrganizations from "../pages/mergeOrganizations.page.js"
import { currentPage, isClickable, test, waitFor } from "../support.js"

const IMG_PATH = "/api/attachment/view"
const EXAMPLE_ORGANIZATIONS = {
  childLeft: {
    search: "EF 1.1",
    shortName: "EF 1.1",
    displayedName: "EF 1.1"
  },
  parentRight: {
    search: "EF 1 Planning",
    shortName: "EF 1",
    displayedName: "EF 1 | Planning Programming, Budgeting and Execution"
  },
  validLeft: {
    search: "Merge Org 1",
    uuid: "381d5435-8852-45d2-91b1-530560ca9d8c",
    shortName: "Merge Org 1",
    longName: "Long Merge 1 Name",
    status: "ACTIVE",
    displayedName: "Merge Org 1 | Long Merge 1 Name",
    avatarImg: `${IMG_PATH}/e32b6c9d-45d5-41db-b45a-123ed1975602`,
    parentOrg: "EF 1 | Planning Programming, Budgeting and Execution"
  },
  validRight: {
    search: "Merge Org 2",
    uuid: "e706f443-7d4d-4356-82bc-1456f55e3d75",
    shortName: "Merge Org 2",
    longName: "Long Merge 2 Name",
    status: "ACTIVE",
    displayedName: "Merge Org 2 | Long Merge 2 Name",
    avatarImg: `${IMG_PATH}/5408075e-9126-4201-a631-f72ffe8b54e5`,
    parentOrg: "EF 1 | Planning Programming, Budgeting and Execution"
  }
}
test.describe("Merge organizations error", () => {
  test("Should show an error when merging organizations would create a loop", async () => {
    await MergeOrganizations.openPage()
    await waitFor(await MergeOrganizations.getTitle(), "attached")
    await waitFor(await MergeOrganizations.getTitle(), "visible")
    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.childLeft.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.childLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.childLeft.shortName,
      "left",
      "Name"
    )
    await (await MergeOrganizations.getRightOrganizationField()).click()
    await (
      await MergeOrganizations.getRightOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.parentRight.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.parentRight.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.parentRight.shortName,
      "right",
      "Name"
    )
    await (await MergeOrganizations.getUseAllButton("left")).click()
    await (await MergeOrganizations.getMergeOrganizationsButton()).click()
    await MergeOrganizations.waitForAlertDangerToLoad()
    await pwExpect(await MergeOrganizations.getAlertDanger()).toHaveText(
      "Organization can not be its own (grand…)parent",
      {
        useInnerText: true
      }
    )
    // attempt to leave when both locations are selected, should show warning
    await MergeOrganizations.clickLogo()
    await pwExpect(await MergeOrganizations.getModalDialog()).not.toHaveCount(0)
    await (await currentPage().locator(".btn-danger").first()).click()
    await MergeOrganizations.logout()
  })
})
test.describe("Merge organizations page", () => {
  test("Should display a warning when leaving the page with unsaved changes", async () => {
    await MergeOrganizations.openPage()
    await waitFor(await MergeOrganizations.getTitle(), "attached")
    await waitFor(await MergeOrganizations.getTitle(), "visible")
    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.validLeft.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    // attempt to leave when only one org is selected, should allow to leave
    await MergeOrganizations.clickLogo()
    await pwExpect(await MergeOrganizations.getModalDialog()).toHaveCount(0)
    await MergeOrganizations.openPage()
    await waitFor(await MergeOrganizations.getTitle(), "attached")
    await waitFor(await MergeOrganizations.getTitle(), "visible")
    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.validLeft.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await (await MergeOrganizations.getRightOrganizationField()).click()
    await (
      await MergeOrganizations.getRightOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.validRight.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validRight.displayedName
    )
    // attempt to leave when both orgs are selected, should show warning
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await MergeOrganizations.clickLogo()
    await pwExpect(await MergeOrganizations.getModalDialog()).not.toHaveCount(0)
    await (await currentPage().locator(".btn-danger").first()).click()
    await MergeOrganizations.logout()
  })
  test("Should display field values of the left organization", async () => {
    await MergeOrganizations.openPage()
    await waitFor(await MergeOrganizations.getTitle(), "attached")
    await waitFor(await MergeOrganizations.getTitle(), "visible")
    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.validLeft.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from left side.
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validLeft.uuid,
      "left",
      "UUID"
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("left", "UUID")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.uuid, {
      useInnerText: true
    })
    await pwExpect(
      await MergeOrganizations.getColumnContent("left", "Name")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.shortName, {
      useInnerText: true
    })
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("left", "Avatar")
    )
      .locator("img")
      .first()
    await pwExpect(avatarImg).toHaveAttribute(
      "src",
      EXAMPLE_ORGANIZATIONS.validLeft.avatarImg
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("left", "Parent Organization")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.parentOrg, {
      useInnerText: true
    })
  })
  test("Should not allow to select the same organizations", async () => {
    await (
      await MergeOrganizations.getRightOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.validLeft.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await pwExpect(
      await MergeOrganizations.getFirstItemRadioButtonFromAdvancedSelect()
    ).toHaveCount(0)
  })
  test("Should display field values of the right organization", async () => {
    await (await MergeOrganizations.getRightOrganizationField()).click()
    await (
      await MergeOrganizations.getRightOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.validRight.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validRight.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from right side.
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validRight.uuid,
      "right",
      "UUID"
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("right", "UUID")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validRight.uuid, {
      useInnerText: true
    })
    await pwExpect(
      await MergeOrganizations.getColumnContent("right", "Name")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validRight.shortName, {
      useInnerText: true
    })
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("right", "Avatar")
    )
      .locator("img")
      .first()
    await pwExpect(avatarImg).toHaveAttribute(
      "src",
      EXAMPLE_ORGANIZATIONS.validRight.avatarImg
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("right", "Parent Organization")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validRight.parentOrg, {
      useInnerText: true
    })
  })
  test("Should autoMerge some identical fields from both organizations", async () => {
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "Parent Organization")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.parentOrg, {
      useInnerText: true
    })
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "Parent Organization")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validRight.parentOrg, {
      useInnerText: true
    })
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.status, {
      useInnerText: true
    })
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "Status")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validRight.status, {
      useInnerText: true
    })
  })
  test("Should be able to select all fields from left organization", async () => {
    await (await MergeOrganizations.getUseAllButton("left")).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from left side.
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validLeft.uuid,
      "mid",
      "UUID"
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.uuid, {
      useInnerText: true
    })
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "Name")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.shortName, {
      useInnerText: true
    })
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("mid", "Avatar")
    )
      .locator("img")
      .first()
    await pwExpect(avatarImg).toHaveAttribute(
      "src",
      EXAMPLE_ORGANIZATIONS.validLeft.avatarImg
    )
  })
  test("Should be able to select all fields from right organization", async () => {
    await (await MergeOrganizations.getUseAllButton("right")).click()
    // wait for the rendering of custom fields
    // Check if the fields displayed properly after selecting from right side.
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validRight.uuid,
      "mid",
      "UUID"
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validRight.uuid, {
      useInnerText: true
    })
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "Name")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validRight.shortName, {
      useInnerText: true
    })
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("mid", "Avatar")
    )
      .locator("img")
      .first()
    await pwExpect(avatarImg).toHaveAttribute(
      "src",
      EXAMPLE_ORGANIZATIONS.validRight.avatarImg
    )
  })
  test("Should be able to select from both left and right side", async () => {
    // Perform a fresh search to clear the merge state
    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).fill(String(EXAMPLE_ORGANIZATIONS.validLeft.search))
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await (await MergeOrganizations.getSelectButton("left", "UUID")).click()
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validLeft.uuid,
      "mid",
      "UUID"
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "UUID")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.uuid, {
      useInnerText: true
    })
    await (await MergeOrganizations.getSelectButton("left", "Name")).click()
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validLeft.shortName,
      "mid",
      "Name"
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "Name")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validLeft.shortName, {
      useInnerText: true
    })
    await (await MergeOrganizations.getSelectButton("left", "Avatar")).click()
    await MergeOrganizations.waitForColumnToChange("", "mid", "Avatar")
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("mid", "Avatar")
    )
      .locator("img")
      .first()
    await pwExpect(avatarImg).toHaveAttribute(
      "src",
      EXAMPLE_ORGANIZATIONS.validLeft.avatarImg
    )
    await (
      await MergeOrganizations.getSelectButton("right", "Description")
    ).click()
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validRight.longName,
      "mid",
      "Description"
    )
    await pwExpect(
      await MergeOrganizations.getColumnContent("mid", "Description")
    ).toHaveText(EXAMPLE_ORGANIZATIONS.validRight.longName, {
      useInnerText: true
    })
  })
  test("Should not be able to click merge button when some fields are empty", async () => {
    // eslint-disable-next-line no-unused-expressions
    expect(
      await isClickable(await MergeOrganizations.getMergeOrganizationsButton())
    ).to.be.false
  })
  test("Should be able to merge both organizations when winner is left organization", async () => {
    await (await MergeOrganizations.getUseAllButton("left")).click()
    await (await MergeOrganizations.getMergeOrganizationsButton()).click()
    await MergeOrganizations.waitForSuccessAlert()
  })
})
