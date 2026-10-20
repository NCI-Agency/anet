import { expect as pwExpect } from "@playwright/test"
import moment from "moment"
import CreateFutureReport from "../pages/createFutureReport.page.js"
import { test, waitFor } from "../support.js"

const INTERLOCUTOR = "Christopf"
const INTERLOCUTOR_VALUE = `CIV ${INTERLOCUTOR} Topferness`
const TASK_SEARCH = "1.2.A first milestone"
const TASK_POPOVER_VALUE = "1.2.A: Milestone the First in EF 1.2"
const TASK_SELECTED_VALUE = "1.2.A"
const ENGAGEMENT_DATE_FORMAT = "DD-MM-YYYY HH:mm"
test.describe("Create report form page", () => {
  test.describe("When creating a report", () => {
    test("Should be able to load the form", async () => {
      await CreateFutureReport.open()
      await waitFor(await CreateFutureReport.getForm(), "attached")
      await waitFor(await CreateFutureReport.getForm(), "visible")
    })
    test("Should be able to select interlocutor and task", async () => {
      await waitFor(
        await CreateFutureReport.getAttendeesFieldLabel(),
        "attached"
      )
      await waitFor(
        await CreateFutureReport.getAttendeesFieldLabel(),
        "visible"
      )
      // Don't set engagementDate yet

      // Select interlocutor
      await (await CreateFutureReport.getAttendeesFieldLabel()).click()
      await (
        await CreateFutureReport.getAttendeesField()
      ).fill(String(INTERLOCUTOR))
      await CreateFutureReport.waitForElementToChange(
        CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem,
        INTERLOCUTOR_VALUE
      )
      await pwExpect(
        await CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem()
      ).toContainText(INTERLOCUTOR_VALUE, {
        useInnerText: true
      })
      await (
        await CreateFutureReport.getAttendeesFieldAdvancedSelectFirstItem()
      ).click()
      // Click outside the overlay
      await (await CreateFutureReport.getEngagementInformationTitle()).click()
      // Advanced select input gets empty, the selected element is shown below the input
      await pwExpect(await CreateFutureReport.getAttendeesField()).toHaveValue(
        ""
      )
      // Value should exist now
      await pwExpect(
        await CreateFutureReport.getAttendeesFieldValue()
      ).not.toHaveCount(0)
      await pwExpect(
        await CreateFutureReport.getAttendeesFieldValueRow(2)
      ).toContainText(INTERLOCUTOR_VALUE, {
        useInnerText: true
      })

      // Select task
      await (await CreateFutureReport.getTasksFieldLabel()).click()
      await (await CreateFutureReport.getTasksField()).fill(String(TASK_SEARCH))
      await CreateFutureReport.waitForElementToChange(
        () => CreateFutureReport.getTasksFieldAdvancedSelectItem(3),
        TASK_POPOVER_VALUE
      )
      await pwExpect(
        await CreateFutureReport.getTasksFieldAdvancedSelectItem(3)
      ).toContainText(TASK_POPOVER_VALUE, {
        useInnerText: true
      })
      await (
        await CreateFutureReport.getTasksFieldAdvancedSelectItem(3)
      ).click()
      // Click outside the overlay
      await (await CreateFutureReport.getEngagementInformationTitle()).click()
      // Advanced select input gets empty, the selected element is shown below the input
      await pwExpect(await CreateFutureReport.getTasksField()).toHaveValue("")
      // Value should exist now
      await pwExpect(
        await CreateFutureReport.getTasksFieldValue()
      ).not.toHaveCount(0)
      await pwExpect(
        await CreateFutureReport.getTasksFieldValueRow(1)
      ).toContainText(TASK_SELECTED_VALUE, {
        useInnerText: true
      })
    })
    test("Should not show assessments without engagement date", async () => {
      // Attendee assessments should not be shown in the form
      await pwExpect(
        await CreateFutureReport.getAttendeesAssessments()
      ).toHaveCount(0)
      // Task assessments should not be shown in the form
      await pwExpect(
        await CreateFutureReport.getTasksAssessments()
      ).toHaveCount(0)

      // Save report
      await CreateFutureReport.submitForm()
      await CreateFutureReport.waitForAlertToLoad()
      await pwExpect(await CreateFutureReport.getAlertDanger()).toContainText(
        "The following errors must be fixed",
        {
          useInnerText: true
        }
      )

      // Attendee assessments should not be shown in the display
      await pwExpect(
        await CreateFutureReport.getAttendeesAssessments()
      ).toHaveCount(0)
      // Task assessments should not be shown in the display
      await pwExpect(
        await CreateFutureReport.getTasksAssessments()
      ).toHaveCount(0)
    })
    test("Should show assessments with past engagement date", async () => {
      // Edit the report
      await (await CreateFutureReport.getEditButton()).click()
      await waitFor(
        await CreateFutureReport.getAttendeesFieldLabel(),
        "attached"
      )
      await waitFor(
        await CreateFutureReport.getAttendeesFieldLabel(),
        "visible"
      )

      // Set engagement date to today
      await (
        await CreateFutureReport.getEngagementDate()
      ).fill(String(moment().format(ENGAGEMENT_DATE_FORMAT)))
      // Click outside the overlay
      await (await CreateFutureReport.getEngagementInformationTitle()).click()

      // Attendee assessments should be shown in the form
      await pwExpect(
        await CreateFutureReport.getAttendeesAssessments()
      ).not.toHaveCount(0)
      await pwExpect(
        await CreateFutureReport.getAttendeeAssessment(INTERLOCUTOR_VALUE)
      ).not.toHaveCount(0)
      const attendeeAssessmentLabel =
        await CreateFutureReport.getAttendeeAssessmentLabel(
          INTERLOCUTOR_VALUE,
          1
        )
      await pwExpect(attendeeAssessmentLabel).not.toHaveCount(0)
      await pwExpect(attendeeAssessmentLabel).toHaveText(
        "Engagement assessment of interlocutor",
        {
          useInnerText: true
        }
      )
      // Task assessments should be shown in the form
      await pwExpect(
        await CreateFutureReport.getTasksAssessments()
      ).not.toHaveCount(0)
      await pwExpect(
        await CreateFutureReport.getTaskAssessment(TASK_SELECTED_VALUE)
      ).not.toHaveCount(0)
      const taskAssessment1Label =
        await CreateFutureReport.getTaskAssessmentLabel(TASK_SELECTED_VALUE, 1)
      await pwExpect(taskAssessment1Label).not.toHaveCount(0)
      await pwExpect(taskAssessment1Label).toHaveText(
        "Restricted engagement assessment of objective",
        {
          useInnerText: true
        }
      )
      const taskAssessment2Label =
        await CreateFutureReport.getTaskAssessmentLabel(TASK_SELECTED_VALUE, 3)
      await pwExpect(taskAssessment2Label).not.toHaveCount(0)
      await pwExpect(taskAssessment2Label).toHaveText(
        "Engagement assessment of objective",
        {
          useInnerText: true
        }
      )

      // Save report
      await CreateFutureReport.submitForm()
      await CreateFutureReport.waitForAlertToLoad()
      await pwExpect(await CreateFutureReport.getAlertDanger()).toContainText(
        "The following errors must be fixed",
        {
          useInnerText: true
        }
      )

      // Attendee assessments should be shown in the display
      await pwExpect(
        await CreateFutureReport.getTasksAssessments()
      ).not.toHaveCount(0)
      await pwExpect(
        await CreateFutureReport.getAttendeeAssessment(INTERLOCUTOR_VALUE)
      ).not.toHaveCount(0)
      // Task assessments should be shown in the display
      await pwExpect(
        await CreateFutureReport.getTasksAssessments()
      ).not.toHaveCount(0)
      await pwExpect(
        await CreateFutureReport.getTaskAssessment(TASK_SELECTED_VALUE)
      ).not.toHaveCount(0)
    })
    test("Should not show assessments with future engagement date", async () => {
      // Edit the report
      await (await CreateFutureReport.getEditButton()).click()
      await waitFor(
        await CreateFutureReport.getAttendeesFieldLabel(),
        "attached"
      )
      await waitFor(
        await CreateFutureReport.getAttendeesFieldLabel(),
        "visible"
      )

      // Set engagement date to tomorrow
      await CreateFutureReport.deleteInput(
        CreateFutureReport.getEngagementDate()
      )
      await (
        await CreateFutureReport.getEngagementDate()
      ).fill(String(moment().add(1, "days").format(ENGAGEMENT_DATE_FORMAT)))
      // Click outside the overlay
      await (await CreateFutureReport.getEngagementInformationTitle()).click()

      // Attendee assessments should not be shown in the form
      await pwExpect(
        await CreateFutureReport.getAttendeesAssessments()
      ).toHaveCount(0)
      // Task assessments should not be shown in the form
      await pwExpect(
        await CreateFutureReport.getTasksAssessments()
      ).toHaveCount(0)

      // Save report
      await CreateFutureReport.submitForm()
      await CreateFutureReport.waitForAlertToLoad()
      await pwExpect(await CreateFutureReport.getAlertInfo()).toContainText(
        "You'll need to fill out these required fields before you can submit your final planned engagement",
        {
          useInnerText: true
        }
      )

      // Attendee assessments should not be shown in the display
      await pwExpect(
        await CreateFutureReport.getAttendeesAssessments()
      ).toHaveCount(0)
      // Task assessments should not be shown in the display
      await pwExpect(
        await CreateFutureReport.getTasksAssessments()
      ).toHaveCount(0)
    })
    test("Should be able to delete the report", async () => {
      // Edit the report
      await (await CreateFutureReport.getEditButton()).click()
      await waitFor(
        await CreateFutureReport.getAttendeesFieldLabel(),
        "attached"
      )
      await waitFor(
        await CreateFutureReport.getAttendeesFieldLabel(),
        "visible"
      )

      // Delete it
      await waitFor(await CreateFutureReport.getDeleteButton(), "attached")
      await waitFor(await CreateFutureReport.getDeleteButton(), "visible")
      await (await CreateFutureReport.getDeleteButton()).click()
      // Confirm delete

      // wait for the modal to slide in (transition is 300 ms)
      await waitFor(await CreateFutureReport.getConfirmButton(), "attached")
      await waitFor(await CreateFutureReport.getConfirmButton(), "visible")
      await (await CreateFutureReport.getConfirmButton()).click()
      // wait for the modal to slide out (transition is 300 ms)
      // Report should be deleted
      await CreateFutureReport.waitForAlertToLoad()
      await pwExpect(await CreateFutureReport.getAlertSuccess()).toContainText(
        "Report deleted",
        {
          useInnerText: true
        }
      )
    })
  })
})
