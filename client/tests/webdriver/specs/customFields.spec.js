import { expect } from "chai"
import CreatePerson from "../pages/createNewPerson.page"
import CreateTask from "../pages/createNewTask.page"
import CreateReport from "../pages/createReport.page"

const inValidNumberInput = "-10"
const validNumberInput = "10"
const TESTED_ENGAGEMENT_BUTTON = "train"

const REQUIRED_PERSON_FIELDS = {
  lastname: "customPerson",
  rank: "CIV",
  gender: "MALE"
}

const REQUIRED_TASK_FIELDS = {
  shortName: "customTask"
}

describe("When working with custom fields for different anet objects", () => {
  describe("For report's custom fields", () => {
    it("Should open a create new report page", () => {
      CreateReport.openAsAdminUser()
      CreateReport.form.waitForExist()
      CreateReport.form.waitForDisplayed()
    })

    it("Should toggle the correct invisible fields", () => {
      const button = CreateReport.getEngagementTypesButtonByName(
        TESTED_ENGAGEMENT_BUTTON
      )
      button.waitForExist()
      button.waitForDisplayed()
      button.click()
      CreateReport.fieldsToggledVisibilityByTrainButton.forEach(
        nowVisisbleField => {
          nowVisisbleField.waitForExist()
          nowVisisbleField.waitForDisplayed()
        }
      )

      CreateReport.fieldsNotToggledVisibilityByTrainButton.forEach(
        stillInvisField => {
          expect(stillInvisField.isExisting()).to.equal(false)
        }
      )
    })

    it("Should persist previous valid data when toggling field's visibility", () => {
      CreateReport.numberTrainedField.setValue(validNumberInput)
      const button = CreateReport.getEngagementTypesButtonByName(
        TESTED_ENGAGEMENT_BUTTON
      )
      // make invisible
      button.click()
      CreateReport.numberTrainedFormGroup.waitForExist({ reverse: true })
      // make visible
      button.click()
      CreateReport.numberTrainedFormGroup.waitForExist()

      expect(CreateReport.numberTrainedField.getValue()).to.equal(
        validNumberInput
      )
    })

    it("Should not persist previous invalid data when toggling field's visibility", () => {
      CreateReport.numberTrainedField.setValue(inValidNumberInput)
      CreateReport.numberTrainedHelpText.waitForExist()
      // Actually see the validation warning
      expect(CreateReport.numberTrainedHelpText.getText()).to.equal(
        "Number trained must be greater than or equal to 1"
      )
      const button = CreateReport.getEngagementTypesButtonByName(
        TESTED_ENGAGEMENT_BUTTON
      )
      // make invisible
      button.click()
      CreateReport.numberTrainedFormGroup.waitForExist({ reverse: true })
      // make visible
      button.click()
      CreateReport.numberTrainedFormGroup.waitForExist()

      expect(CreateReport.numberTrainedField.getValue()).not.be.equal(
        inValidNumberInput
      )
      expect(CreateReport.numberTrainedField.getValue()).to.be.equal("")
    })

    it("Should validate visible field", () => {
      CreateReport.numberTrainedField.setValue(inValidNumberInput)
      CreateReport.numberTrainedHelpText.waitForExist()
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

      const button = CreateReport.getEngagementTypesButtonByName(
        TESTED_ENGAGEMENT_BUTTON
      )
      // make the trained number field invisible
      button.click()

      CreateReport.submitForm()
      CreateReport.waitForAlertToLoad()

      expect(CreateReport.alert.getText()).to.not.include(
        "Number trained must be greater than or equal to 1"
      )
    })
  })
  // ------------------------------ PERSON CUSTOM FIELDS -----------------------------------------
  describe("For person's custom fields", () => {
    it("Should open create new person page", () => {
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
    })

    it("Should toggle correct invisible fields", () => {
      // green toggles every invisible field to visible
      CreatePerson.greenButton.click()
      CreatePerson.defaultInvisibleCustomFields.forEach(field => {
        field.waitForExist()
      })
    })

    it("Should persist previous valid data when toggling field's visibility", () => {
      CreatePerson.numberCustomField.setValue(validNumberInput)
      // make default invisible fields invisible again, amber color does that
      CreatePerson.amberButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist({ reverse: true })
      // make visible
      CreatePerson.greenButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist()

      expect(CreatePerson.numberCustomField.getValue()).be.equal(
        validNumberInput
      )
    })

    it("Should not persist previous invalid data when toggling field's visibility", () => {
      CreatePerson.numberCustomField.setValue(inValidNumberInput)
      // Actually see the validation warning
      CreatePerson.numberCustomFieldHelpText.waitForExist()
      // make invisible
      CreatePerson.amberButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist({ reverse: true })
      // make visible
      CreatePerson.greenButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist()

      expect(CreatePerson.numberCustomField.getValue()).not.be.equal(
        inValidNumberInput
      )
      expect(CreatePerson.numberCustomField.getValue()).to.equal("")
    })

    it("Should validate visible field", () => {
      CreatePerson.numberCustomField.setValue(inValidNumberInput)
      CreatePerson.numberCustomFieldHelpText.waitForExist()
    })

    it("Should not validate invisible field so we can submit the form", () => {
      // make invisible
      CreatePerson.amberButton.click()
      CreatePerson.numberCustomFieldContainer.waitForExist({ reverse: true })
      CreatePerson.submitForm()
      CreatePerson.waitForAlertSuccessToLoad()
    })
  })

  describe("For task's custom fields", () => {
    it("Should open create new task page", () => {
      CreateTask.openAsAdmin()
      CreateTask.form.waitForExist()
      CreateTask.form.waitForDisplayed()
      // Fill other required fields so that we can test custom field validation
      CreateTask.shortName.setValue(REQUIRED_TASK_FIELDS.shortName)
    })

    it("Should be able to see assessment fields", () => {
      CreateTask.addObjectButton.click()
      CreateTask.objectFields.forEach(field => {
        field.waitForExist()
      })
    })

    it("Should warn invalid json for questions", () => {
      CreateTask.questionsField.setValue("invalidJsonTest")
      // normally there is already a help block, we need other warning text
      CreateTask.questionsFieldWarningText.waitForExist()
    })

    it("Should not warn valid json for questions", () => {
      CreateTask.questionsField.setValue("{}")
      // all help texts should be removed with valid json
      CreateTask.questionsFieldHelpText.waitForExist({ reverse: true })
    })

    it("Should be able to submit valid task", () => {
      CreateTask.submitForm()
      CreateTask.waitForAlertSuccessToLoad()
    })
  })
})
