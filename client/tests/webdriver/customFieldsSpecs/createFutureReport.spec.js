import { expect } from "chai"
import moment from "moment"
import CreateFutureReport from "../pages/createFutureReport.page"

const INTERLOCUTOR = "Christopf"
const INTERLOCUTOR_VALUE = `CIV TOPFERNESS, ${INTERLOCUTOR}`

const TASK_SEARCH = "1.2.A first milestone"
const TASK_POPOVER_VALUE = "1.2.A: Milestone the First in EF 1.2"
const TASK_SELECTED_VALUE = "1.2.A"

const ENGAGEMENT_DATE_FORMAT = "DD-MM-YYYY HH:mm"
const SHORT_WAIT_MS = 1000

describe("Create report form page", () => {
  describe("When creating a report", () => {
    it("Should be able to load the form", async() => {
      await CreateFutureReport.open()
      await (await CreateFutureReport.getForm()).waitForExist()
      await (await CreateFutureReport.getForm()).waitForDisplayed()
    })

    it("Should be able to select interlocutor and task", async() => {
      await (await CreateFutureReport.getAttendeesFieldLabel()).waitForExist()
      await (
        await CreateFutureReport.getAttendeesFieldLabel()
      ).waitForDisplayed()
      // Don't set engagementDate yet

      // Select interlocutor
      await (await CreateFutureReport.getAttendeesFieldLabel()).click()
      await (
        await CreateFutureReport.getAttendeesField()
      ).setValue(INTERLOCUTOR)
      await CreateFutureReport.waitForAdvancedSelectToChange(
        CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem(),
        INTERLOCUTOR_VALUE
      )
      expect(
        await (
          await CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem()
        ).getText()
      ).to.include(INTERLOCUTOR_VALUE)
      await (
        await CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem()
      ).click()
      // Click outside the overlay
      await (await CreateFutureReport.getEngagementInformationTitle()).click()
      /* eslint-disable no-unused-expressions */
      // Advanced select input gets empty, the selected element is shown below the input
      expect(await (await CreateFutureReport.getAttendeesField()).getValue()).to
        .be.empty
      // Value should exist now
      expect(
        await (await CreateFutureReport.getAttendeesFieldValue()).isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
      expect(
        await (await CreateFutureReport.getAttendeesFieldValueRow(2)).getText()
      ).to.include(INTERLOCUTOR_VALUE)

      // Select task
      await (await CreateFutureReport.getTasksFieldLabel()).click()
      await (await CreateFutureReport.getTasksField()).setValue(TASK_SEARCH)
      await CreateFutureReport.waitForAdvancedSelectToChange(
        CreateFutureReport.getTasksFieldAdvancedSelectItem(3),
        TASK_POPOVER_VALUE
      )
      expect(
        await (
          await CreateFutureReport.getTasksFieldAdvancedSelectItem(3)
        ).getText()
      ).to.include(TASK_POPOVER_VALUE)
      await (
        await CreateFutureReport.getTasksFieldAdvancedSelectItem(3)
      ).click()
      // Click outside the overlay
      await (await CreateFutureReport.getEngagementInformationTitle()).click()
      /* eslint-disable no-unused-expressions */
      // Advanced select input gets empty, the selected element is shown below the input
      expect(await (await CreateFutureReport.getTasksField()).getValue()).to.be
        .empty
      // Value should exist now
      expect(await (await CreateFutureReport.getTasksFieldValue()).isExisting())
        .to.be.true
      /* eslint-enable no-unused-expressions */
      expect(
        await (await CreateFutureReport.getTasksFieldValueRow(1)).getText()
      ).to.include(TASK_SELECTED_VALUE)
    })

    it("Should not show assessments without engagement date", async() => {
      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the form
      expect(
        await (await CreateFutureReport.getAttendeesAssessments()).isExisting()
      ).to.be.false
      // Task assessments should not be shown in the form
      expect(
        await (await CreateFutureReport.getTasksAssessments()).isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */

      // Save report
      await CreateFutureReport.submitForm()
      await CreateFutureReport.waitForAlertToLoad()
      expect(await (await CreateFutureReport.getAlert()).getText()).to.include(
        "The following errors must be fixed"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the display
      expect(
        await (await CreateFutureReport.getAttendeesAssessments()).isExisting()
      ).to.be.false
      // Task assessments should not be shown in the display
      expect(
        await (await CreateFutureReport.getTasksAssessments()).isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */
    })

    it("Should show assessments with past engagement date", async() => {
      // Edit the report
      await (await CreateFutureReport.getEditButton()).click()
      await (await CreateFutureReport.getAttendeesFieldLabel()).waitForExist()
      await (
        await CreateFutureReport.getAttendeesFieldLabel()
      ).waitForDisplayed()

      // Set engagement date to today
      await (
        await CreateFutureReport.getEngagementDate()
      ).setValue(moment().format(ENGAGEMENT_DATE_FORMAT))
      // Click outside the overlay
      await (await CreateFutureReport.getEngagementInformationTitle()).click()

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should be shown in the form
      expect(
        await (await CreateFutureReport.getAttendeesAssessments()).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateFutureReport.getAttendeeAssessment(INTERLOCUTOR_VALUE)
        ).isExisting()
      ).to.be.true
      const attendeeAssessmentLabel =
        await CreateFutureReport.getAttendeeAssessmentLabel(
          INTERLOCUTOR_VALUE,
          1
        )
      expect(await attendeeAssessmentLabel.isExisting()).to.be.true
      expect(await attendeeAssessmentLabel.getText()).to.equal(
        "Engagement assessment of interlocutor"
      )
      // Task assessments should be shown in the form
      expect(
        await (await CreateFutureReport.getTasksAssessments()).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateFutureReport.getTaskAssessment(TASK_SELECTED_VALUE)
        ).isExisting()
      ).to.be.true
      const taskAssessment1Label =
        await CreateFutureReport.getTaskAssessmentLabel(TASK_SELECTED_VALUE, 1)
      expect(await taskAssessment1Label.isExisting()).to.be.true
      expect(await taskAssessment1Label.getText()).to.equal(
        "Restricted engagement assessment of objective"
      )
      const taskAssessment2Label =
        await CreateFutureReport.getTaskAssessmentLabel(TASK_SELECTED_VALUE, 3)
      expect(await taskAssessment2Label.isExisting()).to.be.true
      expect(await taskAssessment2Label.getText()).to.equal(
        "Engagement assessment of objective"
      )
      /* eslint-enable no-unused-expressions */

      // Save report
      await CreateFutureReport.submitForm()
      await CreateFutureReport.waitForAlertToLoad()
      expect(await (await CreateFutureReport.getAlert()).getText()).to.include(
        "The following errors must be fixed"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should be shown in the display
      expect(
        await (await CreateFutureReport.getTasksAssessments()).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateFutureReport.getAttendeeAssessment(INTERLOCUTOR_VALUE)
        ).isExisting()
      ).to.be.true
      // Task assessments should be shown in the display
      expect(
        await (await CreateFutureReport.getTasksAssessments()).isExisting()
      ).to.be.true
      expect(
        await (
          await CreateFutureReport.getTaskAssessment(TASK_SELECTED_VALUE)
        ).isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
    })

    it("Should not show assessments with future engagement date", async() => {
      // Edit the report
      await (await CreateFutureReport.getEditButton()).click()
      await (await CreateFutureReport.getAttendeesFieldLabel()).waitForExist()
      await (
        await CreateFutureReport.getAttendeesFieldLabel()
      ).waitForDisplayed()

      // Set engagement date to tomorrow
      await CreateFutureReport.deleteInput(
        CreateFutureReport.getEngagementDate()
      )
      await (
        await CreateFutureReport.getEngagementDate()
      ).setValue(moment().add(1, "days").format(ENGAGEMENT_DATE_FORMAT))
      // Click outside the overlay
      await (await CreateFutureReport.getEngagementInformationTitle()).click()

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the form
      expect(
        await (await CreateFutureReport.getAttendeesAssessments()).isExisting()
      ).to.be.false
      // Task assessments should not be shown in the form
      expect(
        await (await CreateFutureReport.getTasksAssessments()).isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */

      // Save report
      await CreateFutureReport.submitForm()
      await CreateFutureReport.waitForAlertToLoad()
      expect(await (await CreateFutureReport.getAlert()).getText()).to.include(
        "You'll need to fill out these required fields before you can submit your final planned engagement"
      )

      /* eslint-disable no-unused-expressions */
      // Attendee assessments should not be shown in the display
      expect(
        await (await CreateFutureReport.getAttendeesAssessments()).isExisting()
      ).to.be.false
      // Task assessments should not be shown in the display
      expect(
        await (await CreateFutureReport.getTasksAssessments()).isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */
    })

    it("Should be able to delete the report", async() => {
      // Edit the report
      await (await CreateFutureReport.getEditButton()).click()
      await (await CreateFutureReport.getAttendeesFieldLabel()).waitForExist()
      await (
        await CreateFutureReport.getAttendeesFieldLabel()
      ).waitForDisplayed()

      // Delete it
      await (await CreateFutureReport.getDeleteButton()).waitForExist()
      await (await CreateFutureReport.getDeleteButton()).waitForDisplayed()
      await (await CreateFutureReport.getDeleteButton()).click()
      // Confirm delete
      await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      await (await CreateFutureReport.getConfirmButton()).waitForExist()
      await (await CreateFutureReport.getConfirmButton()).waitForDisplayed()
      await (await CreateFutureReport.getConfirmButton()).click()
      await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
      // Report should be deleted
      await CreateFutureReport.waitForAlertToLoad()
      expect(await (await CreateFutureReport.getAlert()).getText()).to.include(
        "Report deleted"
      )
    })
  })
})
