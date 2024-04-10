import MergeOrganizations from "../pages/mergeOrganizations.page"

describe("Merge organizations", () => {
  it("Should display field values of the left organization", async() => {
    await MergeOrganizations.open()
    await (await MergeOrganizations.getTitle()).waitForExist()
    await (await MergeOrganizations.getTitle()).waitForDisplayed()
  })
})
