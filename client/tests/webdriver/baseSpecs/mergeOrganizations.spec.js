import { expect } from "chai"
import MergeOrganizations from "../pages/mergeOrganizations.page"

const EXAMPLE_ORGANIZATIONS = {
  validLeft: {
    search: "Merge Org 1",
    shortName: "Merge Org 1",
    displayedName: "Merge Org 1 | Long Merge 1 Name",
    parentOrg: "EF 1 | Planning Programming, Budgeting and Execution"
  },
  validRight: {
    search: "Merge Org 2",
    shortName: "Merge Org 2",
    displayedName: "Merge Org 2 | Long Merge 2 Name",
    parentOrg: "EF 1 | Planning Programming, Budgeting and Execution"
  }
}

describe("Merge organizations page", () => {
  it("Should display field values of the left organization", async() => {
    await MergeOrganizations.open()
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
    await (await MergeOrganizations.getTitle()).waitForExist()
    await (await MergeOrganizations.getTitle()).waitForDisplayed()

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
    expect(
      await (
        await MergeOrganizations.getColumnContent(
          "right",
          "Parent Organization"
        )
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validRight.parentOrg)
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
    expect(
      await (
        await MergeOrganizations.getColumnContent("mid", "Parent Organization")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validLeft.parentOrg)
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
    expect(
      await (
        await MergeOrganizations.getColumnContent("mid", "Parent Organization")
      ).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validRight.parentOrg)
  })
  it("Should be able to select from both left and right side.", async() => {
    await (await MergeOrganizations.getSelectButton("left", "Name")).click()
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validLeft.shortName,
      "mid",
      "Name"
    )
    expect(
      await (await MergeOrganizations.getColumnContent("mid", "Name")).getText()
    ).to.eq(EXAMPLE_ORGANIZATIONS.validLeft.shortName)
    await (
      await MergeOrganizations.getSelectButton("right", "Parent Organization")
    ).click()
    await MergeOrganizations.waitForColumnToChange(
      EXAMPLE_ORGANIZATIONS.validRight.parentOrg,
      "mid",
      "Parent Organization"
    )
    expect(
      await (
        await MergeOrganizations.getColumnContent("mid", "Parent Organization")
      ).getText()
    ).to.equal(EXAMPLE_ORGANIZATIONS.validRight.parentOrg)
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
    const checkboxes = await await MergeOrganizations.getCheckboxes()
    // eslint-disable-next-line no-unused-expressions
    expect(checkboxes).not.to.be.empty
    for (const checkbox of checkboxes) {
      await checkbox.click()
    }
    await (await MergeOrganizations.getMergeOrganizationsButton()).click()
    await MergeOrganizations.waitForSuccessAlert()
  })
})
