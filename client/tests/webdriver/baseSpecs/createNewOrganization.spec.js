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
    app6standardIdentity: "Assumed friend",
    app6symbolSetInput: "10",
    app6symbolSet: "Land unit",
    app6hqInput: "3",
    app6hq: "Feint/dummy headquarters",
    app6amplifierInput: "12",
    app6amplifier: "Echelon at brigade and below: Squad"
  },
  secondLevel: {
    shortName: "TO 1.1",
    description: "Test Organization 1.1",
    location: "General Hospital",
    profile: "Test Organization 1.1 profile",
    app6contextInput: "2",
    app6context: "Simulation",
    app6standardIdentityInput: "3",
    app6standardIdentity: "Friend",
    app6symbolSetInput: "11",
    app6symbolSet: "Land civilian unit/organization",
    app6hqInput: "5",
    app6hq: "Feint/dummy task force",
    app6amplifierInput: "11",
    app6amplifier: "Echelon at brigade and below: Team/crew"
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
    expect(await (await ShowOrganization.getApp6context()).getText()).to.equal(
      testOrg.app6context
    )
    expect(
      await (await ShowOrganization.getApp6standardIdentity()).getText()
    ).to.equal(testOrg.app6standardIdentity)
    expect(
      await (await ShowOrganization.getApp6symbolSet()).getText()
    ).to.equal(testOrg.app6symbolSet)
    expect(await (await ShowOrganization.getApp6hq()).getText()).to.equal(
      testOrg.app6hq
    )
    expect(
      await (await ShowOrganization.getApp6amplifier()).getText()
    ).to.equal(testOrg.app6amplifier)
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
    expect(
      await (await CreateOrganization.getApp6contextExtraColumn()).getText()
    ).to.equal(`${topLevelOrg.app6context} (inherited from parent)`)
    expect(
      await (
        await CreateOrganization.getApp6standardIdentityExtraColumn()
      ).getText()
    ).to.equal(`${topLevelOrg.app6standardIdentity} (inherited from parent)`)
    /* eslint-disable no-unused-expressions */
    expect(
      await (
        await CreateOrganization.getApp6symbolSetExtraColumn()
      ).isExisting()
    ).to.be.false
    expect(await (await CreateOrganization.getApp6hqExtraColumn()).isExisting())
      .to.be.false
    expect(
      await (
        await CreateOrganization.getApp6amplifierExtraColumn()
      ).isExisting()
    ).to.be.false
    /* eslint-enable no-unused-expressions */

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
    expect(await (await ShowOrganization.getApp6context()).getText()).to.equal(
      testOrg.app6context
    )
    expect(
      await (await ShowOrganization.getApp6standardIdentity()).getText()
    ).to.equal(testOrg.app6standardIdentity)
    expect(
      await (await ShowOrganization.getApp6symbolSet()).getText()
    ).to.equal(testOrg.app6symbolSet)
    expect(await (await ShowOrganization.getApp6hq()).getText()).to.equal(
      testOrg.app6hq
    )
    expect(
      await (await ShowOrganization.getApp6amplifier()).getText()
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
    expect(
      await (await CreateOrganization.getApp6contextExtraColumn()).getText()
    ).to.equal(`${secondLevelOrg.app6context} (inherited from parent)`)
    expect(
      await (
        await CreateOrganization.getApp6standardIdentityExtraColumn()
      ).getText()
    ).to.equal(`${secondLevelOrg.app6standardIdentity} (inherited from parent)`)
    /* eslint-disable no-unused-expressions */
    expect(
      await (
        await CreateOrganization.getApp6symbolSetExtraColumn()
      ).isExisting()
    ).to.be.false
    expect(await (await CreateOrganization.getApp6hqExtraColumn()).isExisting())
      .to.be.false
    expect(
      await (
        await CreateOrganization.getApp6amplifierExtraColumn()
      ).isExisting()
    ).to.be.false
    /* eslint-enable no-unused-expressions */

    await CreateOrganization.fillOrganization(testOrgs.thirdLevel, true)
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
    expect(await (await ShowOrganization.getApp6context()).getText()).to.equal(
      `${testOrgs.secondLevel.app6context} (inherited from parent)`
    )
    expect(
      await (await ShowOrganization.getApp6standardIdentity()).getText()
    ).to.equal(
      `${testOrgs.secondLevel.app6standardIdentity} (inherited from parent)`
    )
    /* eslint-disable no-unused-expressions */
    expect(await (await ShowOrganization.getApp6symbolSet()).getText()).to.be
      .empty
    expect(await (await ShowOrganization.getApp6hq()).getText()).to.be.empty
    expect(await (await ShowOrganization.getApp6amplifier()).getText()).to.be
      .empty
    /* eslint-enable no-unused-expressions */
  })
})
