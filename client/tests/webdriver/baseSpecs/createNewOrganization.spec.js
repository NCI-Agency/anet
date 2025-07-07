import { expect } from "chai"
import CreateOrganization from "../pages/createNewOrganization.page"
import ShowOrganization from "../pages/showOrganization.page"

const testOrgs = {
  topLevel: {
    shortName: "TO 1",
    description: "Test Organization 1",
    location: "Cabot Tower",
    profile: "Test Organization 1 profile",
    app6contextInput: "1",
    app6context: "Exercise",
    app6standardIdentityInput: "2",
    app6standardIdentity: "Assumed Friend",
    app6symbolSetInput: "10",
    app6symbolSet: "Land Unit",
    app6hqInput: "3",
    app6hq: "Feint / Dummy Headquarters",
    app6amplifierInput: "12",
    app6amplifier: "Squad",
    app6entityInput: "12",
    app6entity: "Movement and Manoeuvre"
  },
  secondLevel: {
    shortName: "TO 1.1",
    description: "Test Organization 1.1",
    location: "General Hospital",
    profile: "Test Organization 1.1 profile",
    app6standardIdentityInput: "3",
    app6standardIdentity: "Friend",
    app6symbolSetInput: "10",
    app6symbolSet: "Land Unit",
    app6hqInput: "5",
    app6hq: "Feint / Dummy Task Force",
    app6amplifierInput: "11",
    app6amplifier: "Team / Crew"
  },
  thirdLevel: {
    shortName: "TO 1.1.1",
    description: "Test Organization 1.1.1",
    location: "Kabul Hospital",
    profile: "Test Organization 1.1.1 profile"
  }
}

describe("When creating an organization", () => {
  it("Should show name to be required when submitting empty form", async() => {
    await CreateOrganization.openAsAdmin()
    await (await CreateOrganization.getForm()).waitForExist()
    await (await CreateOrganization.getForm()).waitForDisplayed()
    await CreateOrganization.submitForm()
    await (
      await CreateOrganization.getOrganizationShortNameHelpBlock()
    ).waitForExist()
    await (
      await CreateOrganization.getOrganizationShortNameHelpBlock()
    ).waitForDisplayed()
  })

  it("Should be able to create a top-level organization", async() => {
    await CreateOrganization.fillOrganization(testOrgs.topLevel)
    await CreateOrganization.submitForm()
    await ShowOrganization.waitForAlertSuccessToLoad()
    expect(await (await ShowOrganization.getAlertSuccess()).getText()).to.equal(
      "Organization saved"
    )
  })
  it("Should display the newly created top-level organization", async() => {
    const testOrg = testOrgs.topLevel
    expect(await (await ShowOrganization.getLongName()).getText()).to.equal(
      testOrg.description
    )
    expect(await (await ShowOrganization.getLocation()).getText()).to.include(
      testOrg.location
    )
    expect(await (await ShowOrganization.getProfile()).getText()).to.include(
      testOrg.profile
    )
    await ShowOrganization.hoverOverApp6Symbol()
    expect(
      await (await ShowOrganization.getApp6Value("app6context")).getText()
    ).to.equal(testOrg.app6context)
    expect(
      await (
        await ShowOrganization.getApp6Value("app6standardIdentity")
      ).getText()
    ).to.equal(testOrg.app6standardIdentity)
    expect(
      await (await ShowOrganization.getApp6Value("app6symbolSet")).getText()
    ).to.equal(testOrg.app6symbolSet)
    expect(
      await (await ShowOrganization.getApp6Value("app6hq")).getText()
    ).to.equal(testOrg.app6hq)
    expect(
      await (await ShowOrganization.getApp6Value("app6amplifier")).getText()
    ).to.equal(testOrg.app6amplifier)
    expect(
      await (await ShowOrganization.getApp6Value("app6entity")).getText()
    ).to.equal(testOrg.app6entity)
  })
  it("Should be able to create a sub-organization for the newly created top-level organization", async() => {
    await (
      await ShowOrganization.getCreateSubOrganizationButton()
    ).waitForExist()
    await (
      await ShowOrganization.getCreateSubOrganizationButton()
    ).waitForDisplayed()
    await (await ShowOrganization.getCreateSubOrganizationButton()).click()
    await (await CreateOrganization.getForm()).waitForExist()
    await (await CreateOrganization.getForm()).waitForDisplayed()
    const topLevelOrg = testOrgs.topLevel
    expect(
      await (await CreateOrganization.getParentOrganizationInput()).getValue()
    ).to.equal(topLevelOrg.shortName)
    await CreateOrganization.openEditApp6Modal()
    expect(
      await CreateOrganization.getApp6DropdownValue("app6context")
    ).to.equal(`${topLevelOrg.app6context} (inherited)`)
    expect(
      await CreateOrganization.getApp6DropdownValue("app6standardIdentity")
    ).to.equal(`${topLevelOrg.app6standardIdentity} (inherited)`)
    expect(
      await CreateOrganization.getApp6DropdownValue("app6symbolSet")
    ).to.equal(`${topLevelOrg.app6symbolSet} (inherited)`)
    expect(await CreateOrganization.getApp6DropdownValue("app6hq")).to.equal("")
    await CreateOrganization.closeEditApp6Modal()
    await CreateOrganization.fillOrganization(testOrgs.secondLevel)
    await CreateOrganization.submitForm()
    await ShowOrganization.waitForAlertSuccessToLoad()
    expect(await (await ShowOrganization.getAlertSuccess()).getText()).to.equal(
      "Organization saved"
    )
  })
  it("Should display the newly created second-level organization", async() => {
    const testOrg = testOrgs.secondLevel
    expect(await (await ShowOrganization.getLongName()).getText()).to.equal(
      testOrg.description
    )
    expect(await (await ShowOrganization.getLocation()).getText()).to.include(
      testOrg.location
    )
    expect(await (await ShowOrganization.getProfile()).getText()).to.include(
      testOrg.profile
    )
    // This one should be inherited from the top level
    await ShowOrganization.hoverOverApp6Symbol()
    expect(
      await (await ShowOrganization.getApp6Value("app6context")).getText()
    ).to.equal(`${testOrgs.topLevel.app6context} (inherited)`)
    expect(
      await (
        await ShowOrganization.getApp6Value("app6standardIdentity")
      ).getText()
    ).to.equal(testOrg.app6standardIdentity)
    expect(
      await (await ShowOrganization.getApp6Value("app6symbolSet")).getText()
    ).to.equal(testOrg.app6symbolSet)
    expect(
      await (await ShowOrganization.getApp6Value("app6hq")).getText()
    ).to.equal(testOrg.app6hq)
    expect(
      await (await ShowOrganization.getApp6Value("app6amplifier")).getText()
    ).to.equal(testOrg.app6amplifier)
  })
  it("Should be able to create a sub-organization for the newly created second-level organization", async() => {
    await (
      await ShowOrganization.getCreateSubOrganizationButton()
    ).waitForExist()
    await (
      await ShowOrganization.getCreateSubOrganizationButton()
    ).waitForDisplayed()
    await (await ShowOrganization.getCreateSubOrganizationButton()).click()
    await (await CreateOrganization.getForm()).waitForExist()
    await (await CreateOrganization.getForm()).waitForDisplayed()
    const secondLevelOrg = testOrgs.secondLevel
    expect(
      await (await CreateOrganization.getParentOrganizationInput()).getValue()
    ).to.equal(secondLevelOrg.shortName)
    // This one should be inherited from the top level
    await CreateOrganization.openEditApp6Modal()
    expect(
      await CreateOrganization.getApp6DropdownValue("app6context")
    ).to.equal(`${testOrgs.topLevel.app6context} (inherited)`)
    expect(
      await CreateOrganization.getApp6DropdownValue("app6standardIdentity")
    ).to.equal(`${secondLevelOrg.app6standardIdentity} (inherited)`)
    expect(
      await CreateOrganization.getApp6DropdownValue("app6symbolSet")
    ).to.equal(`${secondLevelOrg.app6symbolSet} (inherited)`)
    expect(await CreateOrganization.getApp6DropdownValue("app6hq")).to.equal("")
    await CreateOrganization.closeEditApp6Modal()

    await CreateOrganization.fillOrganization(testOrgs.thirdLevel)

    await (await CreateOrganization.getClearParentOrganizationButton()).click()
    await (await CreateOrganization.getShortNameInput()).click()
    await CreateOrganization.openEditApp6Modal()
    expect(
      await CreateOrganization.getApp6DropdownValue("app6context")
    ).to.equal("")
    expect(
      await CreateOrganization.getApp6DropdownValue("app6standardIdentity")
    ).to.equal("")
    await CreateOrganization.closeEditApp6Modal()

    // Search by uuid as the full-text index may not yet be updated
    const url = await browser.getUrl()
    const searchParams = new URL(url).searchParams
    const secondLevelOrgUuid = searchParams.get("parentOrgUuid")
    await CreateOrganization.selectParentOrganizationByText(secondLevelOrgUuid)
    await CreateOrganization.openEditApp6Modal()
    // This one should be inherited from the top level
    expect(
      await CreateOrganization.getApp6DropdownValue("app6context")
    ).to.equal(`${testOrgs.topLevel.app6context} (inherited)`)
    expect(
      await CreateOrganization.getApp6DropdownValue("app6standardIdentity")
    ).to.equal(`${secondLevelOrg.app6standardIdentity} (inherited)`)
    expect(
      await CreateOrganization.getApp6DropdownValue("app6symbolSet")
    ).to.equal(`${secondLevelOrg.app6symbolSet} (inherited)`)
    await CreateOrganization.closeEditApp6Modal()

    await CreateOrganization.submitForm()
    await ShowOrganization.waitForAlertSuccessToLoad()
    expect(await (await ShowOrganization.getAlertSuccess()).getText()).to.equal(
      "Organization saved"
    )
  })
  it("Should display the newly created third-level organization", async() => {
    const testOrg = testOrgs.thirdLevel
    expect(await (await ShowOrganization.getLongName()).getText()).to.equal(
      testOrg.description
    )
    expect(await (await ShowOrganization.getLocation()).getText()).to.include(
      testOrg.location
    )
    expect(await (await ShowOrganization.getProfile()).getText()).to.include(
      testOrg.profile
    )
    await ShowOrganization.hoverOverApp6Symbol()
    // This one should be inherited from the top level
    expect(
      await (await ShowOrganization.getApp6Value("app6context")).getText()
    ).to.equal(`${testOrgs.topLevel.app6context} (inherited)`)
    expect(
      await (
        await ShowOrganization.getApp6Value("app6standardIdentity")
      ).getText()
    ).to.equal(`${testOrgs.secondLevel.app6standardIdentity} (inherited)`)
    expect(
      await (await ShowOrganization.getApp6Value("app6symbolSet")).getText()
    ).to.equal(`${testOrgs.secondLevel.app6symbolSet} (inherited)`)
  })
})
