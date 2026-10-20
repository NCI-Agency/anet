import { expect as pwExpect } from "@playwright/test"
import CreateEventSeries from "../pages/createNewEventSeries.page.js"
import { test, waitFor } from "../support.js"

const ORG = "ANET Admin"
const ORG_COMPLETE = "ANET Administrators"
const POSITION = "anet"
const POSITION_COMPLETE = "ANET Administrator"
const ORGANIZATION = "moi"
const ORGANIZATION_COMPLETE = "MoI | Ministry of Interior"
const PERSON = "jacob"
const PERSON_COMPLETE = "CIV Jacob Jacobson"
test.describe("Create event series page", () => {
  test.describe("When creating an event series as admin", () => {
    test("Should show required data warnings when submitting empty form", async () => {
      await CreateEventSeries.openAsAdminUser()
      await waitFor(await CreateEventSeries.getForm(), "attached")
      await waitFor(await CreateEventSeries.getForm(), "visible")
      await CreateEventSeries.submitForm()
      await waitFor(await CreateEventSeries.getNameHelpBlock(), "attached")
      await waitFor(await CreateEventSeries.getNameHelpBlock(), "visible")
      await pwExpect(await CreateEventSeries.getNameHelpBlock()).toHaveText(
        "name is a required field",
        {
          useInnerText: true
        }
      )
    })
    test("Should successfully create an event series when required fields are filled", async () => {
      await waitFor(await CreateEventSeries.getNameInput(), "visible")
      await (await CreateEventSeries.getNameInput()).fill("Test Event Series")
      await waitFor(
        await CreateEventSeries.getOwnerOrganizationInput(),
        "visible"
      )
      await (await CreateEventSeries.getOwnerOrganizationInput()).click()
      await (
        await CreateEventSeries.getOwnerOrganizationInput()
      ).fill(String(ORG))
      await CreateEventSeries.waitForOwnerOrgAdvancedSelectToChange(
        ORG_COMPLETE
      )
      await pwExpect(
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
      await pwExpect(
        await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(ORGANIZATION_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await pwExpect(
        await CreateEventSeries.getRelatedObjectsTableEntry(
          ORGANIZATION_COMPLETE
        )
      ).not.toHaveCount(0)
      // Add a position
      await (await CreateEventSeries.getMemberTypeButton("Positions")).click()
      await CreateEventSeries.deleteInput(
        CreateEventSeries.getHostRelatedObjectsInput()
      )
      await (
        await CreateEventSeries.getHostRelatedObjectsInput()
      ).fill(String(POSITION))
      await CreateEventSeries.waitForRelatedObjectsAdvancedSelectToChange(
        POSITION_COMPLETE
      )
      await pwExpect(
        await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(POSITION_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      // The position is added to a table underneath, so relatedObjects table exists now

      await pwExpect(
        await CreateEventSeries.getRelatedObjectsTable()
      ).not.toHaveCount(0)
      await pwExpect(
        await CreateEventSeries.getRelatedObjectsTableEntry(POSITION_COMPLETE)
      ).not.toHaveCount(0)

      // Add a person
      await (await CreateEventSeries.getMemberTypeButton("People")).click()
      await CreateEventSeries.deleteInput(
        CreateEventSeries.getHostRelatedObjectsInput()
      )
      await (
        await CreateEventSeries.getHostRelatedObjectsInput()
      ).fill(String(PERSON))
      await CreateEventSeries.waitForRelatedObjectsAdvancedSelectToChange(
        PERSON_COMPLETE
      )
      await pwExpect(
        await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(PERSON_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateEventSeries.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await pwExpect(
        await CreateEventSeries.getRelatedObjectsTableEntry(PERSON_COMPLETE)
      ).not.toHaveCount(0)

      // Click outside the overlay
      await (await CreateEventSeries.getNameInput()).click()
      await waitFor(
        await CreateEventSeries.getAdminOrganizationInput(),
        "visible"
      )
      await (await CreateEventSeries.getAdminOrganizationInput()).click()
      await (
        await CreateEventSeries.getAdminOrganizationInput()
      ).fill(String(ORG))
      await CreateEventSeries.waitForAdminOrgAdvancedSelectToChange(
        ORG_COMPLETE
      )
      await pwExpect(
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
    })
  })
  test.describe("When creating an event series as superuser", () => {
    test("Should warn when adminOrg is not correctly filled in", async () => {
      await CreateEventSeries.open()
      await waitFor(await CreateEventSeries.getForm(), "attached")
      await waitFor(await CreateEventSeries.getForm(), "visible")
      await waitFor(await CreateEventSeries.getNameInput(), "visible")
      await (await CreateEventSeries.getNameInput()).fill("Test Event Series")
      await CreateEventSeries.submitForm()
      await pwExpect(await CreateEventSeries.getAlertDanger()).toHaveText(
        "You do not have permissions to do this",
        {
          useInnerText: true
        }
      )
      const adminOrg = "EF 2.2"
      await waitFor(
        await CreateEventSeries.getAdminOrganizationInput(),
        "visible"
      )
      await (await CreateEventSeries.getAdminOrganizationInput()).click()
      await (
        await CreateEventSeries.getAdminOrganizationInput()
      ).fill(String(adminOrg))
      await CreateEventSeries.waitForAdminOrgAdvancedSelectToChange(adminOrg)
      await pwExpect(
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
    })
  })
})
