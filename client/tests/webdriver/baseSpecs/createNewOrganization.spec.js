import { expect } from "chai"
import CreateOrganization from "../pages/createNewOrganization.page"
import ShowOrganization from "../pages/showOrganization.page"

const SHORT_NAME = "TO 1"
const DESCRIPTION = "Test Organization 1"
const LOCATION = "Cabot Tower"
const PROFILE = "Test Organization 1 profile"

describe("When creating an organization", () => {
  it("Should show name to be required when submitting empty form", () => {
    CreateOrganization.openAsAdmin()
    CreateOrganization.getForm().waitForExist()
    CreateOrganization.getForm().waitForDisplayed()
    CreateOrganization.submitForm()
    CreateOrganization.getOrganizationShortNameHelpBlock().waitForExist()
    CreateOrganization.getOrganizationShortNameHelpBlock().waitForDisplayed()
  })

  it("Should successfully create an advisor organization with location and profile", () => {
    CreateOrganization.getTypeAdvisorButton().click()
    CreateOrganization.getShortNameInput().setValue(SHORT_NAME)
    CreateOrganization.getLongNameInput().setValue(DESCRIPTION)
    CreateOrganization.getLocationInput().click()
    CreateOrganization.getLocationInput().setValue(LOCATION)
    CreateOrganization.waitForLocationAdvancedSelectToChange(LOCATION)
    expect(
      CreateOrganization.getLocationAdvancedSelectFirstItem().getText()
    ).to.include(LOCATION)
    CreateOrganization.getLocationAdvancedSelectFirstItem().click()
    CreateOrganization.fillOrganizationProfile(PROFILE)
    CreateOrganization.submitForm()
    ShowOrganization.waitForAlertSuccessToLoad()
    expect(ShowOrganization.getAlertSuccess().getText()).to.equal(
      "Organization saved"
    )
  })
  it("Should display the newly created organization", () => {
    expect(ShowOrganization.getLongName().getText()).to.equal(DESCRIPTION)
    expect(ShowOrganization.getLocation().getText()).to.include(LOCATION)
    expect(ShowOrganization.getProfile().getText()).to.include(PROFILE)
  })
})
