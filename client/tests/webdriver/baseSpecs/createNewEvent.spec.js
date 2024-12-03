import { expect } from "chai"
import CreateEvent from "../pages/createNewEvent.page"

const ORG = "ANET Admin"
const ORG_COMPLETE = "ANET Administrators"

describe("Create event page", () => {
  describe("When creating an event", () => {
    it("Should show required data warnings when submitting empty form", async() => {
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
        await (await CreateEvent.getHostOrgHelpBlock()).getText()
      ).to.equal("You must provide the Host Organization")
      expect(
        await (await CreateEvent.getAdminOrgHelpBlock()).getText()
      ).to.equal("You must provide the Admin Organization")
      expect(
        await (await CreateEvent.getStartDateHelpBlock()).getText()
      ).to.equal("startDate is a required field")
      expect(
        await (await CreateEvent.getEndDateHelpBlock()).getText()
      ).to.equal("endDate is a required field")
    })

    it("Should successfully create an event when required fields are filled", async() => {
      await (await CreateEvent.getNameInput()).waitForDisplayed()
      await (await CreateEvent.getNameInput()).setValue("Test Event Series")

      await (
        await CreateEvent.getTypeInput()
      ).selectByAttribute("value", "CONFERENCE")

      await (await CreateEvent.getStartDateInput()).waitForDisplayed()
      await (await CreateEvent.getStartDateInput()).setValue("01-01-2025")

      await (await CreateEvent.getEndDateInput()).waitForDisplayed()
      await (await CreateEvent.getEndDateInput()).setValue("02-01-2025")

      await (await CreateEvent.getHostOrganizationInput()).click()
      await (await CreateEvent.getHostOrganizationInput()).setValue(ORG)
      await CreateEvent.waitForHostOrgAdvancedSelectToChange(ORG_COMPLETE)
      expect(
        await (await CreateEvent.getHostOrgAdvancedSelectFirstItem()).getText()
      ).to.include(ORG_COMPLETE)
      await (await CreateEvent.getHostOrgAdvancedSelectFirstItem()).click()

      await (await CreateEvent.getAdminOrganizationInput()).click()
      await (await CreateEvent.getAdminOrganizationInput()).setValue(ORG)
      await CreateEvent.waitForAdminOrgAdvancedSelectToChange(ORG_COMPLETE)
      expect(
        await (await CreateEvent.getAdminOrgAdvancedSelectFirstItem()).getText()
      ).to.include(ORG_COMPLETE)
      await (await CreateEvent.getAdminOrgAdvancedSelectFirstItem()).click()

      await CreateEvent.submitForm()
      await CreateEvent.waitForAlertSuccessToLoad()
    })
  })
})
