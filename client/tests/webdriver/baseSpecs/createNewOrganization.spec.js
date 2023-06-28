import { expect } from "chai"
import CreateOrganization from "../pages/createNewOrganization.page"
import ShowOrganization from "../pages/showOrganization.page"

const SHORT_NAME = "TO 1"
const DESCRIPTION = "Test Organization 1"
const LOCATION = "Cabot Tower"
const PROFILE = "Test Organization 1 profile"

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

  it("Should successfully create an organization with location and profile", async() => {
    await (await CreateOrganization.getShortNameInput()).setValue(SHORT_NAME)
    await (await CreateOrganization.getLongNameInput()).setValue(DESCRIPTION)
    await (await CreateOrganization.getLocationInput()).click()
    await (await CreateOrganization.getLocationInput()).setValue(LOCATION)
    await CreateOrganization.waitForLocationAdvancedSelectToChange(LOCATION)
    expect(
      await (
        await CreateOrganization.getLocationAdvancedSelectFirstItem()
      ).getText()
    ).to.include(LOCATION)
    await (
      await CreateOrganization.getLocationAdvancedSelectFirstItem()
    ).click()
    await CreateOrganization.fillOrganizationProfile(PROFILE)
    await CreateOrganization.submitForm()
    await ShowOrganization.waitForAlertSuccessToLoad()
    expect(await (await ShowOrganization.getAlertSuccess()).getText()).to.equal(
      "Organization saved"
    )
  })
  it("Should display the newly created organization", async() => {
    expect(await (await ShowOrganization.getLongName()).getText()).to.equal(
      DESCRIPTION
    )
    expect(await (await ShowOrganization.getLocation()).getText()).to.include(
      LOCATION
    )
    expect(await (await ShowOrganization.getProfile()).getText()).to.include(
      PROFILE
    )
  })
})
