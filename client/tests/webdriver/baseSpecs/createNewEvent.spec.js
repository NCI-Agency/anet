import { expect } from "chai"
import CreateEvent from "../pages/createNewEvent.page"

const ORG = "ANET Admin"
const ORG_COMPLETE = "ANET Administrators"
const POSITION = "anet"
const POSITION_COMPLETE = "ANET Administrator"
const ORGANIZATION = "moi"
const ORGANIZATION_COMPLETE = "MoI | Ministry of Interior"
const PERSON = "jacob"
const PERSON_COMPLETE = "CIV JACOBSON, Jacob"

const SHORT_WAIT_MS = 200

describe("Create event page", () => {
  describe("When creating an event as admin", () => {
    it("Should show required data warnings when submitting empty form", async () => {
      await CreateEvent.openAsAdminUser()
      await (await CreateEvent.getForm()).waitForExist()
      await (await CreateEvent.getForm()).waitForDisplayed()
      await CreateEvent.submitForm()
      await (await CreateEvent.getNameHelpBlock()).waitForExist()
      await (await CreateEvent.getNameHelpBlock()).waitForDisplayed()
      await (await CreateEvent.getTypeHelpBlock()).waitForExist()
      await (await CreateEvent.getTypeHelpBlock()).waitForDisplayed()
      await (await CreateEvent.getStartDateHelpBlock()).waitForExist()
      await (await CreateEvent.getStartDateHelpBlock()).waitForDisplayed()
      await (await CreateEvent.getEndDateHelpBlock()).waitForExist()
      await (await CreateEvent.getEndDateHelpBlock()).waitForDisplayed()

      expect(await (await CreateEvent.getNameHelpBlock()).getText()).to.equal(
        "name is a required field"
      )
      expect(
        await (await CreateEvent.getStartDateHelpBlock()).getText()
      ).to.equal("startDate is a required field")
      expect(
        await (await CreateEvent.getEndDateHelpBlock()).getText()
      ).to.equal("endDate is a required field")
    })

    it("Should successfully create an event when required fields are filled", async () => {
      await (await CreateEvent.getNameInput()).waitForDisplayed()
      await (await CreateEvent.getNameInput()).setValue("Test Event")

      await (await CreateEvent.getTypeInput()).selectByVisibleText("Conference")

      await (await CreateEvent.getStartDateInput()).waitForDisplayed()
      await (await CreateEvent.getStartDateInput()).setValue("01-01-2025 00:00")

      await (await CreateEvent.getEndDateInput()).waitForDisplayed()
      await (await CreateEvent.getEndDateInput()).setValue("02-01-2025 23:59")

      await (await CreateEvent.getOwnerOrganizationInput()).click()
      await (await CreateEvent.getOwnerOrganizationInput()).setValue(ORG)
      await CreateEvent.waitForOwnerOrgAdvancedSelectToChange(ORG_COMPLETE)
      expect(
        await (await CreateEvent.getOwnerOrgAdvancedSelectFirstItem()).getText()
      ).to.include(ORG_COMPLETE)
      await (await CreateEvent.getOwnerOrgAdvancedSelectFirstItem()).click()
      await (await CreateEvent.getHostRelatedObjectsInput()).click()
      // Add an organization
      await (
        await CreateEvent.getHostRelatedObjectsInput()
      ).setValue(ORGANIZATION)
      await CreateEvent.waitForAdvancedSelectToChange(
        ORGANIZATION_COMPLETE,
        CreateEvent.getRelatedObjectsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(ORGANIZATION_COMPLETE)
      await (
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await browser.pause(SHORT_WAIT_MS)
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateEvent.getRelatedObjectsTableEntry(ORGANIZATION_COMPLETE)
        ).isExisting()
      ).to.be.true
      // Add a position
      await (await CreateEvent.getMemberTypeButton("Positions")).click()
      await CreateEvent.deleteInput(CreateEvent.getHostRelatedObjectsInput())
      await (await CreateEvent.getHostRelatedObjectsInput()).setValue(POSITION)
      await CreateEvent.waitForAdvancedSelectToChange(
        POSITION_COMPLETE,
        CreateEvent.getRelatedObjectsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(POSITION_COMPLETE)
      await (
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await browser.pause(SHORT_WAIT_MS)
      // The position is added to a table underneath, so relatedObjects table exists now
      // eslint-disable-next-line no-unused-expressions
      expect(await (await CreateEvent.getRelatedObjectsTable()).isExisting()).to
        .be.true
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateEvent.getRelatedObjectsTableEntry(POSITION_COMPLETE)
        ).isExisting()
      ).to.be.true

      // Add a person
      await (await CreateEvent.getMemberTypeButton("People")).click()
      await CreateEvent.deleteInput(CreateEvent.getHostRelatedObjectsInput())
      await (await CreateEvent.getHostRelatedObjectsInput()).setValue(PERSON)
      await CreateEvent.waitForAdvancedSelectToChange(
        PERSON_COMPLETE,
        CreateEvent.getRelatedObjectsAdvancedSelectFirstItem
      )
      expect(
        await (
          await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
        ).getText()
      ).to.include(PERSON_COMPLETE)
      await (
        await CreateEvent.getRelatedObjectsAdvancedSelectFirstItem()
      ).click()
      await browser.pause(SHORT_WAIT_MS)
      // eslint-disable-next-line no-unused-expressions
      expect(
        await (
          await CreateEvent.getRelatedObjectsTableEntry(PERSON_COMPLETE)
        ).isExisting()
      ).to.be.true
      await (await CreateEvent.getAdminOrganizationInput()).click()
      await (await CreateEvent.getAdminOrganizationInput()).setValue(ORG)
      await CreateEvent.waitForAdminOrgAdvancedSelectToChange(ORG_COMPLETE)
      expect(
        await (await CreateEvent.getAdminOrgAdvancedSelectFirstItem()).getText()
      ).to.include(ORG_COMPLETE)
      await (await CreateEvent.getAdminOrgAdvancedSelectFirstItem()).click()

      await CreateEvent.submitForm()
      await CreateEvent.waitForAlertSuccessToLoad()

      await CreateEvent.logout()
    })
  })

  describe("When creating an event as superuser", () => {
    it("Should warn when adminOrg is not correctly filled in", async () => {
      await CreateEvent.open()
      await (await CreateEvent.getForm()).waitForExist()
      await (await CreateEvent.getForm()).waitForDisplayed()

      await (await CreateEvent.getNameInput()).waitForDisplayed()
      await (await CreateEvent.getNameInput()).setValue("Test Event 2")

      await (await CreateEvent.getTypeInput()).selectByVisibleText("Conference")

      await (await CreateEvent.getStartDateInput()).waitForDisplayed()
      await (await CreateEvent.getStartDateInput()).setValue("01-01-2025 00:00")

      await (await CreateEvent.getEndDateInput()).waitForDisplayed()
      await (await CreateEvent.getEndDateInput()).setValue("02-01-2025 23:59")

      await CreateEvent.submitForm()
      expect(await (await CreateEvent.getAlertDanger()).getText()).to.eq(
        "You must fill in the Admin Organization"
      )

      const adminOrg = "EF 2.2"

      await (await CreateEvent.getAdminOrganizationInput()).click()
      await (await CreateEvent.getAdminOrganizationInput()).setValue(adminOrg)
      await CreateEvent.waitForAdminOrgAdvancedSelectToChange(adminOrg)
      expect(
        await (await CreateEvent.getAdminOrgAdvancedSelectFirstItem()).getText()
      ).to.include(adminOrg)
      await (await CreateEvent.getAdminOrgAdvancedSelectFirstItem()).click()

      await CreateEvent.submitForm()
      await CreateEvent.waitForAlertSuccessToLoad()

      await CreateEvent.logout()
    })
  })
})
