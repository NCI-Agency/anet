import { expect } from "chai"
import CreatePosition from "../pages/createNewPosition.page"

const ADMIN_ORG = "ANET Admin"
const ADMIN_ORG_COMPLETE = "ANET Administrators -"
const ADVISOR_ORG = "EF 2.2"
const ADVISOR_ORG_COMPLETE = "EF 2.2 -"
const PRINCIPAL_ORG = "MoI"
const PRINCIPAL_ORG_COMPLETE = "MoI - Ministry of Interior P12345"
const SIMILAR_ADVISOR_POSITION_NAME = "EF 1.1 Advisor for Agriculture"

describe("Create position page", () => {
  describe("When creating a position", () => {
    it("Should show name, organization and location to be required when submitting empty form", () => {
      CreatePosition.openAsAdminUser()
      CreatePosition.form.waitForExist()
      CreatePosition.form.waitForDisplayed()
      CreatePosition.submitForm()
      CreatePosition.positionNameHelpBlock.waitForExist()
      CreatePosition.positionNameHelpBlock.waitForDisplayed()

      CreatePosition.organizationHelpBlock.waitForExist()
      CreatePosition.organizationHelpBlock.waitForDisplayed()

      CreatePosition.typeAdvisorButton.click()

      expect(CreatePosition.positionNameHelpBlock.getText()).to.equal(
        "Position name is required"
      )
      expect(CreatePosition.organizationHelpBlock.getText()).to.equal(
        "Organization is required"
      )
      expect(CreatePosition.locationHelpBlock.getText()).to.equal(
        "Location is required for NATO Billet"
      )

      CreatePosition.typePrincipalButton.click()

      expect(CreatePosition.positionNameHelpBlock.getText()).to.equal(
        "Position name is required"
      )
      expect(CreatePosition.organizationHelpBlock.getText()).to.equal(
        "Organization is required"
      )
    })

    it("Should display possible duplicates with similar names", () => {
      CreatePosition.typeAdvisorButton.click()
      CreatePosition.positionNameInput.setValue(SIMILAR_ADVISOR_POSITION_NAME)
      CreatePosition.duplicatesButton.waitForDisplayed()
      CreatePosition.duplicatesButton.click()
      CreatePosition.modalContent.waitForDisplayed()
      const similar = CreatePosition.similarPosition.getText()
      CreatePosition.modalCloseButton.waitForDisplayed()
      CreatePosition.modalCloseButton.click()
      CreatePosition.modalContent.waitForDisplayed({ reverse: true })
      expect(similar).to.equal("EF 1.1 Advisor for Agriculture")
    })

    it("Should successfully create an advisor position when required fields are filled", () => {
      CreatePosition.typeAdvisorButton.click()
      CreatePosition.positionNameInput.setValue("Test Position")

      CreatePosition.organizationInput.click()
      CreatePosition.organizationInput.setValue(ADMIN_ORG)
      CreatePosition.waitForOrgAdvancedSelectToChange(ADMIN_ORG_COMPLETE)
      expect(CreatePosition.orgAdvancedSelectFirstItem.getText()).to.include(
        ADMIN_ORG_COMPLETE
      )

      CreatePosition.orgAdvancedSelectFirstItem.click()

      CreatePosition.locationInput.click()
      CreatePosition.locAdvancedSelectFirstItem.click()

      CreatePosition.submitForm()
      CreatePosition.waitForAlertSuccessToLoad()
    })

    it("Should successfully create a principle position when required fields are filled", () => {
      CreatePosition.openAsAdminUser()
      CreatePosition.form.waitForExist()
      CreatePosition.form.waitForDisplayed()

      CreatePosition.typePrincipalButton.click()
      CreatePosition.positionNameInput.setValue("Test Position")

      CreatePosition.organizationInput.click()
      CreatePosition.organizationInput.setValue(PRINCIPAL_ORG)
      CreatePosition.waitForOrgAdvancedSelectToChange(PRINCIPAL_ORG_COMPLETE)
      expect(CreatePosition.orgAdvancedSelectFirstItem.getText()).to.include(
        PRINCIPAL_ORG_COMPLETE
      )

      CreatePosition.orgAdvancedSelectFirstItem.click()

      CreatePosition.submitForm()
      CreatePosition.waitForAlertSuccessToLoad()
    })
  })

  describe("When changing the position type from principal to advisor and putting back", () => {
    it("Should update the position type to advisor and back to principal", () => {
      CreatePosition.open()
      CreatePosition.form.waitForExist()
      CreatePosition.form.waitForDisplayed()

      CreatePosition.typePrincipalButton.waitForDisplayed()
      expect(
        CreatePosition.typePrincipalButton.getAttribute("class")
      ).to.not.include("active")
      expect(CreatePosition.typeAdvisorButton.getAttribute("class")).to.include(
        "active"
      )
      expect(CreatePosition.organizationInput.getValue()).to.equal("")

      CreatePosition.organizationInput.click()
      CreatePosition.organizationInput.setValue(PRINCIPAL_ORG)
      // element should *not* exist as no suggestion found
      CreatePosition.orgAdvancedSelectFirstItem.waitForExist({
        timeout: 2000,
        reverse: true
      })

      // Click outside the organization overlay to close the overlay
      CreatePosition.typeAdvisorButton.click()

      CreatePosition.organizationInput.click()
      CreatePosition.organizationInput.setValue(ADVISOR_ORG)
      CreatePosition.waitForOrgAdvancedSelectToChange(ADVISOR_ORG_COMPLETE)
      expect(CreatePosition.orgAdvancedSelectFirstItem.getText()).to.include(
        ADVISOR_ORG_COMPLETE
      )

      CreatePosition.orgAdvancedSelectFirstItem.click()
      expect(CreatePosition.organizationInput.getValue()).to.equal(ADVISOR_ORG)

      CreatePosition.typePrincipalButton.click()
      expect(CreatePosition.organizationInput.getValue()).to.equal("")

      CreatePosition.organizationInput.click()
      CreatePosition.organizationInput.setValue(PRINCIPAL_ORG)
      CreatePosition.waitForOrgAdvancedSelectToChange(PRINCIPAL_ORG_COMPLETE)
      expect(CreatePosition.orgAdvancedSelectFirstItem.getText()).to.include(
        PRINCIPAL_ORG_COMPLETE
      )

      CreatePosition.orgAdvancedSelectFirstItem.click()
      expect(CreatePosition.organizationInput.getValue()).to.equal(
        PRINCIPAL_ORG
      )
      CreatePosition.cancelButton.click()

      // prevents "unexpected alert open" errors on BrowserStack
      browser.acceptAlert()
    })
  })
})
