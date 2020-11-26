import { expect } from "chai"
import CreatePerson from "../pages/createNewPerson.page"
import CreateTask from "../pages/createNewTask.page"
import CreateReport from "../pages/createReport.page"

const inValidInput = "-10"
const validInput = "10"
const TESTED_BUTTON_NAME = "train"

describe("When working with custom fields for different anet objects", () => {
  describe("For report's custom fields", () => {
    it("Should open a create new report page", () => {
      CreateReport.openAsAdminUser()
      CreateReport.form.waitForExist()
      CreateReport.form.waitForDisplayed()
    })

    it("Should toggle the correct invisible fields", () => {
      const button = CreateReport.getEngagementTypesButtonByName(
        TESTED_BUTTON_NAME
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
      CreateReport.numberTrainedField.setValue(validInput)
      const button = CreateReport.getEngagementTypesButtonByName(
        TESTED_BUTTON_NAME
      )
      button.click()
      CreateReport.numberTrainedFormGroup.waitForExist({ reverse: true })

      button.click()
      CreateReport.numberTrainedFormGroup.waitForExist()

      expect(CreateReport.numberTrainedField.getValue()).to.equal(validInput)
    })

    it("Should not persist previous invalid data when toggling field's visibility", () => {
      CreateReport.numberTrainedField.setValue(inValidInput)
      CreateReport.numberTrainedHelpText.waitForExist()
      // Actually see the validation warning
      expect(CreateReport.numberTrainedHelpText.getText()).to.equal(
        "Number trained must be greater than or equal to 1"
      )
      const button = CreateReport.getEngagementTypesButtonByName(
        TESTED_BUTTON_NAME
      )
      button.click()
      CreateReport.numberTrainedFormGroup.waitForExist({ reverse: true })

      button.click()
      CreateReport.numberTrainedFormGroup.waitForExist()

      expect(CreateReport.numberTrainedField.getValue()).not.be.equal(
        inValidInput
      )
      expect(CreateReport.numberTrainedField.getValue()).not.be.equal("")
    })
  })

  describe("For person's custom fields", () => {
    it("Should open create new person page", () => {
      CreatePerson.openAsAdminUser()
      CreatePerson.form.waitForExist()
      CreatePerson.form.waitForDisplayed()
    })
  })

  describe("For task's custom fields", () => {
    it("Should open create new task page", () => {
      CreateTask.openAsAdminUser()
      CreateTask.form.waitForExist()
      CreateTask.form.waitForDisplayed()
    })
  })
})
