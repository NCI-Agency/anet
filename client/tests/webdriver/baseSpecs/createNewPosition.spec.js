import { expect } from "chai"
import CreatePosition from "../pages/createNewPosition.page"

const ADMIN_ORG = "ANET Admin"
const ADMIN_ORG_COMPLETE = "ANET Administrators"
const INTERLOCUTOR_ORG = "MoI"
const INTERLOCUTOR_ORG_COMPLETE = "MoI | Ministry of Interior"
const NOT_SIMILAR_ADVISOR_POSITION_NAME = "XXX"
const SIMILAR_ADVISOR_POSITION_NAME = "EF 1.1 Advisor for Agriculture"

describe("Create position page", () => {
  describe("When creating a position", () => {
    it("Should show name and organization to be required when submitting empty form", async() => {
      await CreatePosition.openAsAdminUser()
      await (await CreatePosition.getForm()).waitForExist()
      await (await CreatePosition.getForm()).waitForDisplayed()
      await CreatePosition.submitForm()
      await (await CreatePosition.getPositionNameHelpBlock()).waitForExist()
      await (await CreatePosition.getPositionNameHelpBlock()).waitForDisplayed()

      await (await CreatePosition.getOrganizationHelpBlock()).waitForExist()
      await (await CreatePosition.getOrganizationHelpBlock()).waitForDisplayed()

      expect(
        await (await CreatePosition.getPositionNameHelpBlock()).getText()
      ).to.equal("Position name is required")
      expect(
        await (await CreatePosition.getOrganizationHelpBlock()).getText()
      ).to.equal("Organization is required")
    })

    it("Should display possible duplicates with similar names", async() => {
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

    it("Should successfully create a position in an advisor organization when required fields are filled", async() => {
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

      // First select member role
      await (await CreatePosition.getRoleMemberButton()).click()
      // Ensure role-member-input is selected
      expect(
        await (await CreatePosition.getRoleMemberInput()).isSelected()
      ).to.equal(true)

      // Will create position with deputy role
      await (await CreatePosition.getRoleDeputyButton()).click()
      // Ensure role-deputy-input is selected
      expect(
        await (await CreatePosition.getRoleDeputyInput()).isSelected()
      ).to.equal(true)
      // Ensure role-member-input is not selected
      expect(
        await (await CreatePosition.getRoleMemberInput()).isSelected()
      ).to.equal(false)
      // Ensure role-leader-input is not selected
      expect(
        await (await CreatePosition.getRoleLeaderInput()).isSelected()
      ).to.equal(false)

      await (await CreatePosition.getLocationInput()).click()
      await (await CreatePosition.getLocAdvancedSelectFirstItem()).click()

      await CreatePosition.submitForm()
      await CreatePosition.waitForAlertSuccessToLoad()
    })

    it("Should successfully create a position in an interlocutor organization when required fields are filled", async() => {
      await CreatePosition.openAsAdminUser()
      await (await CreatePosition.getForm()).waitForExist()
      await (await CreatePosition.getForm()).waitForDisplayed()

      await (
        await CreatePosition.getPositionNameInput()
      ).setValue("Test Position")

      await (await CreatePosition.getOrganizationInput()).click()
      await (
        await CreatePosition.getOrganizationInput()
      ).setValue(INTERLOCUTOR_ORG)
      await CreatePosition.waitForOrgAdvancedSelectToChange(
        INTERLOCUTOR_ORG_COMPLETE
      )
      expect(
        await (await CreatePosition.getOrgAdvancedSelectFirstItem()).getText()
      ).to.include(INTERLOCUTOR_ORG_COMPLETE)

      await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()

      // First select deputy role
      await (await CreatePosition.getRoleDeputyButton()).click()
      // Ensure role-deputy-input is selected
      expect(
        await (await CreatePosition.getRoleDeputyInput()).isSelected()
      ).to.equal(true)

      // Will create position with leader role
      await (await CreatePosition.getRoleLeaderButton()).click()
      // Ensure role-leader-input is selected
      expect(
        await (await CreatePosition.getRoleLeaderInput()).isSelected()
      ).to.equal(true)
      // Ensure role-member-input is not selected
      expect(
        await (await CreatePosition.getRoleMemberInput()).isSelected()
      ).to.equal(false)
      // Ensure role-deputy-input is not selected
      expect(
        await (await CreatePosition.getRoleDeputyInput()).isSelected()
      ).to.equal(false)

      await CreatePosition.submitForm()
      await CreatePosition.waitForAlertSuccessToLoad()
      await CreatePosition.logout()
    })

    it("Should not display possible duplicates button", async() => {
      await CreatePosition.openAsAdminUser()
      await (await CreatePosition.getForm()).waitForExist()
      await (await CreatePosition.getForm()).waitForDisplayed()
      await (
        await CreatePosition.getPositionNameInput()
      ).setValue(NOT_SIMILAR_ADVISOR_POSITION_NAME)
      // eslint-disable-next-line no-unused-expressions
      expect(await (await CreatePosition.getDuplicatesButton()).isExisting()).to
        .be.false
    })
  })
})
