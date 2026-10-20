import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import CreatePosition from "../pages/createNewPosition.page.js"
import { test, waitFor } from "../support.js"

const ADMIN_ORG = "ANET Admin"
const ADMIN_ORG_COMPLETE = "ANET Administrators"
const INTERLOCUTOR_ORG = "MoI"
const INTERLOCUTOR_ORG_COMPLETE = "MoI | Ministry of Interior"
const NOT_SIMILAR_ADVISOR_POSITION_NAME = "XXX"
const SIMILAR_ADVISOR_POSITION_NAME = "EF 1.1 Advisor for Agriculture"
test.describe("Create position page", () => {
  test.describe("When creating a position", () => {
    test("Should show name and organization to be required when submitting empty form", async () => {
      await CreatePosition.openAsAdminUser()
      await waitFor(await CreatePosition.getForm(), "attached")
      await waitFor(await CreatePosition.getForm(), "visible")
      await CreatePosition.submitForm()
      await waitFor(await CreatePosition.getPositionNameHelpBlock(), "attached")
      await waitFor(await CreatePosition.getPositionNameHelpBlock(), "visible")
      await waitFor(await CreatePosition.getOrganizationHelpBlock(), "attached")
      await waitFor(await CreatePosition.getOrganizationHelpBlock(), "visible")
      await pwExpect(
        await CreatePosition.getPositionNameHelpBlock()
      ).toHaveText("Position name is required", {
        useInnerText: true
      })
      await pwExpect(
        await CreatePosition.getOrganizationHelpBlock()
      ).toHaveText("Organization is required", {
        useInnerText: true
      })
    })
    test("Should display possible duplicates with similar names", async () => {
      await (
        await CreatePosition.getPositionNameInput()
      ).fill(String(SIMILAR_ADVISOR_POSITION_NAME))
      await waitFor(await CreatePosition.getDuplicatesButton(), "visible")
      await (await CreatePosition.getDuplicatesButton()).click()
      await waitFor(await CreatePosition.getModalContent(), "visible")
      const similar = (
        await (await CreatePosition.getSimilarPosition()).innerText()
      ).trim()
      await waitFor(await CreatePosition.getModalCloseButton(), "visible")
      await (await CreatePosition.getModalCloseButton()).click()
      await waitFor(await CreatePosition.getModalContent(), "visible", {
        reverse: true
      })
      expect(similar).to.equal("EF 1.1 Advisor for Agriculture")
    })
    test("Should successfully create a position in an advisor organization when required fields are filled", async () => {
      await (await CreatePosition.getPositionNameInput()).fill("Test Position")
      await (await CreatePosition.getOrganizationInput()).click()
      await (
        await CreatePosition.getOrganizationInput()
      ).fill(String(ADMIN_ORG))
      await CreatePosition.waitForOrgAdvancedSelectToChange(ADMIN_ORG_COMPLETE)
      await pwExpect(
        await CreatePosition.getOrgAdvancedSelectFirstItem()
      ).toContainText(ADMIN_ORG_COMPLETE, {
        useInnerText: true
      })
      await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()

      // First select member role
      await (await CreatePosition.getRoleMemberButton()).click()
      // Ensure role-member-input is selected
      await pwExpect(await CreatePosition.getRoleMemberInput()).toBeChecked()

      // Will create position with deputy role
      await (await CreatePosition.getRoleDeputyButton()).click()
      // Ensure role-deputy-input is selected
      await pwExpect(await CreatePosition.getRoleDeputyInput()).toBeChecked()
      // Ensure role-member-input is not selected
      await pwExpect(
        await CreatePosition.getRoleMemberInput()
      ).not.toBeChecked()
      // Ensure role-leader-input is not selected
      await pwExpect(
        await CreatePosition.getRoleLeaderInput()
      ).not.toBeChecked()
      await (await CreatePosition.getLocationInput()).click()
      await (await CreatePosition.getLocAdvancedSelectFirstItem()).click()
      await CreatePosition.submitForm()
      await CreatePosition.waitForAlertSuccessToLoad()
    })
    test("Should successfully create a position in an interlocutor organization when required fields are filled", async () => {
      await CreatePosition.openAsAdminUser()
      await waitFor(await CreatePosition.getForm(), "attached")
      await waitFor(await CreatePosition.getForm(), "visible")
      await (await CreatePosition.getPositionNameInput()).fill("Test Position")
      await (await CreatePosition.getOrganizationInput()).click()
      await (
        await CreatePosition.getOrganizationInput()
      ).fill(String(INTERLOCUTOR_ORG))
      await CreatePosition.waitForOrgAdvancedSelectToChange(
        INTERLOCUTOR_ORG_COMPLETE
      )
      await pwExpect(
        await CreatePosition.getOrgAdvancedSelectFirstItem()
      ).toContainText(INTERLOCUTOR_ORG_COMPLETE, {
        useInnerText: true
      })
      await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()

      // First select deputy role
      await (await CreatePosition.getRoleDeputyButton()).click()
      // Ensure role-deputy-input is selected
      await pwExpect(await CreatePosition.getRoleDeputyInput()).toBeChecked()

      // Will create position with leader role
      await (await CreatePosition.getRoleLeaderButton()).click()
      // Ensure role-leader-input is selected
      await pwExpect(await CreatePosition.getRoleLeaderInput()).toBeChecked()
      // Ensure role-member-input is not selected
      await pwExpect(
        await CreatePosition.getRoleMemberInput()
      ).not.toBeChecked()
      // Ensure role-deputy-input is not selected
      await pwExpect(
        await CreatePosition.getRoleDeputyInput()
      ).not.toBeChecked()
      await CreatePosition.submitForm()
      await CreatePosition.waitForAlertSuccessToLoad()
      await CreatePosition.logout()
    })
    test("Should not display possible duplicates button", async () => {
      await CreatePosition.openAsAdminUser()
      await waitFor(await CreatePosition.getForm(), "attached")
      await waitFor(await CreatePosition.getForm(), "visible")
      await (
        await CreatePosition.getPositionNameInput()
      ).fill(String(NOT_SIMILAR_ADVISOR_POSITION_NAME))
      await pwExpect(await CreatePosition.getDuplicatesButton()).toHaveCount(0)
    })
  })
})
