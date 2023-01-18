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
    CreateOrganization.form.waitForExist()
    CreateOrganization.form.waitForDisplayed()
    CreateOrganization.submitForm()
    CreateOrganization.organizationShortNameHelpBlock.waitForExist()
    CreateOrganization.organizationShortNameHelpBlock.waitForDisplayed()
  })

  it("Should successfully create an advisor organization with location and profile", () => {
    CreateOrganization.typeAdvisorButton.click()
    CreateOrganization.shortNameInput.setValue(SHORT_NAME)
    CreateOrganization.longNameInput.setValue(DESCRIPTION)
    CreateOrganization.locationInput.click()
    CreateOrganization.locationInput.setValue(LOCATION)
    CreateOrganization.waitForLocationAdvancedSelectToChange(LOCATION)
    expect(
      CreateOrganization.locationAdvancedSelectFirstItem.getText()
    ).to.include(LOCATION)
    CreateOrganization.locationAdvancedSelectFirstItem.click()
    CreateOrganization.fillOrganizationProfile(PROFILE)
    CreateOrganization.submitForm()
    ShowOrganization.waitForAlertSuccessToLoad()
    expect(ShowOrganization.alertSuccess.getText()).to.equal(
      "Organization saved"
    )
  })
  it("Should display the newly created organization", () => {
    expect(ShowOrganization.longName.getText()).to.equal(DESCRIPTION)
    expect(ShowOrganization.location.getText()).to.include(LOCATION)
    expect(ShowOrganization.profile.getText()).to.include(PROFILE)
  })
})
