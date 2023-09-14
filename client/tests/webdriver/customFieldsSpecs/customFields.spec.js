import { expect } from "chai"
import CreatePerson from "../pages/createNewPerson.page"
import CreateReport from "../pages/createReport.page"

const INVALID_NUMBER_INPUT = "-10"
const VALID_NUMBER_INPUT = "10"
const TRAIN_ENGAGEMENT_BUTTON = "train"

const REQUIRED_PERSON_FIELDS = {
  lastname: "customPerson",
  rank: "CIV",
  gender: "MALE"
}

describe("When working with custom fields for different anet objects", () => {
  // ------------------------------ REPORT CUSTOM FIELDS -----------------------------------------
  describe("For report's custom fields", () => {
    it("Should be able load a new report form", async() => {
      await CreateReport.openAsAdminUser()
      await (await CreateReport.getForm()).waitForExist()
      await (await CreateReport.getForm()).waitForDisplayed()
    })

    it("When the engagement type is not defined, it should not display fields only visible when a certain engagement type is selected", async() => {
      const toggleFields =
        await CreateReport.getFieldsToggledVisibilityByTrainButton()
      for (const invisField of toggleFields) {
        expect(await invisField.isExisting()).to.equal(false)
      }

      const notToggleFields =
        await CreateReport.getFieldsNotToggledVisibilityByTrainButton()
      for (const invisField of notToggleFields) {
        expect(await invisField.isExisting()).to.equal(false)
      }
    })

    it("Selecting the train engagement type should toggle the correct invisible fields", async() => {
      const trainButton = await CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      await trainButton.waitForExist()
      await trainButton.waitForDisplayed()
      await trainButton.click()

      const toggleFields =
        await CreateReport.getFieldsToggledVisibilityByTrainButton()
      for (const nowVisibleField of toggleFields) {
        await nowVisibleField.waitForExist()
        await nowVisibleField.waitForDisplayed()
      }
      // train button active here so numberField will be visible

      const notToggleFields =
        await CreateReport.getFieldsNotToggledVisibilityByTrainButton()
      for (const stillInvisField of notToggleFields) {
        expect(await stillInvisField.isExisting()).to.equal(false)
      }
    })

    it("Should persist previous valid data when toggling field's visibility", async() => {
      await (
        await CreateReport.getNumberTrainedField()
      ).setValue(VALID_NUMBER_INPUT)
      const trainButton = await CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      await trainButton.click()
      await (
        await CreateReport.getNumberTrainedFormGroup()
      ).waitForExist({ reverse: true })
      // turn on train option to make numberField visible
      await trainButton.click()
      await (await CreateReport.getNumberTrainedFormGroup()).waitForExist()

      expect(
        await (await CreateReport.getNumberTrainedField()).getValue()
      ).to.equal(VALID_NUMBER_INPUT)
    })

    it("Should persist previous invalid data when toggling field's visibility", async() => {
      await CreateReport.deleteInput(CreateReport.getNumberTrainedField())
      await (
        await CreateReport.getNumberTrainedField()
      ).setValue(INVALID_NUMBER_INPUT)
      await (await CreateReport.getNumberTrainedErrorText()).waitForExist()
      // Actually see the validation warning
      expect(
        await (await CreateReport.getNumberTrainedErrorText()).getText()
      ).to.equal("Number trained must be greater than or equal to 1")
      const trainButton = await CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      await trainButton.click()
      await (
        await CreateReport.getNumberTrainedFormGroup()
      ).waitForExist({ reverse: true })
      // turn on train option to make numberField visible
      await trainButton.click()
      await (await CreateReport.getNumberTrainedFormGroup()).waitForExist()

      expect(
        await (await CreateReport.getNumberTrainedField()).getValue()
      ).to.equal(INVALID_NUMBER_INPUT)
    })

    it("Should validate visible field", async() => {
      await CreateReport.deleteInput(CreateReport.getNumberTrainedField())
      await (
        await CreateReport.getNumberTrainedField()
      ).setValue(INVALID_NUMBER_INPUT)
      await (await CreateReport.getNumberTrainedErrorText()).waitForExist()
      expect(
        await (await CreateReport.getNumberTrainedErrorText()).getText()
      ).to.include("Number trained must be greater than or equal to 1")
      await CreateReport.submitForm()
      await CreateReport.waitForAlertToLoad()

      expect(await (await CreateReport.getAlert()).getText()).to.include(
        "Number trained must be greater than or equal to 1"
      )
    })

    it("Should not validate invisible field", async() => {
      await (await CreateReport.getEditButton()).click()
      await (await CreateReport.getForm()).waitForExist()
      await (await CreateReport.getForm()).waitForDisplayed()

      const trainButton = await CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      // It was invalid from previous test case
      await trainButton.click()

      await CreateReport.submitForm()
      await CreateReport.waitForAlertToLoad()

      expect(await (await CreateReport.getAlert()).getText()).to.not.include(
        "Number trained must be greater than or equal to 1"
      )
    })

    it("Should show valid visible field after saving", async() => {
      // we are on show page after submitting
      await (await CreateReport.getEditButton()).click()
      await (await CreateReport.getForm()).waitForExist()
      await (await CreateReport.getForm()).waitForDisplayed()

      const trainButton = await CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn on train option to make numberField visible
      await trainButton.click()
      await (await CreateReport.getNumberTrainedFormGroup()).waitForExist()
      await CreateReport.deleteInput(CreateReport.getNumberTrainedField())
      await (
        await CreateReport.getNumberTrainedField()
      ).setValue(VALID_NUMBER_INPUT)

      await CreateReport.submitForm()
      await CreateReport.waitForAlertToLoad()

      expect(
        await (await CreateReport.getNumberTrainedFieldShowed()).getText()
      ).to.include(VALID_NUMBER_INPUT.toString())
    })

    it("Should discard invisible fields after saving even if it is valid", async() => {
      await (await CreateReport.getEditButton()).click()
      await (await CreateReport.getForm()).waitForExist()
      await (await CreateReport.getForm()).waitForDisplayed()

      const trainButton = await CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // give valid input before making invisible
      await CreateReport.deleteInput(CreateReport.getNumberTrainedField())
      await (
        await CreateReport.getNumberTrainedField()
      ).setValue(VALID_NUMBER_INPUT)
      // goes invisible
      await trainButton.click()
      await CreateReport.submitForm()
      await CreateReport.waitForAlertToLoad()

      expect(
        await (await CreateReport.getNumberTrainedFieldShowed()).getText()
      ).to.not.include(VALID_NUMBER_INPUT.toString())
    })

    it("Should logout", async() => {
      await CreateReport.logout()
    })
  })
  // ------------------------------ PERSON CUSTOM FIELDS -----------------------------------------
  describe("For person's custom fields", () => {
    it("Should be able load a new person form and fill normal required fields", async() => {
      await CreatePerson.openAsAdmin()
      await (await CreatePerson.getForm()).waitForExist()
      await (await CreatePerson.getForm()).waitForDisplayed()
      // fill other required fields at the beginning
      await (
        await CreatePerson.getLastName()
      ).setValue(REQUIRED_PERSON_FIELDS.lastname)
      await (
        await CreatePerson.getRank()
      ).selectByAttribute("value", REQUIRED_PERSON_FIELDS.rank)
      await (
        await CreatePerson.getGender()
      ).selectByAttribute("value", REQUIRED_PERSON_FIELDS.gender)
    })

    it("Should not show default invisible fields", async() => {
      const fields = await CreatePerson.getDefaultInvisibleCustomFields()
      for (const field of fields) {
        expect(await field.isExisting()).to.eq(false)
      }
      // Date field is invisible by default
      await (await CreatePerson.getAddArrayObjectButton()).click()
      await (
        await CreatePerson.getObjectDateField()
      ).waitForExist({ reverse: true })
    })

    it("Should toggle correct invisible fields", async() => {
      // green toggles every invisible field to visible
      await (await CreatePerson.getGreenButton()).click()
      const fields = await CreatePerson.getDefaultInvisibleCustomFields()
      for (const field of fields) {
        await field.waitForExist()
      }
      // Also it toggles array_of_objects date field
      await (await CreatePerson.getObjectDateField()).waitForExist()
    })

    it("Should persist previous valid data when toggling field's visibility", async() => {
      await (
        await CreatePerson.getNumberCustomField()
      ).setValue(VALID_NUMBER_INPUT)
      // make default invisible fields invisible again, amber color does that
      await (await CreatePerson.getAmberButton()).click()
      await (
        await CreatePerson.getNumberCustomFieldContainer()
      ).waitForExist({
        reverse: true
      })
      // make visible
      await (await CreatePerson.getGreenButton()).click()
      await (await CreatePerson.getNumberCustomFieldContainer()).waitForExist()

      expect(
        await (await CreatePerson.getNumberCustomField()).getValue()
      ).be.equal(VALID_NUMBER_INPUT)
    })

    it("Should persist previous invalid data when toggling field's visibility", async() => {
      await CreatePerson.deleteInput(CreatePerson.getNumberCustomField())
      await (
        await CreatePerson.getNumberCustomField()
      ).setValue(INVALID_NUMBER_INPUT)
      // Actually see the validation warning
      await (await CreatePerson.getNumberCustomFieldHelpText()).waitForExist()
      // make invisible
      await (await CreatePerson.getAmberButton()).click()
      await (
        await CreatePerson.getNumberCustomFieldContainer()
      ).waitForExist({
        reverse: true
      })
      // make visible
      await (await CreatePerson.getGreenButton()).click()
      await (await CreatePerson.getNumberCustomFieldContainer()).waitForExist()

      expect(
        await (await CreatePerson.getNumberCustomField()).getValue()
      ).to.equal(INVALID_NUMBER_INPUT)
    })

    it("Should validate visible field", async() => {
      await CreatePerson.deleteInput(CreatePerson.getNumberCustomField())
      await (
        await CreatePerson.getNumberCustomField()
      ).setValue(INVALID_NUMBER_INPUT)
      await (await CreatePerson.getNumberCustomFieldHelpText()).waitForExist()
      expect(
        await (await CreatePerson.getNumberCustomFieldHelpText()).getText()
      ).to.include("greater than")
    })

    it("Should not validate invisible field so we can submit the form", async() => {
      // make invisible
      await (await CreatePerson.getAmberButton()).click()
      await (
        await CreatePerson.getNumberCustomFieldContainer()
      ).waitForExist({
        reverse: true
      })
      await browser.pause(500) // wait for the rendering of custom fields
      await CreatePerson.submitForm()
      await CreatePerson.waitForAlertSuccessToLoad()
    })

    it("Should logout", async() => {
      await CreatePerson.logout()
    })
  })
})
