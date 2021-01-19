import { expect } from "chai"
import { v4 as uuidv4 } from "uuid"
import CreatePerson from "../pages/createNewPerson.page"
import CreateTask from "../pages/createNewTask.page"
import CreateReport from "../pages/createReport.page"

const INVALID_NUMBER_INPUT = "-10"
const VALID_NUMBER_INPUT = "10"
const TRAIN_ENGAGEMENT_BUTTON = "train"

const REQUIRED_PERSON_FIELDS = {
  lastname: "customPerson",
  rank: "CIV",
  gender: "MALE"
}

const REQUIRED_TASK_FIELDS = {
  shortName: "customTask"
}

describe("When working with custom fields for different anet objects", () => {
  // ------------------------------ REPORT CUSTOM FIELDS -----------------------------------------
  describe("For report's custom fields", () => {
    it("Should be able load a new report form", () => {
      CreateReport.openAsAdminUser()
      CreateReport.form.waitForExist()
      CreateReport.form.waitForDisplayed()
    })

    it("When the engagement type is not defined, it should not display fields only visible when a certain engagement type is selected", () => {
      CreateReport.fieldsToggledVisibilityByTrainButton.forEach(invisField => {
        expect(invisField.isExisting()).to.equal(false)
      })

      CreateReport.fieldsNotToggledVisibilityByTrainButton.forEach(
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
      CreateReport.fieldsToggledVisibilityByTrainButton.forEach(
        nowVisibleField => {
          nowVisibleField.waitForExist()
          nowVisibleField.waitForDisplayed()
        }
      )
      // train button active here so numberField will be visible

      CreateReport.fieldsNotToggledVisibilityByTrainButton.forEach(
        stillInvisField => {
          expect(stillInvisField.isExisting()).to.equal(false)
        }
      )
    })

    it("Should persist previous valid data when toggling field's visibility", () => {
      CreateReport.numberTrainedField.setValue(VALID_NUMBER_INPUT)
      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      trainButton.click()
      CreateReport.numberTrainedFormGroup.waitForExist({ reverse: true })
      // turn on train option to make numberField visible
      trainButton.click()
      CreateReport.numberTrainedFormGroup.waitForExist()

      expect(CreateReport.numberTrainedField.getValue()).to.equal(
        VALID_NUMBER_INPUT
      )
    })

    it("Should persist previous invalid data when toggling field's visibility", () => {
      CreateReport.numberTrainedField.setValue(INVALID_NUMBER_INPUT)
      CreateReport.numberTrainedHelpText.waitForExist()
      // Actually see the validation warning
      expect(CreateReport.numberTrainedHelpText.getText()).to.equal(
        "Number trained must be greater than or equal to 1"
      )
      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      trainButton.click()
      CreateReport.numberTrainedFormGroup.waitForExist({ reverse: true })
      // turn on train option to make numberField visible
      trainButton.click()
      CreateReport.numberTrainedFormGroup.waitForExist()

      expect(CreateReport.numberTrainedField.getValue()).to.equal(
        INVALID_NUMBER_INPUT
      )
    })

    it("Should validate visible field", () => {
      CreateReport.numberTrainedField.setValue(INVALID_NUMBER_INPUT)
      CreateReport.numberTrainedHelpText.waitForExist()
      expect(CreateReport.numberTrainedHelpText.getText()).to.include(
        "Number trained must be greater than or equal to 1"
      )
      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(CreateReport.alert.getText()).to.include(
        "Number trained must be greater than or equal to 1"
      )
    })

    it("Should not validate invisible field", () => {
      CreateReport.editButton.click()
      CreateReport.form.waitForExist()
      CreateReport.form.waitForDisplayed()

      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn off train option to make numberField invisible
      // It was invalid from previous test case
      trainButton.click()

      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(CreateReport.alert.getText()).to.not.include(
        "Number trained must be greater than or equal to 1"
      )
    })

    it("Should show valid visible field after saving", () => {
      // we are on show page after submitting
      CreateReport.editButton.click()
      CreateReport.form.waitForExist()
      CreateReport.form.waitForDisplayed()

      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // turn on train option to make numberField visible
      trainButton.click()
      CreateReport.numberTrainedFormGroup.waitForExist()
      CreateReport.numberTrainedField.setValue(VALID_NUMBER_INPUT)

      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(CreateReport.numberTrainedFieldShowed.getText()).to.include(
        VALID_NUMBER_INPUT.toString()
      )
    })

    it("Should discard invisible fields after saving even if it is valid", () => {
      CreateReport.editButton.click()
      CreateReport.form.waitForExist()
      CreateReport.form.waitForDisplayed()

      const trainButton = CreateReport.getEngagementTypesButtonByName(
        TRAIN_ENGAGEMENT_BUTTON
      )
      // give valid input before making invisible
      CreateReport.numberTrainedField.setValue(VALID_NUMBER_INPUT)
      // goes invisible
      trainButton.click()
      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(CreateReport.numberTrainedFieldShowed.getText()).to.not.include(
        VALID_NUMBER_INPUT.toString()
      )
    })
  })
  // ------------------------------ PERSON CUSTOM FIELDS -----------------------------------------
  describe("For person's custom fields", () => {
    it("Should be able load a new person form and fill normal required fields", () => {
      CreatePerson.openAsAdmin()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
      // fill other required fields at the beginning
      CreatePerson.lastName.setValue(REQUIRED_PERSON_FIELDS.lastname)
      CreatePerson.rank.selectByAttribute("value", REQUIRED_PERSON_FIELDS.rank)
      CreatePerson.gender.selectByAttribute(
        "value",
        REQUIRED_PERSON_FIELDS.gender
      )
    })

    it("Should not show default invisible fields", () => {
      CreatePerson.defaultInvisibleCustomFields.forEach(field => {
        expect(field.isExisting()).to.eq(false)
      })
      // Date field is invisible by default
      CreatePerson.addArrayObjectButton.click()
      CreatePerson.objectDateField.waitForExist({ reverse: true })
    })

    it("Should toggle correct invisible fields", () => {
      // green toggles every invisible field to visible
      CreatePerson.greenButton.click()
      CreatePerson.defaultInvisibleCustomFields.forEach(field => {
        field.waitForExist()
      })
      // Also it toggles array_of_objects date field
      CreatePerson.objectDateField.waitForExist()
    })

    it("Should persist previous valid data when toggling field's visibility", () => {
      CreatePerson.numberCustomField.setValue(VALID_NUMBER_INPUT)
      // make default invisible fields invisible again, amber color does that
      CreatePerson.amberButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist({ reverse: true })
      // make visible
      CreatePerson.greenButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist()

      expect(CreatePerson.numberCustomField.getValue()).be.equal(
        VALID_NUMBER_INPUT
      )
    })

    it("Should persist previous invalid data when toggling field's visibility", () => {
      CreatePerson.numberCustomField.setValue(INVALID_NUMBER_INPUT)
      // Actually see the validation warning
      CreatePerson.numberCustomFieldHelpText.waitForExist()
      // make invisible
      CreatePerson.amberButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist({ reverse: true })
      // make visible
      CreatePerson.greenButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist()

      expect(CreatePerson.numberCustomField.getValue()).to.equal(
        INVALID_NUMBER_INPUT
      )
    })

    it("Should validate visible field", () => {
      CreatePerson.numberCustomField.setValue(INVALID_NUMBER_INPUT)
      CreatePerson.numberCustomFieldHelpText.waitForExist()
      expect(CreatePerson.numberCustomFieldHelpText.getText()).to.include(
        "greater than"
      )
    })

    it("Should not validate invisible field so we can submit the form", () => {
      // make invisible
      CreatePerson.amberButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist({ reverse: true })
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
    })
  })
  // ------------------------------ TASK CUSTOM FIELDS -----------------------------------------
  describe("For task's custom fields", () => {
    it("Should be able load a new task form and fill normal required fields", () => {
      CreateTask.openAsAdmin()
      CreateTask.form.waitForExist()
      CreateTask.form.waitForDisplayed()
      // Fill other required fields so that we can test custom field validation
      CreateTask.shortName.setValue(
        `${REQUIRED_TASK_FIELDS.shortName} ${uuidv4()}`
      )
    })

    it("Should be able to see assessment fields", () => {
      CreateTask.addAssessmentButton.click()
      CreateTask.assessmentFields.forEach(field => {
        field.waitForExist()
      })
    })

    it("Should warn invalid json for questions", () => {
      CreateTask.questionsField.setValue("invalidJsonTest")
      // normally there is already a help block, we need the other warning text
      CreateTask.questionsFieldWarningText.waitForExist()
    })

    it("Should not warn valid json for questions", () => {
      CreateTask.questionsField.setValue("{}")
      // only the warning help text should be removed with valid json
      CreateTask.questionsFieldWarningText.waitForExist({ reverse: true })
    })

    it("Should be able to submit valid task", () => {
      CreateTask.submitForm()
      CreateTask.waitForAlertSuccessToLoad()
    })
  })
})
