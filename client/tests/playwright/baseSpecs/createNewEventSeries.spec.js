import { expect, test } from "@playwright/test"
import CreateEventSeriesPageObject from "../pages/createNewEventSeries.page.js"

test.describe(() => {
  let page, CreateEventSeries
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    CreateEventSeries = new CreateEventSeriesPageObject(page)
  })
  const ORG = "ANET Admin"
  const ORG_COMPLETE = "ANET Administrators"
  const POSITION = "anet"
  const POSITION_COMPLETE = "ANET Administrator"
  const ORGANIZATION = "moi"
  const ORGANIZATION_COMPLETE = "MoI | Ministry of Interior"
  const PERSON = "jacob"
  const PERSON_COMPLETE = "CIV Jacob Jacobson"
  test("Create event series page", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 3)

    await test.step("When creating an event series as admin", async () => {
      await test.step(
        "Should show required data warnings when submitting empty form",
        async () => {
          await CreateEventSeries.openAsAdminUser()
          await (
            await CreateEventSeries.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await CreateEventSeries.submitForm()
          await (
            await CreateEventSeries.getNameHelpBlock()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await expect(await CreateEventSeries.getNameHelpBlock()).toHaveText(
            "name is a required field",
            {
              useInnerText: true
            }
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should successfully create an event series when required fields are filled",
        async () => {
          await (
            await CreateEventSeries.getNameInput()
          ).fill("Test Event Series")
          await (await CreateEventSeries.getOwnerOrganizationInput()).click()
          await (
            await CreateEventSeries.getOwnerOrganizationInput()
          ).fill(String(ORG))
          await CreateEventSeries.waitForOwnerOrgAdvancedSelectToChange(
            ORG_COMPLETE
          )
          await expect(
            await CreateEventSeries.getOwnerOrgAdvancedSelectFirstItem()
          ).toContainText(ORG_COMPLETE, {
            useInnerText: true
          })
          await (
            await CreateEventSeries.getOwnerOrgAdvancedSelectFirstItem()
          ).click()
          await (await CreateEventSeries.getHostRelatedObjectsInput()).click()
          // Add an organization
          await (
            await CreateEventSeries.getHostRelatedObjectsInput()
          ).fill(String(ORGANIZATION))
          await CreateEventSeries.waitForRelatedObjectsAdvancedSelectToChange(
            ORGANIZATION_COMPLETE
          )
          await expect(
            await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
          ).toContainText(ORGANIZATION_COMPLETE, {
            useInnerText: true
          })
          await (
            await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
          ).click()
          await expect(
            await CreateEventSeries.getRelatedObjectsTableEntry(
              ORGANIZATION_COMPLETE
            )
          ).not.toHaveCount(0)
          // Add a position
          await CreateEventSeries.selectHostType("Positions")
          await (
            await CreateEventSeries.getHostRelatedObjectsInput()
          ).fill(String(POSITION))
          await CreateEventSeries.waitForRelatedObjectsAdvancedSelectToChange(
            POSITION_COMPLETE
          )
          await expect(
            await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
          ).toContainText(POSITION_COMPLETE, {
            useInnerText: true
          })
          await (
            await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
          ).click()
          // The position is added to a table underneath, so relatedObjects table exists now

          await expect(
            await CreateEventSeries.getRelatedObjectsTable()
          ).not.toHaveCount(0)
          await expect(
            await CreateEventSeries.getRelatedObjectsTableEntry(
              POSITION_COMPLETE
            )
          ).not.toHaveCount(0)

          // Add a person
          await CreateEventSeries.selectHostType("People")
          await (
            await CreateEventSeries.getHostRelatedObjectsInput()
          ).fill(String(PERSON))
          await CreateEventSeries.waitForRelatedObjectsAdvancedSelectToChange(
            PERSON_COMPLETE
          )
          await expect(
            await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
          ).toContainText(PERSON_COMPLETE, {
            useInnerText: true
          })
          await (
            await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
          ).click()
          await expect(
            await CreateEventSeries.getRelatedObjectsTableEntry(PERSON_COMPLETE)
          ).not.toHaveCount(0)

          // Click outside the overlay
          await (await CreateEventSeries.getNameInput()).click()
          await (await CreateEventSeries.getAdminOrganizationInput()).click()
          await (
            await CreateEventSeries.getAdminOrganizationInput()
          ).fill(String(ORG))
          await CreateEventSeries.waitForAdminOrgAdvancedSelectToChange(
            ORG_COMPLETE
          )
          await expect(
            await CreateEventSeries.getAdminOrgAdvancedSelectFirstItem()
          ).toContainText(ORG_COMPLETE, {
            useInnerText: true
          })
          await (
            await CreateEventSeries.getAdminOrgAdvancedSelectFirstItem()
          ).click()
          await CreateEventSeries.submitForm()
          await CreateEventSeries.waitForAlertSuccessToLoad()
          await CreateEventSeries.logout()
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("When creating an event series as superuser", async () => {
      await test.step(
        "Should warn when adminOrg is not correctly filled in",
        async () => {
          await CreateEventSeries.open()
          await (
            await CreateEventSeries.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await CreateEventSeries.getNameInput()
          ).fill("Test Event Series")
          await CreateEventSeries.submitForm()
          await expect(await CreateEventSeries.getAlertDanger()).toHaveText(
            "You do not have permissions to do this",
            {
              useInnerText: true
            }
          )
          const adminOrg = "EF 2.2"
          await (await CreateEventSeries.getAdminOrganizationInput()).click()
          await (
            await CreateEventSeries.getAdminOrganizationInput()
          ).fill(String(adminOrg))
          await CreateEventSeries.waitForAdminOrgAdvancedSelectToChange(
            adminOrg
          )
          await expect(
            await CreateEventSeries.getAdminOrgAdvancedSelectFirstItem()
          ).toContainText(adminOrg, {
            useInnerText: true
          })
          await (
            await CreateEventSeries.getAdminOrgAdvancedSelectFirstItem()
          ).click()
          await CreateEventSeries.submitForm()
          await CreateEventSeries.waitForAlertSuccessToLoad()
          await CreateEventSeries.logout()
        },
        { timeout: stepTimeout }
      )
    })
  })
})
