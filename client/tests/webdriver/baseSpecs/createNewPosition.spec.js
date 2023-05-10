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
    it("Should show name, organization and location to be required when submitting empty form", async() => {
      await CreatePosition.openAsAdminUser()
      await (await CreatePosition.getForm()).waitForExist()
      await (await CreatePosition.getForm()).waitForDisplayed()
      await CreatePosition.submitForm()
      await (await CreatePosition.getPositionNameHelpBlock()).waitForExist()
      await (await CreatePosition.getPositionNameHelpBlock()).waitForDisplayed()

      await (await CreatePosition.getOrganizationHelpBlock()).waitForExist()
      await (await CreatePosition.getOrganizationHelpBlock()).waitForDisplayed()

      await (await CreatePosition.getTypeAdvisorButton()).click()

      expect(
        await (await CreatePosition.getPositionNameHelpBlock()).getText()
      ).to.equal("Position name is required")
      expect(
        await (await CreatePosition.getOrganizationHelpBlock()).getText()
      ).to.equal("Organization is required")
      expect(
        await (await CreatePosition.getLocationHelpBlock()).getText()
      ).to.equal("Location is required for NATO Billet")

      await (await CreatePosition.getTypePrincipalButton()).click()

      expect(
        await (await CreatePosition.getPositionNameHelpBlock()).getText()
      ).to.equal("Position name is required")
      expect(
        await (await CreatePosition.getOrganizationHelpBlock()).getText()
      ).to.equal("Organization is required")
    })

    it("Should display possible duplicates with similar names", async() => {
      await (await CreatePosition.getTypeAdvisorButton()).click()
      await (
        await CreatePosition.getPositionNameInput()
      ).setValue(SIMILAR_ADVISOR_POSITION_NAME)
      await (await CreatePosition.getDuplicatesButton()).waitForDisplayed()
      await (await CreatePosition.getDuplicatesButton()).click()
      await (await CreatePosition.getModalContent()).waitForDisplayed()
      const similar = await (
        await CreatePosition.getSimilarPosition()
      ).getText()
      await (await CreatePosition.getModalCloseButton()).waitForDisplayed()
      await (await CreatePosition.getModalCloseButton()).click()
      await (
        await CreatePosition.getModalContent()
      ).waitForDisplayed({ reverse: true })
      expect(similar).to.equal("EF 1.1 Advisor for Agriculture")
    })

    it("Should successfully create an advisor position when required fields are filled", async() => {
      await (await CreatePosition.getTypeAdvisorButton()).click()
      await (
        await CreatePosition.getPositionNameInput()
      ).setValue("Test Position")

      await (await CreatePosition.getOrganizationInput()).click()
      await (await CreatePosition.getOrganizationInput()).setValue(ADMIN_ORG)
      await CreatePosition.waitForOrgAdvancedSelectToChange(ADMIN_ORG_COMPLETE)
      expect(
        await (await CreatePosition.getOrgAdvancedSelectFirstItem()).getText()
      ).to.include(ADMIN_ORG_COMPLETE)

      await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()

      await (await CreatePosition.getLocationInput()).click()
      await (await CreatePosition.getLocAdvancedSelectFirstItem()).click()

      await CreatePosition.submitForm()
      await CreatePosition.waitForAlertSuccessToLoad()
    })

    it("Should successfully create a principle position when required fields are filled", async() => {
      await CreatePosition.openAsAdminUser()
      await (await CreatePosition.getForm()).waitForExist()
      await (await CreatePosition.getForm()).waitForDisplayed()

      await (await CreatePosition.getTypePrincipalButton()).click()
      await (
        await CreatePosition.getPositionNameInput()
      ).setValue("Test Position")

      await (await CreatePosition.getOrganizationInput()).click()
      await (
        await CreatePosition.getOrganizationInput()
      ).setValue(PRINCIPAL_ORG)
      await CreatePosition.waitForOrgAdvancedSelectToChange(
        PRINCIPAL_ORG_COMPLETE
      )
      expect(
        await (await CreatePosition.getOrgAdvancedSelectFirstItem()).getText()
      ).to.include(PRINCIPAL_ORG_COMPLETE)

      await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()

      await CreatePosition.submitForm()
      await CreatePosition.waitForAlertSuccessToLoad()
      await CreatePosition.logout()
    })
  })

  describe("When changing the position type from principal to advisor and putting back", () => {
    it("Should update the position type to advisor and back to principal", async() => {
      await CreatePosition.open()
      await (await CreatePosition.getForm()).waitForExist()
      await (await CreatePosition.getForm()).waitForDisplayed()

      await (await CreatePosition.getTypePrincipalButton()).waitForDisplayed()
      expect(
        await (
          await CreatePosition.getTypePrincipalButton()
        ).getAttribute("class")
      ).to.not.include("active")
      // NOTE: The ButtonGroup component does not specify it's active selection
      // expect(CreatePosition.getTypeAdvisorButton().getAttribute("class")).to.include(
      //   "active"
      // )
      expect(
        await (await CreatePosition.getOrganizationInput()).getValue()
      ).to.equal("")

      await (await CreatePosition.getOrganizationInput()).click()
      await (
        await CreatePosition.getOrganizationInput()
      ).setValue(PRINCIPAL_ORG)
      // element should *not* exist as no suggestion found
      await (
        await CreatePosition.getOrgAdvancedSelectFirstItem()
      ).waitForExist({
        timeout: 2000,
        reverse: true
      })

      // Click outside the organization overlay to close the overlay
      await (await CreatePosition.getTypeAdvisorButton()).click()

      await (await CreatePosition.getOrganizationInput()).click()
      await (await CreatePosition.getOrganizationInput()).setValue(ADVISOR_ORG)
      await CreatePosition.waitForOrgAdvancedSelectToChange(
        ADVISOR_ORG_COMPLETE
      )
      expect(
        await (await CreatePosition.getOrgAdvancedSelectFirstItem()).getText()
      ).to.include(ADVISOR_ORG_COMPLETE)

      await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()
      expect(
        await (await CreatePosition.getOrganizationInput()).getValue()
      ).to.equal(ADVISOR_ORG)

      await (await CreatePosition.getTypePrincipalButton()).click()
      expect(
        await (await CreatePosition.getOrganizationInput()).getValue()
      ).to.equal("")

      await (await CreatePosition.getOrganizationInput()).click()
      await (
        await CreatePosition.getOrganizationInput()
      ).setValue(PRINCIPAL_ORG)
      await CreatePosition.waitForOrgAdvancedSelectToChange(
        PRINCIPAL_ORG_COMPLETE
      )
      expect(
        await (await CreatePosition.getOrgAdvancedSelectFirstItem()).getText()
      ).to.include(PRINCIPAL_ORG_COMPLETE)

      await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()
      expect(
        await (await CreatePosition.getOrganizationInput()).getValue()
      ).to.equal(PRINCIPAL_ORG)
      await (await CreatePosition.getCancelButton()).click()

      // prevents "unexpected alert open" errors on BrowserStack
      await browser.acceptAlert()

      await CreatePosition.logout()
    })
  })
})
