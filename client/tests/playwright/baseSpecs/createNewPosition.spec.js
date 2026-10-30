import { expect, test } from "@playwright/test"
import CreatePositionPageObject from "../pages/createNewPosition.page.js"

test.describe(() => {
  let page, CreatePosition
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    CreatePosition = new CreatePositionPageObject(page)
  })
  const ADMIN_ORG = "ANET Admin"
  const ADMIN_ORG_COMPLETE = "ANET Administrators"
  const INTERLOCUTOR_ORG = "MoI"
  const INTERLOCUTOR_ORG_COMPLETE = "MoI | Ministry of Interior"
  const NOT_SIMILAR_ADVISOR_POSITION_NAME = "XXX"
  const SIMILAR_ADVISOR_POSITION_NAME = "EF 1.1 Advisor for Agriculture"
  test("Create position page", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 5)

    await test.step("When creating a position", async () => {
      await test.step(
        "Should show name and organization to be required when submitting empty form",
        async () => {
          await CreatePosition.openAsAdminUser()
          await (
            await CreatePosition.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await CreatePosition.submitForm()
          await (
            await CreatePosition.getPositionNameHelpBlock()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await CreatePosition.getOrganizationHelpBlock()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await expect(
            await CreatePosition.getPositionNameHelpBlock()
          ).toHaveText("Position name is required", {
            useInnerText: true
          })
          await expect(
            await CreatePosition.getOrganizationHelpBlock()
          ).toHaveText("Organization is required", {
            useInnerText: true
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should display possible duplicates with similar names",
        async () => {
          await (
            await CreatePosition.getPositionNameInput()
          ).fill(String(SIMILAR_ADVISOR_POSITION_NAME))
          await (await CreatePosition.getDuplicatesButton()).click()
          await (
            await CreatePosition.getModalContent()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await expect(await CreatePosition.getSimilarPosition()).toHaveText(
            "EF 1.1 Advisor for Agriculture",
            {
              useInnerText: true
            }
          )
          await (await CreatePosition.getModalCloseButton()).click()
          await (
            await CreatePosition.getModalContent()
          ).waitFor({
            state: "hidden",
            timeout: 10000
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should successfully create a position in an advisor organization when required fields are filled",
        async () => {
          await (
            await CreatePosition.getPositionNameInput()
          ).fill("Test Position")
          await (await CreatePosition.getOrganizationInput()).click()
          await (
            await CreatePosition.getOrganizationInput()
          ).fill(String(ADMIN_ORG))
          await CreatePosition.waitForOrgAdvancedSelectToChange(
            ADMIN_ORG_COMPLETE
          )
          await expect(
            await CreatePosition.getOrgAdvancedSelectFirstItem()
          ).toContainText(ADMIN_ORG_COMPLETE, {
            useInnerText: true
          })
          await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()

          // First select member role
          await (await CreatePosition.getRoleMemberButton()).click()
          // Ensure role-member-input is selected
          await expect(await CreatePosition.getRoleMemberInput()).toBeChecked()

          // Will create position with deputy role
          await (await CreatePosition.getRoleDeputyButton()).click()
          // Ensure role-deputy-input is selected
          await expect(await CreatePosition.getRoleDeputyInput()).toBeChecked()
          // Ensure role-member-input is not selected
          await expect(
            await CreatePosition.getRoleMemberInput()
          ).not.toBeChecked()
          // Ensure role-leader-input is not selected
          await expect(
            await CreatePosition.getRoleLeaderInput()
          ).not.toBeChecked()
          await (await CreatePosition.getLocationInput()).click()
          await (await CreatePosition.getLocAdvancedSelectFirstItem()).click()
          await CreatePosition.submitForm()
          await CreatePosition.waitForAlertSuccessToLoad()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should successfully create a position in an interlocutor organization when required fields are filled",
        async () => {
          await CreatePosition.openAsAdminUser()
          await (
            await CreatePosition.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await CreatePosition.getPositionNameInput()
          ).fill("Test Position")
          await (await CreatePosition.getOrganizationInput()).click()
          await (
            await CreatePosition.getOrganizationInput()
          ).fill(String(INTERLOCUTOR_ORG))
          await CreatePosition.waitForOrgAdvancedSelectToChange(
            INTERLOCUTOR_ORG_COMPLETE
          )
          await expect(
            await CreatePosition.getOrgAdvancedSelectFirstItem()
          ).toContainText(INTERLOCUTOR_ORG_COMPLETE, {
            useInnerText: true
          })
          await (await CreatePosition.getOrgAdvancedSelectFirstItem()).click()

          // First select deputy role
          await (await CreatePosition.getRoleDeputyButton()).click()
          // Ensure role-deputy-input is selected
          await expect(await CreatePosition.getRoleDeputyInput()).toBeChecked()

          // Will create position with leader role
          await (await CreatePosition.getRoleLeaderButton()).click()
          // Ensure role-leader-input is selected
          await expect(await CreatePosition.getRoleLeaderInput()).toBeChecked()
          // Ensure role-member-input is not selected
          await expect(
            await CreatePosition.getRoleMemberInput()
          ).not.toBeChecked()
          // Ensure role-deputy-input is not selected
          await expect(
            await CreatePosition.getRoleDeputyInput()
          ).not.toBeChecked()
          await CreatePosition.submitForm()
          await CreatePosition.waitForAlertSuccessToLoad()
          await CreatePosition.logout()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not display possible duplicates button",
        async () => {
          await CreatePosition.openAsAdminUser()
          await (
            await CreatePosition.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await CreatePosition.getPositionNameInput()
          ).fill(String(NOT_SIMILAR_ADVISOR_POSITION_NAME))
          await expect(await CreatePosition.getDuplicatesButton()).toHaveCount(
            0
          )
        },
        { timeout: stepTimeout }
      )
    })
  })
})
