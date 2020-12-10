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
      CreateFutureReport.form.waitForExist()
      CreateFutureReport.form.waitForDisplayed()
    })

    it("Should be able to select principal and task", () => {
      CreateFutureReport.attendeesFieldLabel.waitForExist()
      CreateFutureReport.attendeesFieldLabel.waitForDisplayed()
      // Don't set engagementDate yet

      // Select principal
      CreateFutureReport.attendeesFieldLabel.click()
      CreateFutureReport.attendeesField.setValue(PRINCIPAL)
      CreateFutureReport.waitForAdvancedSelectToChange(
        CreateFutureReport.attendeesFieldAdvancedSelectFirstItem,
        PRINCIPAL_VALUE
      )
      expect(
        CreateFutureReport.attendeesFieldAdvancedSelectFirstItem.getText()
      ).to.include(PRINCIPAL_VALUE)
      CreateFutureReport.attendeesFieldAdvancedSelectFirstItem.click()
      // Click outside the overlay
      CreateFutureReport.engagementInformationTitle.click()
      /* eslint-disable no-unused-expressions */
      // Advanced select input gets empty, the selected element is shown below the input
      expect(CreateFutureReport.attendeesField.getValue()).to.be.empty
      // Value should exist now
      expect(CreateFutureReport.attendeesFieldValue.isExisting()).to.be.true
      /* eslint-enable no-unused-expressions */
      expect(
        CreateFutureReport.getAttendeesFieldValueRow(2).getText()
      ).to.include(PRINCIPAL_VALUE)

      // Select task
      CreateFutureReport.tasksFieldLabel.click()
      CreateFutureReport.tasksField.setValue(TASK)
      CreateFutureReport.waitForAdvancedSelectToChange(
        CreateFutureReport.tasksFieldAdvancedSelectFirstItem,
        TASK_VALUE
      )
      expect(
        CreateFutureReport.tasksFieldAdvancedSelectFirstItem.getText()
      ).to.include(TASK_VALUE)
      CreateFutureReport.tasksFieldAdvancedSelectFirstItem.click()
      // Click outside the overlay
      CreateFutureReport.engagementInformationTitle.click()
      /* eslint-disable no-unused-expressions */
      // Advanced select input gets empty, the selected element is shown below the input
      expect(CreateFutureReport.tasksField.getValue()).to.be.empty
      // Value should exist now
      expect(CreateFutureReport.tasksFieldValue.isExisting()).to.be.true
      /* eslint-enable no-unused-expressions */
      expect(CreateFutureReport.getTasksFieldValueRow(1).getText()).to.include(
        TASK_VALUE
      )
    })

    it("Should not show assessments without engagement date", () => {
      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the form
      expect(CreateFutureReport.attendeesAssessments.isExisting()).to.be.false
      // Task assessments should not be shown in the form
      expect(CreateFutureReport.tasksAssessments.isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */

      // Save report
      CreateFutureReport.submitForm()
      CreateFutureReport.waitForAlertToLoad()
      expect(CreateFutureReport.alert.getText()).to.include(
        "The following errors must be fixed"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the display
      expect(CreateFutureReport.attendeesAssessments.isExisting()).to.be.false
      // Task assessments should not be shown in the display
      expect(CreateFutureReport.tasksAssessments.isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */
    })

    it("Should show assessments with past engagement date", () => {
      // Edit the report
      CreateFutureReport.editButton.click()
      CreateFutureReport.attendeesFieldLabel.waitForExist()
      CreateFutureReport.attendeesFieldLabel.waitForDisplayed()

      // Set engagement date to today
      CreateFutureReport.engagementDate.setValue(
        moment().format(ENGAGEMENT_DATE_FORMAT)
      )
      // Click outside the overlay
      CreateFutureReport.engagementInformationTitle.click()

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should be shown in the form
      expect(CreateFutureReport.attendeesAssessments.isExisting()).to.be.true
      expect(
        CreateFutureReport.getAttendeeAssessment(PRINCIPAL_VALUE).isExisting()
      ).to.be.true
      // Task assessments should be shown in the form
      expect(CreateFutureReport.tasksAssessments.isExisting()).to.be.true
      expect(CreateFutureReport.getTaskAssessment(TASK_VALUE).isExisting()).to
        .be.true
      /* eslint-enable no-unused-expressions */

      // Save report
      CreateFutureReport.submitForm()
      CreateFutureReport.waitForAlertToLoad()
      expect(CreateFutureReport.alert.getText()).to.include(
        "The following errors must be fixed"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should be shown in the display
      expect(CreateFutureReport.tasksAssessments.isExisting()).to.be.true
      expect(
        CreateFutureReport.getAttendeeAssessment(PRINCIPAL_VALUE).isExisting()
      ).to.be.true
      // Task assessments should be shown in the display
      expect(CreateFutureReport.tasksAssessments.isExisting()).to.be.true
      expect(CreateFutureReport.getTaskAssessment(TASK_VALUE).isExisting()).to
        .be.true
      /* eslint-enable no-unused-expressions */
    })

    it("Should not show assessments with future engagement date", () => {
      // Edit the report
      CreateFutureReport.editButton.click()
      CreateFutureReport.attendeesFieldLabel.waitForExist()
      CreateFutureReport.attendeesFieldLabel.waitForDisplayed()

      // Set engagement date to tomorrow
      CreateFutureReport.engagementDate.click()
      // Clumsy way to clear input first…
      browser.keys(
        ["End"].concat(Array(ENGAGEMENT_DATE_FORMAT.length).fill("Backspace"))
      )
      CreateFutureReport.engagementDate.setValue(
        moment().add(1, "days").format(ENGAGEMENT_DATE_FORMAT)
      )
      // Click outside the overlay
      CreateFutureReport.engagementInformationTitle.click()

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the form
      expect(CreateFutureReport.attendeesAssessments.isExisting()).to.be.false
      // Task assessments should not be shown in the form
      expect(CreateFutureReport.tasksAssessments.isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */

      // Save report
      CreateFutureReport.submitForm()
      CreateFutureReport.waitForAlertToLoad()
      expect(CreateFutureReport.alert.getText()).to.include(
        "You'll need to fill out these required fields before you can submit your final planned engagement"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the display
      expect(CreateFutureReport.attendeesAssessments.isExisting()).to.be.false
      // Task assessments should not be shown in the display
      expect(CreateFutureReport.tasksAssessments.isExisting()).to.be.false
      /* eslint-enable no-unused-expressions */
    })

    it("Should be able to delete the report", () => {
      // Edit the report
      CreateFutureReport.editButton.click()
      CreateFutureReport.attendeesFieldLabel.waitForExist()
      CreateFutureReport.attendeesFieldLabel.waitForDisplayed()

      // Delete it
      CreateFutureReport.deleteButton.waitForExist()
      CreateFutureReport.deleteButton.waitForDisplayed()
      CreateFutureReport.deleteButton.click()
      // Confirm delete
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      CreateFutureReport.confirmButton.waitForExist()
      CreateFutureReport.confirmButton.waitForDisplayed()
      CreateFutureReport.confirmButton.click()
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
      // Report should be deleted
      CreateFutureReport.waitForAlertToLoad()
      expect(CreateFutureReport.alert.getText()).to.include("Report deleted")
    })
  })
})
