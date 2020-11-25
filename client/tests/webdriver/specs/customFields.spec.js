import { expect } from "chai"
import CreateReport from "../pages/createReport.page"

describe("When working with custom fields for different anet objects", () => {
  describe("On a new report form", () => {
    it("Should open a create new report page", () => {
      CreateReport.openAsAdminUser()
      CreateReport.form.waitForExist()
      CreateReport.form.waitForDisplayed()
    })

    it("It should toggle the correct invisible fields", () => {
      CreateReport.getEngagementTypesButtonByName("train").waitForExist()
      CreateReport.getEngagementTypesButtonByName("train").waitForDisplayed()
      CreateReport.getEngagementTypesButtonByName("train").click()
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
    it("Toggling visibility of a field should persist previous data", () => {
      CreateReport.numberTrainedField.setValue("10")
      CreateReport.getEngagementTypesButtonByName("train").click()
      CreateReport.numberTrainedFormGroup.waitForExist({ reverse: true })

      CreateReport.getEngagementTypesButtonByName("train").click()
      CreateReport.numberTrainedFormGroup.waitForExist()

      expect(CreateReport.numberTrainedField.getValue()).to.equal("10")
    })
  })
})
