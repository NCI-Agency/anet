import { expect } from "chai"
import CreateEventSeries from "../pages/createNewEventSeries.page"

const ORG = "ANET Admin"
const ORG_COMPLETE = "ANET Administrators"

describe("Create event series page", () => {
  describe("When creating an event series", () => {
    it("Should show required data warnings when submitting empty form", async() => {
      await CreateEventSeries.openAsAdminUser()
      await (await CreateEventSeries.getForm()).waitForExist()
      await (await CreateEventSeries.getForm()).waitForDisplayed()
      await CreateEventSeries.submitForm()
      await (await CreateEventSeries.getNameHelpBlock()).waitForExist()
      await (await CreateEventSeries.getNameHelpBlock()).waitForDisplayed()
      expect(
        await (await CreateEventSeries.getNameHelpBlock()).getText()
      ).to.equal("name is a required field")
      expect(
        await (await CreateEventSeries.getHostOrgHelpBlock()).getText()
      ).to.equal("You must provide the Host Organization")
      expect(
        await (await CreateEventSeries.getAdminOrgHelpBlock()).getText()
      ).to.equal("You must provide the Admin Organization")
    })

    it("Should successfully create an event series when required fields are filled", async() => {
      await (await CreateEventSeries.getNameInput()).waitForDisplayed()
      await (
        await CreateEventSeries.getNameInput()
      ).setValue("Test Event Series")
      await (
        await CreateEventSeries.getHostOrganizationInput()
      ).waitForDisplayed()
      await (await CreateEventSeries.getHostOrganizationInput()).click()
      await (await CreateEventSeries.getHostOrganizationInput()).setValue(ORG)
      await CreateEventSeries.waitForHostOrgAdvancedSelectToChange(ORG_COMPLETE)
      expect(
        await (
          await CreateEventSeries.getHostOrgAdvancedSelectFirstItem()
        ).getText()
      ).to.include(ORG_COMPLETE)
      await (
        await CreateEventSeries.getHostOrgAdvancedSelectFirstItem()
      ).click()

      await (
        await CreateEventSeries.getAdminOrganizationInput()
      ).waitForDisplayed()
      await (await CreateEventSeries.getAdminOrganizationInput()).click()
      await (await CreateEventSeries.getAdminOrganizationInput()).setValue(ORG)
      await CreateEventSeries.waitForAdminOrgAdvancedSelectToChange(
        ORG_COMPLETE
      )
      expect(
        await (
          await CreateEventSeries.getAdminOrgAdvancedSelectFirstItem()
        ).getText()
      ).to.include(ORG_COMPLETE)
      await (
        await CreateEventSeries.getAdminOrgAdvancedSelectFirstItem()
      ).click()

      await CreateEventSeries.submitForm()
      await CreateEventSeries.waitForAlertSuccessToLoad()
    })
  })
})
