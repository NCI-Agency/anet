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
      CreatePosition.getForm().waitForExist()
      CreatePosition.getForm().waitForDisplayed()
      CreatePosition.submitForm()
      CreatePosition.getPositionNameHelpBlock().waitForExist()
      CreatePosition.getPositionNameHelpBlock().waitForDisplayed()

      CreatePosition.getOrganizationHelpBlock().waitForExist()
      CreatePosition.getOrganizationHelpBlock().waitForDisplayed()

      CreatePosition.getTypeAdvisorButton().click()

      expect(CreatePosition.getPositionNameHelpBlock().getText()).to.equal(
        "Position name is required"
      )
      expect(CreatePosition.getOrganizationHelpBlock().getText()).to.equal(
        "Organization is required"
      )
      expect(CreatePosition.getLocationHelpBlock().getText()).to.equal(
        "Location is required for NATO Billet"
      )

      CreatePosition.getTypePrincipalButton().click()

      expect(CreatePosition.getPositionNameHelpBlock().getText()).to.equal(
        "Position name is required"
      )
      expect(CreatePosition.getOrganizationHelpBlock().getText()).to.equal(
        "Organization is required"
      )
    })

    it("Should display possible duplicates with similar names", () => {
      CreatePosition.getTypeAdvisorButton().click()
      CreatePosition.getPositionNameInput().setValue(
        SIMILAR_ADVISOR_POSITION_NAME
      )
      CreatePosition.getDuplicatesButton().waitForDisplayed()
      CreatePosition.getDuplicatesButton().click()
      CreatePosition.getModalContent().waitForDisplayed()
      const similar = CreatePosition.getSimilarPosition().getText()
      CreatePosition.getModalCloseButton().waitForDisplayed()
      CreatePosition.getModalCloseButton().click()
      CreatePosition.getModalContent().waitForDisplayed({ reverse: true })
      expect(similar).to.equal("EF 1.1 Advisor for Agriculture")
    })

    it("Should successfully create an advisor position when required fields are filled", () => {
      CreatePosition.getTypeAdvisorButton().click()
      CreatePosition.getPositionNameInput().setValue("Test Position")

      CreatePosition.getOrganizationInput().click()
      CreatePosition.getOrganizationInput().setValue(ADMIN_ORG)
      CreatePosition.waitForOrgAdvancedSelectToChange(ADMIN_ORG_COMPLETE)
      expect(
        CreatePosition.getOrgAdvancedSelectFirstItem().getText()
      ).to.include(ADMIN_ORG_COMPLETE)

      CreatePosition.getOrgAdvancedSelectFirstItem().click()

      CreatePosition.getLocationInput().click()
      CreatePosition.getLocAdvancedSelectFirstItem().click()

      CreatePosition.submitForm()
      CreatePosition.waitForAlertSuccessToLoad()
    })

    it("Should successfully create a principle position when required fields are filled", () => {
      CreatePosition.openAsAdminUser()
      CreatePosition.getForm().waitForExist()
      CreatePosition.getForm().waitForDisplayed()

      CreatePosition.getTypePrincipalButton().click()
      CreatePosition.getPositionNameInput().setValue("Test Position")

      CreatePosition.getOrganizationInput().click()
      CreatePosition.getOrganizationInput().setValue(PRINCIPAL_ORG)
      CreatePosition.waitForOrgAdvancedSelectToChange(PRINCIPAL_ORG_COMPLETE)
      expect(
        CreatePosition.getOrgAdvancedSelectFirstItem().getText()
      ).to.include(PRINCIPAL_ORG_COMPLETE)

      CreatePosition.getOrgAdvancedSelectFirstItem().click()

      CreatePosition.submitForm()
      CreatePosition.waitForAlertSuccessToLoad()
      CreatePosition.logout()
    })
  })

  describe("When changing the position type from principal to advisor and putting back", () => {
    it("Should update the position type to advisor and back to principal", () => {
      CreatePosition.open()
      CreatePosition.getForm().waitForExist()
      CreatePosition.getForm().waitForDisplayed()

      CreatePosition.getTypePrincipalButton().waitForDisplayed()
      expect(
        CreatePosition.getTypePrincipalButton().getAttribute("class")
      ).to.not.include("active")
      // NOTE: The ButtonGroup component does not specify it's active selection
      // expect(CreatePosition.getTypeAdvisorButton().getAttribute("class")).to.include(
      //   "active"
      // )
      expect(CreatePosition.getOrganizationInput().getValue()).to.equal("")

      CreatePosition.getOrganizationInput().click()
      CreatePosition.getOrganizationInput().setValue(PRINCIPAL_ORG)
      // element should *not* exist as no suggestion found
      CreatePosition.getOrgAdvancedSelectFirstItem().waitForExist({
        timeout: 2000,
        reverse: true
      })

      // Click outside the organization overlay to close the overlay
      CreatePosition.getTypeAdvisorButton().click()

      CreatePosition.getOrganizationInput().click()
      CreatePosition.getOrganizationInput().setValue(ADVISOR_ORG)
      CreatePosition.waitForOrgAdvancedSelectToChange(ADVISOR_ORG_COMPLETE)
      expect(
        CreatePosition.getOrgAdvancedSelectFirstItem().getText()
      ).to.include(ADVISOR_ORG_COMPLETE)

      CreatePosition.getOrgAdvancedSelectFirstItem().click()
      expect(CreatePosition.getOrganizationInput().getValue()).to.equal(
        ADVISOR_ORG
      )

      CreatePosition.getTypePrincipalButton().click()
      expect(CreatePosition.getOrganizationInput().getValue()).to.equal("")

      CreatePosition.getOrganizationInput().click()
      CreatePosition.getOrganizationInput().setValue(PRINCIPAL_ORG)
      CreatePosition.waitForOrgAdvancedSelectToChange(PRINCIPAL_ORG_COMPLETE)
      expect(
        CreatePosition.getOrgAdvancedSelectFirstItem().getText()
      ).to.include(PRINCIPAL_ORG_COMPLETE)

      CreatePosition.getOrgAdvancedSelectFirstItem().click()
      expect(CreatePosition.getOrganizationInput().getValue()).to.equal(
        PRINCIPAL_ORG
      )
      CreatePosition.getCancelButton().click()

      // prevents "unexpected alert open" errors on BrowserStack
      browser.acceptAlert()

      CreatePosition.logout()
    })
  })
})
