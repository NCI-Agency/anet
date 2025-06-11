import { expect } from "chai"
import MergeOrganizations from "../pages/mergeOrganizations.page"

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
    shortName: "Merge Org 1",
    longName: "Long Merge 1 Name",
    status: "ACTIVE",
    displayedName: "Merge Org 1 | Long Merge 1 Name",
    avatarImg: `${IMG_PATH}/e32b6c9d-45d5-41db-b45a-123ed1975602`,
    parentOrg: "EF 1 | Planning Programming, Budgeting and Execution"
  },
  validRight: {
    search: "Merge Org 2",
    shortName: "Merge Org 2",
    longName: "Long Merge 2 Name",
    status: "ACTIVE",
    displayedName: "Merge Org 2 | Long Merge 2 Name",
    avatarImg: `${IMG_PATH}/5408075e-9126-4201-a631-f72ffe8b54e5`,
    parentOrg: "EF 1 | Planning Programming, Budgeting and Execution"
  }
}

describe("Merge organizations error", () => {
  it("Should show an error when merging organizations would create a loop", async() => {
    await MergeOrganizations.openPage()
    await (await MergeOrganizations.getTitle()).waitForExist()
    await (await MergeOrganizations.getTitle()).waitForDisplayed()

    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.childLeft.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.childLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.childLeft.shortName,
      "left",
      "Name"
    )

    await (await MergeOrganizations.getRightOrganizationField()).click()
    await (
      await MergeOrganizations.getRightOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.parentRight.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.parentRight.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.parentRight.shortName,
      "right",
      "Name"
    )

    await (await MergeOrganizations.getUseAllButton("left")).click()
    await browser.pause(500)
    await (await MergeOrganizations.getMergeOrganizationsButton()).click()
    await MergeOrganizations.waitForAlertDangerToLoad()
    expect(await (await MergeOrganizations.getAlertDanger()).getText()).to.eq(
      "Organization can not be its own (grand…)parent"
    )
  })
})

describe("Merge organizations page", () => {
  it("Should display a warning when leaving the page with unsaved changes", async() => {
    await MergeOrganizations.openPage()
    await (await MergeOrganizations.getTitle()).waitForExist()
    await (await MergeOrganizations.getTitle()).waitForDisplayed()
    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.validLeft.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    // attempt to leave when only one org is selected, should allow to leave
    await (await $("#anet-logo")).click()
    // eslint-disable-next-line no-unused-expressions
    expect(await (await $(".modal-dialog")).isExisting()).to.be.false

    await MergeOrganizations.openPage()
    await (await MergeOrganizations.getTitle()).waitForExist()
    await (await MergeOrganizations.getTitle()).waitForDisplayed()
    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.validLeft.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await (await MergeOrganizations.getRightOrganizationField()).click()
    await (
      await MergeOrganizations.getRightOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.validRight.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validRight.displayedName
    )
    // attempt to leave when both orgs are selected, should show warning
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await (await $("#anet-logo")).click()
    const modalDialog = await $(".modal-dialog")
    // eslint-disable-next-line no-unused-expressions
    expect(await modalDialog.isExisting()).to.be.true
    await $(".btn-danger").click()
  })
  it("Should display field values of the left organization", async() => {
    await MergeOrganizations.openPage()
    await (await MergeOrganizations.getTitle()).waitForExist()
    await (await MergeOrganizations.getTitle()).waitForDisplayed()

    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.validLeft.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validLeft.shortName,
      "left",
      "Name"
    )
    expect(
      await (
        await MergeOrganizations.getColumnContent("left", "Name")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validLeft.shortName)
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("left", "Avatar")
    ).$("img")
    expect(await avatarImg.getAttribute("src")).to.eq(
      EXAMPLE_ORGANIZATIONS.validLeft.avatarImg
    )
    expect(
      await (
        await MergeOrganizations.getColumnContent("left", "Parent Organization")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validLeft.parentOrg)
  })

  it("Should not allow to select the same organizations", async() => {
    await (
      await MergeOrganizations.getRightOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.validLeft.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()

    await (
      await MergeOrganizations.getSameOrganizationsToast()
    ).waitForDisplayed()
  })

  it("Should display field values of the right organization", async() => {
    await (await MergeOrganizations.getRightOrganizationField()).click()
    await (
      await MergeOrganizations.getRightOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.validRight.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validRight.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validRight.shortName,
      "right",
      "Name"
    )
    expect(
      await (
        await MergeOrganizations.getColumnContent("right", "Name")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validRight.shortName)
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("right", "Avatar")
    ).$("img")
    expect(await avatarImg.getAttribute("src")).to.eq(
      EXAMPLE_ORGANIZATIONS.validRight.avatarImg
    )
    expect(
      await (
        await MergeOrganizations.getColumnContent(
          "right",
          "Parent Organization"
        )
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validRight.parentOrg)
  })

  it("Should autoMerge some identical fields from both organizations", async() => {
    expect(
      await (
        await MergeOrganizations.getColumnContent("mid", "Parent Organization")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validLeft.parentOrg)
    expect(
      await (
        await MergeOrganizations.getColumnContent("mid", "Parent Organization")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validRight.parentOrg)

    expect(
      await (
        await MergeOrganizations.getColumnContent("mid", "Status")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validLeft.status)
    expect(
      await (
        await MergeOrganizations.getColumnContent("mid", "Status")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validRight.status)
  })

  it("Should be able to select all fields from left organization", async() => {
    await (await MergeOrganizations.getUseAllButton("left")).click()
    await browser.pause(500)

    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validLeft.shortName,
      "mid",
      "Name"
    )
    expect(
      await (await MergeOrganizations.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validLeft.shortName)
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("mid", "Avatar")
    ).$("img")
    expect(await avatarImg.getAttribute("src")).to.eq(
      EXAMPLE_ORGANIZATIONS.validLeft.avatarImg
    )
  })

  it("Should be able to select all fields from right organization", async() => {
    await (await MergeOrganizations.getUseAllButton("right")).click()
    await browser.pause(500)

    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validRight.shortName,
      "mid",
      "Name"
    )
    expect(
      await (await MergeOrganizations.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validRight.shortName)
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("mid", "Avatar")
    ).$("img")
    expect(await avatarImg.getAttribute("src")).to.eq(
      EXAMPLE_ORGANIZATIONS.validRight.avatarImg
    )
  })

  it("Should be able to select from both left and right side", async() => {
    await (await MergeOrganizations.getLeftOrganizationField()).click()
    await (
      await MergeOrganizations.getLeftOrganizationField()
    ).setValue(EXAMPLE_ORGANIZATIONS.validLeft.search)
    await MergeOrganizations.waitForAdvancedSelectLoading(
      EXAMPLE_ORGANIZATIONS.validLeft.displayedName
    )
    await (await MergeOrganizations.getFirstItemFromAdvancedSelect()).click()
    await browser.pause(500)

    await (await MergeOrganizations.getSelectButton("left", "Name")).click()
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validLeft.shortName,
      "mid",
      "Name"
    )
    expect(
      await (await MergeOrganizations.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validLeft.shortName)

    await (await MergeOrganizations.getSelectButton("left", "Avatar")).click()
    await MergeOrganizations.waitForColumnToChange("", "mid", "Avatar")
    const avatarImg = await (
      await MergeOrganizations.getColumnContent("mid", "Avatar")
    ).$("img")
    expect(await avatarImg.getAttribute("src")).to.eq(
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
    expect(
      await (
        await MergeOrganizations.getColumnContent("mid", "Description")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validRight.longName)
  })

  it("Should not be able to click merge button when some fields are empty", async() => {
    // eslint-disable-next-line no-unused-expressions
    expect(
      await (
        await MergeOrganizations.getMergeOrganizationsButton()
      ).isClickable()
    ).to.be.false
  })

  it("Should be able to merge both organizations when winner is left organization", async() => {
    await (await MergeOrganizations.getUseAllButton("left")).click()
    await browser.pause(500)
    await (await MergeOrganizations.getMergeOrganizationsButton()).click()
    await MergeOrganizations.waitForSuccessAlert()
  })
})
