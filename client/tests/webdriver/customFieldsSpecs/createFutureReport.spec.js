import { expect } from "chai"
import moment from "moment"
import CreateFutureReport from "../pages/createFutureReport.page"

const PRINCIPAL = "Christopf"
const PRINCIPAL_VALUE = `CIV TOPFERNESS, ${PRINCIPAL}`

const TASK = "1.2.A"
const TASK_VALUE = `${TASK}`

const ENGAGEMENT_DATE_FORMAT = "DD-MM-YYYY HH:mm"
const SHORT_WAIT_MS = 1000

describe("Create report form page", () => {
  describe("When creating a report", () => {
    it("Should be able to load the form", () => {
      CreateFutureReport.open()
      CreateFutureReport.getForm().waitForExist()
      CreateFutureReport.getForm().waitForDisplayed()
    })

    it("Should be able to select principal and task", () => {
      CreateFutureReport.getAttendeesFieldLabel().waitForExist()
      CreateFutureReport.getAttendeesFieldLabel().waitForDisplayed()
      // Don't set engagementDate yet

      // Select principal
      CreateFutureReport.getAttendeesFieldLabel().click()
      CreateFutureReport.getAttendeesField().setValue(PRINCIPAL)
      CreateFutureReport.waitForAdvancedSelectToChange(
        CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem(),
        PRINCIPAL_VALUE
      )
      expect(
        CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem().getText()
      ).to.include(PRINCIPAL_VALUE)
      CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem().click()
      // Click outside the overlay
      CreateFutureReport.getEngagementInformationTitle().click()
      /* eslint-disable no-unused-expressions */
      // Advanced select input gets empty, the selected element is shown below the input
      expect(CreateFutureReport.getAttendeesField().getValue()).to.be.empty
      // Value should exist now
      expect(CreateFutureReport.getAttendeesFieldValue().isExisting()).to.be
        .true
      /* eslint-enable no-unused-expressions */
      expect(
        CreateFutureReport.getAttendeesFieldValueRow(2).getText()
      ).to.include(PRINCIPAL_VALUE)

      // Select task
      CreateFutureReport.getTasksFieldLabel().click()
      CreateFutureReport.getTasksField().setValue(TASK)
      CreateFutureReport.waitForAdvancedSelectToChange(
        CreateFutureReport.getTasksFieldAdvancedSelectFirstItem(),
        TASK_VALUE
      )
      expect(
        CreateFutureReport.getTasksFieldAdvancedSelectFirstItem().getText()
      ).to.include(TASK_VALUE)
      CreateFutureReport.getTasksFieldAdvancedSelectFirstItem().click()
      // Click outside the overlay
      CreateFutureReport.getEngagementInformationTitle().click()
      /* eslint-disable no-unused-expressions */
      // Advanced select input gets empty, the selected element is shown below the input
      expect(CreateFutureReport.getTasksField().getValue()).to.be.empty
      // Value should exist now
      expect(CreateFutureReport.getTasksFieldValue().isExisting()).to.be.true
      /* eslint-enable no-unused-expressions */
      expect(CreateFutureReport.getTasksFieldValueRow(1).getText()).to.include(
        TASK_VALUE
      )
    })

    it("Should not show assessments without engagement date", () => {
      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the form
      expect(CreateFutureReport.getAttendeesAssessments().isExisting()).to.be
        .false
      // Task assessments should not be shown in the form
      expect(CreateFutureReport.getTasksAssessments().isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */

      // Save report
      CreateFutureReport.submitForm()
      CreateFutureReport.waitForAlertToLoad()
      expect(CreateFutureReport.getAlert().getText()).to.include(
        "The following errors must be fixed"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the display
      expect(CreateFutureReport.getAttendeesAssessments().isExisting()).to.be
        .false
      // Task assessments should not be shown in the display
      expect(CreateFutureReport.getTasksAssessments().isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */
    })

    it("Should show assessments with past engagement date", () => {
      // Edit the report
      CreateFutureReport.getEditButton().click()
      CreateFutureReport.getAttendeesFieldLabel().waitForExist()
      CreateFutureReport.getAttendeesFieldLabel().waitForDisplayed()

      // Set engagement date to today
      CreateFutureReport.getEngagementDate().setValue(
        moment().format(ENGAGEMENT_DATE_FORMAT)
      )
      // Click outside the overlay
      CreateFutureReport.getEngagementInformationTitle().click()

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should be shown in the form
      expect(CreateFutureReport.getAttendeesAssessments().isExisting()).to.be
        .true
      expect(
        CreateFutureReport.getAttendeeAssessment(PRINCIPAL_VALUE).isExisting()
      ).to.be.true
      // Task assessments should be shown in the form
      expect(CreateFutureReport.getTasksAssessments().isExisting()).to.be.true
      expect(CreateFutureReport.getTaskAssessment(TASK_VALUE).isExisting()).to
        .be.true
      /* eslint-enable no-unused-expressions */

      // Save report
      CreateFutureReport.submitForm()
      CreateFutureReport.waitForAlertToLoad()
      expect(CreateFutureReport.getAlert().getText()).to.include(
        "The following errors must be fixed"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should be shown in the display
      expect(CreateFutureReport.getTasksAssessments().isExisting()).to.be.true
      expect(
        CreateFutureReport.getAttendeeAssessment(PRINCIPAL_VALUE).isExisting()
      ).to.be.true
      // Task assessments should be shown in the display
      expect(CreateFutureReport.getTasksAssessments().isExisting()).to.be.true
      expect(CreateFutureReport.getTaskAssessment(TASK_VALUE).isExisting()).to
        .be.true
      /* eslint-enable no-unused-expressions */
    })

    it("Should not show assessments with future engagement date", () => {
      // Edit the report
      CreateFutureReport.getEditButton().click()
      CreateFutureReport.getAttendeesFieldLabel().waitForExist()
      CreateFutureReport.getAttendeesFieldLabel().waitForDisplayed()

      // Set engagement date to tomorrow
      CreateFutureReport.deleteInput(CreateFutureReport.getEngagementDate())
      CreateFutureReport.getEngagementDate().setValue(
        moment().add(1, "days").format(ENGAGEMENT_DATE_FORMAT)
      )
      // Click outside the overlay
      CreateFutureReport.getEngagementInformationTitle().click()

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the form
      expect(CreateFutureReport.getAttendeesAssessments().isExisting()).to.be
        .false
      // Task assessments should not be shown in the form
      expect(CreateFutureReport.getTasksAssessments().isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */

      // Save report
      CreateFutureReport.submitForm()
      CreateFutureReport.waitForAlertToLoad()
      expect(CreateFutureReport.getAlert().getText()).to.include(
        "You'll need to fill out these required fields before you can submit your final planned engagement"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the display
      expect(CreateFutureReport.getAttendeesAssessments().isExisting()).to.be
        .false
      // Task assessments should not be shown in the display
      expect(CreateFutureReport.getTasksAssessments().isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */
    })

    it("Should be able to delete the report", () => {
      // Edit the report
      CreateFutureReport.getEditButton().click()
      CreateFutureReport.getAttendeesFieldLabel().waitForExist()
      CreateFutureReport.getAttendeesFieldLabel().waitForDisplayed()

      // Delete it
      CreateFutureReport.getDeleteButton().waitForExist()
      CreateFutureReport.getDeleteButton().waitForDisplayed()
      CreateFutureReport.getDeleteButton().click()
      // Confirm delete
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      CreateFutureReport.getConfirmButton().waitForExist()
      CreateFutureReport.getConfirmButton().waitForDisplayed()
      CreateFutureReport.getConfirmButton().click()
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
      // Report should be deleted
      CreateFutureReport.waitForAlertToLoad()
      expect(CreateFutureReport.getAlert().getText()).to.include(
        "Report deleted"
      )
    })
  })
})
