import { expect } from "@playwright/test"
import CreateEvent from "../pages/createNewEvent.page.js"
import { test, waitFor } from "../support.js"

const ORG = "ANET Admin"
const ORG_COMPLETE = "ANET Administrators"
const POSITION = "anet"
const POSITION_COMPLETE = "ANET Administrator"
const ORGANIZATION = "moi"
const ORGANIZATION_COMPLETE = "MoI | Ministry of Interior"
const PERSON = "jacob"
const PERSON_COMPLETE = "CIV Jacob Jacobson"
test.describe("Create event page", () => {
  test.describe("When creating an event as admin", () => {
    test("Should show required data warnings when submitting empty form", async () => {
      await CreateEvent.openAsAdminUser()
      await waitFor(await CreateEvent.getForm(), "visible")
      await CreateEvent.submitForm()
      await waitFor(await CreateEvent.getNameHelpBlock(), "visible")
      await waitFor(await CreateEvent.getTypeHelpBlock(), "visible")
      await waitFor(await CreateEvent.getStartDateHelpBlock(), "visible")
      await waitFor(await CreateEvent.getEndDateHelpBlock(), "visible")
      await expect(await CreateEvent.getNameHelpBlock()).toHaveText(
        "name is a required field",
        {
          useInnerText: true
        }
      )
      await expect(await CreateEvent.getStartDateHelpBlock()).toHaveText(
        "startDate is a required field",
        {
          useInnerText: true
        }
      )
      await expect(await CreateEvent.getEndDateHelpBlock()).toHaveText(
        "endDate is a required field",
        {
          useInnerText: true
        }
      )
    })
    test("Should successfully create an event when required fields are filled", async () => {
      await (await CreateEvent.getNameInput()).fill("Test Event")
      await (
        await CreateEvent.getTypeInput()
      ).selectOption({
        label: "Conference"
      })
      await (await CreateEvent.getStartDateInput()).fill("01-01-2025 00:00")
      await (await CreateEvent.getEndDateInput()).fill("02-01-2025 23:59")
      await (await CreateEvent.getOwnerOrganizationInput()).click()
      await (await CreateEvent.getOwnerOrganizationInput()).fill(String(ORG))
      await CreateEvent.waitForOwnerOrgAdvancedSelectToChange(ORG_COMPLETE)
      await expect(
        await CreateEvent.getOwnerOrgAdvancedSelectFirstItem()
      ).toContainText(ORG_COMPLETE, {
        useInnerText: true
      })
      await (await CreateEvent.getOwnerOrgAdvancedSelectFirstItem()).click()
      await (await CreateEvent.getHostRelatedObjectsInput()).click()
      // Add an organization
      await (
        await CreateEvent.getHostRelatedObjectsInput()
      ).fill(String(ORGANIZATION))
      await CreateEvent.waitForRelatedObjectsAdvancedSelectToChange(
        ORGANIZATION_COMPLETE
      )
      await expect(
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(ORGANIZATION_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await expect(
        await CreateEvent.getRelatedObjectsTableEntry(ORGANIZATION_COMPLETE)
      ).not.toHaveCount(0)
      // Add a position
      await CreateEvent.selectHostType("Positions")
      await (
        await CreateEvent.getHostRelatedObjectsInput()
      ).fill(String(POSITION))
      await CreateEvent.waitForRelatedObjectsAdvancedSelectToChange(
        POSITION_COMPLETE
      )
      await expect(
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(POSITION_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      // The position is added to a table underneath, so relatedObjects table exists now

      await expect(await CreateEvent.getRelatedObjectsTable()).not.toHaveCount(
        0
      )
      await expect(
        await CreateEvent.getRelatedObjectsTableEntry(POSITION_COMPLETE)
      ).not.toHaveCount(0)

      // Add a person
      await CreateEvent.selectHostType("People")
      await (
        await CreateEvent.getHostRelatedObjectsInput()
      ).fill(String(PERSON))
      await CreateEvent.waitForRelatedObjectsAdvancedSelectToChange(
        PERSON_COMPLETE
      )
      await expect(
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).toContainText(PERSON_COMPLETE, {
        useInnerText: true
      })
      await (
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await expect(
        await CreateEvent.getRelatedObjectsTableEntry(PERSON_COMPLETE)
      ).not.toHaveCount(0)
      await (await CreateEvent.getAdminOrganizationInput()).click()
      await (await CreateEvent.getAdminOrganizationInput()).fill(String(ORG))
      await CreateEvent.waitForAdminOrgAdvancedSelectToChange(ORG_COMPLETE)
      await expect(
        await CreateEvent.getAdminOrgAdvancedSelectFirstItem()
      ).toContainText(ORG_COMPLETE, {
        useInnerText: true
      })
      await (await CreateEvent.getAdminOrgAdvancedSelectFirstItem()).click()

      // Click outside the overlay
      await (await CreateEvent.getNameInput()).click()
      await CreateEvent.submitForm()
      await CreateEvent.waitForAlertSuccessToLoad()
      await CreateEvent.logout()
    })
  })
  test.describe("When creating an event as superuser", () => {
    test("Should warn when adminOrg is not correctly filled in", async () => {
      await CreateEvent.open()
      await waitFor(await CreateEvent.getForm(), "visible")
      await (await CreateEvent.getNameInput()).fill("Test Event 2")
      await (
        await CreateEvent.getTypeInput()
      ).selectOption({
        label: "Conference"
      })
      await (await CreateEvent.getStartDateInput()).fill("01-01-2025 00:00")
      await (await CreateEvent.getEndDateInput()).fill("02-01-2025 23:59")
      await CreateEvent.submitForm()
      await expect(await CreateEvent.getAlertDanger()).toHaveText(
        "You do not have permissions to do this",
        {
          useInnerText: true
        }
      )
      const adminOrg = "EF 2.2"
      await (await CreateEvent.getAdminOrganizationInput()).click()
      await (
        await CreateEvent.getAdminOrganizationInput()
      ).fill(String(adminOrg))
      await CreateEvent.waitForAdminOrgAdvancedSelectToChange(adminOrg)
      await expect(
        await CreateEvent.getAdminOrgAdvancedSelectFirstItem()
      ).toContainText(adminOrg, {
        useInnerText: true
      })
      await (await CreateEvent.getAdminOrgAdvancedSelectFirstItem()).click()
      await CreateEvent.submitForm()
      await CreateEvent.waitForAlertSuccessToLoad()
      await CreateEvent.logout()
    })
  })
})
