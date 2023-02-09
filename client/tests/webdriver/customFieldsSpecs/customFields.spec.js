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
    it("Should be able load a new report form", () => {
      CreateReport.openAsAdminUser()
      CreateReport.getForm().waitForExist()
      CreateReport.getForm().waitForDisplayed()
    })

    it("When the engagement type is not defined, it should not display fields only visible when a certain engagement type is selected", () => {
      CreateReport.getFieldsToggledVisibilityByTrainButton().forEach(
        invisField => {
          expect(invisField.isExisting()).to.equal(false)
        }
      )

      CreateReport.getFieldsNotToggledVisibilityByTrainButton().forEach(
        invisField => {
          expect(invisField.isExisting()).to.equal(false)
        }
      )
    })

    it("Selecting the train engagement type should toggle the correct invisible fields", () => {
      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      trainButton.waitForExist()
      trainButton.waitForDisplayed()
      trainButton.click()
      CreateReport.getFieldsToggledVisibilityByTrainButton().forEach(
        nowVisibleField => {
          nowVisibleField.waitForExist()
          nowVisibleField.waitForDisplayed()
        }
      )
      // train button active here so numberField will be visible

      CreateReport.getFieldsNotToggledVisibilityByTrainButton().forEach(
        stillInvisField => {
          expect(stillInvisField.isExisting()).to.equal(false)
        }
      )
    })

    it("Should persist previous valid data when toggling field's visibility", () => {
      CreateReport.getNumberTrainedField().setValue(VALID_NUMBER_INPUT)
      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      trainButton.click()
      CreateReport.getNumberTrainedFormGroup().waitForExist({ reverse: true })
      // turn on train option to make numberField visible
      trainButton.click()
      CreateReport.getNumberTrainedFormGroup().waitForExist()

      expect(CreateReport.getNumberTrainedField().getValue()).to.equal(
        VALID_NUMBER_INPUT
      )
    })

    it("Should persist previous invalid data when toggling field's visibility", () => {
      CreateReport.deleteInput(CreateReport.getNumberTrainedField())
      CreateReport.getNumberTrainedField().setValue(INVALID_NUMBER_INPUT)
      CreateReport.getNumberTrainedErrorText().waitForExist()
      // Actually see the validation warning
      expect(CreateReport.getNumberTrainedErrorText().getText()).to.equal(
        "Number trained must be greater than or equal to 1"
      )
      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      trainButton.click()
      CreateReport.getNumberTrainedFormGroup().waitForExist({ reverse: true })
      // turn on train option to make numberField visible
      trainButton.click()
      CreateReport.getNumberTrainedFormGroup().waitForExist()

      expect(CreateReport.getNumberTrainedField().getValue()).to.equal(
        INVALID_NUMBER_INPUT
      )
    })

    it("Should validate visible field", () => {
      CreateReport.deleteInput(CreateReport.getNumberTrainedField())
      CreateReport.getNumberTrainedField().setValue(INVALID_NUMBER_INPUT)
      CreateReport.getNumberTrainedErrorText().waitForExist()
      expect(CreateReport.getNumberTrainedErrorText().getText()).to.include(
        "Number trained must be greater than or equal to 1"
      )
      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(CreateReport.getAlert().getText()).to.include(
        "Number trained must be greater than or equal to 1"
      )
    })

    it("Should not validate invisible field", () => {
      CreateReport.getEditButton().click()
      CreateReport.getForm().waitForExist()
      CreateReport.getForm().waitForDisplayed()

      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      // It was invalid from previous test case
      trainButton.click()

      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(CreateReport.getAlert().getText()).to.not.include(
        "Number trained must be greater than or equal to 1"
      )
    })

    it("Should show valid visible field after saving", () => {
      // we are on show page after submitting
      CreateReport.getEditButton().click()
      CreateReport.getForm().waitForExist()
      CreateReport.getForm().waitForDisplayed()

      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn on train option to make numberField visible
      trainButton.click()
      CreateReport.getNumberTrainedFormGroup().waitForExist()
      CreateReport.deleteInput(CreateReport.getNumberTrainedField())
      CreateReport.getNumberTrainedField().setValue(VALID_NUMBER_INPUT)

      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(CreateReport.getNumberTrainedFieldShowed().getText()).to.include(
        VALID_NUMBER_INPUT.toString()
      )
    })

    it("Should discard invisible fields after saving even if it is valid", () => {
      CreateReport.getEditButton().click()
      CreateReport.getForm().waitForExist()
      CreateReport.getForm().waitForDisplayed()

      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // give valid input before making invisible
      CreateReport.deleteInput(CreateReport.getNumberTrainedField())
      CreateReport.getNumberTrainedField().setValue(VALID_NUMBER_INPUT)
      // goes invisible
      trainButton.click()
      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(
        CreateReport.getNumberTrainedFieldShowed().getText()
      ).to.not.include(VALID_NUMBER_INPUT.toString())
    })

    it("Should logout", () => {
      CreateReport.logout()
    })
  })
  // ------------------------------ PERSON CUSTOM FIELDS -----------------------------------------
  describe("For person's custom fields", () => {
    it("Should be able load a new person form and fill normal required fields", () => {
      CreatePerson.openAsAdmin()
      CreatePerson.getForm().waitForExist()
      CreatePerson.getForm().waitForDisplayed()
      // fill other required fields at the beginning
      CreatePerson.getLastName().setValue(REQUIRED_PERSON_FIELDS.lastname)
      CreatePerson.getRank().selectByAttribute(
        "value",
        REQUIRED_PERSON_FIELDS.rank
      )
      CreatePerson.getGender().selectByAttribute(
        "value",
        REQUIRED_PERSON_FIELDS.gender
      )
    })

    it("Should not show default invisible fields", () => {
      CreatePerson.getDefaultInvisibleCustomFields().forEach(field => {
        expect(field.isExisting()).to.eq(false)
      })
      // Date field is invisible by default
      CreatePerson.getAddArrayObjectButton().click()
      CreatePerson.getObjectDateField().waitForExist({ reverse: true })
    })

    it("Should toggle correct invisible fields", () => {
      // green toggles every invisible field to visible
      CreatePerson.getGreenButton().click()
      CreatePerson.getDefaultInvisibleCustomFields().forEach(field => {
        field.waitForExist()
      })
      // Also it toggles array_of_objects date field
      CreatePerson.getObjectDateField().waitForExist()
    })

    it("Should persist previous valid data when toggling field's visibility", () => {
      CreatePerson.getNumberCustomField().setValue(VALID_NUMBER_INPUT)
      // make default invisible fields invisible again, amber color does that
      CreatePerson.getAmberButton().click()
      CreatePerson.getNumberCustomFieldContainer().waitForExist({
        reverse: true
      })
      // make visible
      CreatePerson.getGreenButton().click()
      CreatePerson.getNumberCustomFieldContainer().waitForExist()

      expect(CreatePerson.getNumberCustomField().getValue()).be.equal(
        VALID_NUMBER_INPUT
      )
    })

    it("Should persist previous invalid data when toggling field's visibility", () => {
      CreatePerson.deleteInput(CreatePerson.getNumberCustomField())
      CreatePerson.getNumberCustomField().setValue(INVALID_NUMBER_INPUT)
      // Actually see the validation warning
      CreatePerson.getNumberCustomFieldHelpText().waitForExist()
      // make invisible
      CreatePerson.getAmberButton().click()
      CreatePerson.getNumberCustomFieldContainer().waitForExist({
        reverse: true
      })
      // make visible
      CreatePerson.getGreenButton().click()
      CreatePerson.getNumberCustomFieldContainer().waitForExist()

      expect(CreatePerson.getNumberCustomField().getValue()).to.equal(
        INVALID_NUMBER_INPUT
      )
    })

    it("Should validate visible field", () => {
      CreatePerson.deleteInput(CreatePerson.getNumberCustomField())
      CreatePerson.getNumberCustomField().setValue(INVALID_NUMBER_INPUT)
      CreatePerson.getNumberCustomFieldHelpText().waitForExist()
      expect(CreatePerson.getNumberCustomFieldHelpText().getText()).to.include(
        "greater than"
      )
    })

    it("Should not validate invisible field so we can submit the form", () => {
      // make invisible
      CreatePerson.getAmberButton().click()
      CreatePerson.getNumberCustomFieldContainer().waitForExist({
        reverse: true
      })
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
    })

    it("Should logout", () => {
      CreatePerson.logout()
    })
  })
})
