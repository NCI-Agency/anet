import { expect, test } from "@playwright/test"
import moment from "moment"
import { AdvancedSelect } from "../components/AdvancedSelect.js"
import { RichTextEditor } from "../components/RichTextEditor.js"
import { LoginPage } from "../pages/LoginPage.js"

// Report creation and approval must stay in the same worker.
test.describe.configure({
  mode: "serial"
})

let testReportURL = null

test("Draft and submit a report", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/", "erin")
  const createButton = page.locator("#createButton").first()
  await createButton.click()
  await page.locator("#intent").fill("meeting goal")
  await page.locator("#intent").blur()
  const engagementDate = page.locator("#engagementDate").first()
  await engagementDate.click()
  await page
    .getByRole("button", {
      name: "Today",
      exact: true
    })
    .click()

  // Close from the input so focus restoration does not reopen the picker.
  await engagementDate.press("Escape")
  await expect(page.locator(".bp6-datepicker")).toHaveCount(0)
  const locationAdvancedSelect = await new AdvancedSelect(
    page,
    "#location"
  ).choose("ge", 2)
  await expect(
    locationAdvancedSelect,
    "Clicking a location advanced single select widget suggestion populates the input field."
  ).toHaveValue("General Hospital")
  const positiveAtmosphereButton = page
    .locator('label[for="atmosphere_POSITIVE"]')
    .first()
  await positiveAtmosphereButton.click()
  const attendeesAdvancedSelect1 = await new AdvancedSelect(
    page,
    "#reportPeople"
  ).choose("topferness, christopf")
  const newReportTitle = page
    .locator("h4")
    .getByText("Create a new Report", { exact: true })
    .first()
  await newReportTitle.click()
  await expect(
    attendeesAdvancedSelect1,
    "Closing the attendees advanced multi select overlay empties the input field."
  ).toHaveValue("")
  const interlocutorControls1 = page
    .locator(".interlocutorAttendeesTable tbody tr:nth-child(2) td")
    .nth(0)
  const interlocutorName1 = page
    .locator(".interlocutorAttendeesTable tbody tr:nth-child(2) td")
    .nth(2)
  const interlocutorPosition1 = page
    .locator(".interlocutorAttendeesTable tbody tr:nth-child(2) td")
    .nth(3)
  const interlocutorOrg1 = page
    .locator(".interlocutorAttendeesTable tbody tr:nth-child(2) td")
    .nth(5)
  const interlocutorPrimaryInput1 = interlocutorControls1
    .locator("[name = 'primaryAttendeeINTERLOCUTOR']")
    .first()
  await expect(
    interlocutorPrimaryInput1,
    "Interlocutor primary attendee checkbox should be checked"
  ).toBeChecked()
  await expect(interlocutorName1).toHaveText("CIV Christopf Topferness")
  await expect(interlocutorPosition1).toHaveText(
    "Planning Captain, MOD-FO-00004"
  )
  await expect(interlocutorOrg1).toHaveText("MoD | Ministry of Defense")
  const attendeesAdvancedSelect2 = await new AdvancedSelect(
    page,
    "#reportPeople"
  ).choose("steveson, steve")
  await newReportTitle.click()
  await expect(
    attendeesAdvancedSelect2,
    "Closing the attendees advanced multi select overlay empties the input field."
  ).toHaveValue("")
  const interlocutorControls2 = page
    .locator(".interlocutorAttendeesTable tbody tr:last-child td")
    .nth(0)
  const interlocutorName2 = page
    .locator(".interlocutorAttendeesTable tbody tr:last-child td")
    .nth(2)
  await expect(interlocutorName2).toHaveText("OF-4 Steve Steveson")
  const interlocutorPrimaryInput2 = interlocutorControls2
    .locator("[name = 'primaryAttendeeINTERLOCUTOR']")
    .first()
  await expect(
    interlocutorPrimaryInput2,
    "Second interlocutor primary attendee checkbox should not be checked"
  ).not.toBeChecked()
  await interlocutorPrimaryInput2.click()
  await expect(
    interlocutorPrimaryInput2,
    "Second interlocutor primary attendee checkbox should now be checked"
  ).toBeChecked()
  await expect(
    interlocutorPrimaryInput1,
    "First interlocutor primary attendee checkbox should no longer be checked"
  ).not.toBeChecked()
  const tasksAdvancedSelect = await new AdvancedSelect(page, "#tasks").choose(
    "2.B",
    2
  )
  const tasksTitle = page
    .locator("h4")
    .getByText("Objectives", { exact: true })
    .first()
  await tasksTitle.click()
  await expect(
    tasksAdvancedSelect,
    "Closing the tasks advanced multi select overlay empties the input field."
  ).toHaveValue("")
  const newTaskRow = page.locator("#tasks-tasks table tbody tr td").first()
  await expect(newTaskRow).toHaveText("EF 2\n»\n2.B")
  await page.locator("#keyOutcomes").fill("key outcomes")
  await page.locator("#keyOutcomes").blur()
  await page.locator("#nextSteps").fill("next steps")
  await page.locator("#nextSteps").blur()
  await new RichTextEditor(page, ".reportTextField .editable").fill(
    "engagement details"
  )
  const editorCssPath = ".reportSensitiveInformationField .editable"
  const reportSensitiveInformationField = page.locator(editorCssPath).first()
  await expect(
    reportSensitiveInformationField,
    'Report sensitive info should not be present before "add sensitive information" button is clicked"'
  ).not.toBeVisible()
  const addSensitiveInfoButton = page.locator("#toggleSensitiveInfo").first()
  await addSensitiveInfoButton.click()
  await expect(reportSensitiveInformationField).toBeVisible()
  await new RichTextEditor(page, editorCssPath).fill("sensitive info")
  const communitiesButton = page
    .locator('button[value="AuthorizationGroup"]')
    .first()
  await communitiesButton.click()
  // Wait for the filters to change

  const communitiesInput = page.locator("input#authorizedMembers").first()
  await communitiesInput.click()
  // Wait for the pop-up to fill

  // Add all communities
  const allCommunities = page.locator(
    "#entitySelect-popover input[type='checkbox']"
  )
  await expect(allCommunities.first()).toBeVisible()
  const communityCount = await allCommunities.count()
  for (let index = 0; index < communityCount; index++) {
    await allCommunities.nth(index).check()
  }
  const formButtonSubmit = page.locator("#formBottomSubmit").first()
  await expect(formButtonSubmit).toBeEnabled()
  await formButtonSubmit.click()
  await expect(page.locator(".report-show h4").first()).toHaveText(
    "This is a DRAFT report and hasn't been submitted."
  )
  await expect(page, "URL is updated to reports/show page").toHaveURL(
    /\/reports\/[0-9a-f-]+/
  )
  testReportURL = new URL(page.url()).pathname
  await expect(page.locator("#report-text .editable")).toHaveText(
    "engagement details"
  )
  await expect(
    page.locator("#report-sensitive-information .editable")
  ).toHaveText("sensitive info")
  const submitReportButton = page.locator("#submitReportButton").first()
  await submitReportButton.click()
  await expect(submitReportButton).toBeHidden()
  await expect(
    page.locator("#submitReportButton"),
    "Submit button should be gone"
  ).toHaveCount(0)
  await expect(page.locator(".report-show h4").first()).toHaveText(
    "This report is PENDING approvals."
  )
  const allertSuccess = page.locator(".alert-success").first()
  await expect(allertSuccess).toBeVisible()
  await expect(
    allertSuccess,
    "Clicking the submit report button displays a message telling the user that the action was successful."
  ).toHaveText("Report submitted")
  await login.logout()
})

test("Publish report chain", async ({ page }) => {
  const login = new LoginPage(page)
  // First Jacob needs to approve the report, then Rebecca can approve the report
  await approveReport(page, "jacob")
  await approveReport(page, "rebecca")
  // Then the task owner can approve the report
  await approveReport(page, "henry")

  // Admin user needs to publish the report
  await login.login("/", "arthur")
  const approvedReports = page.locator(".home-tile").nth(5)
  await expect(approvedReports).toBeVisible()
  await approvedReports.click()
  await expect(approvedReports).toBeHidden()
  const reportsApprovedSummaryTab = page
    .locator(".report-collection button[value='summary']")
    .first()
  await reportsApprovedSummaryTab.click()
  const readApprovedReportButton = page
    .locator(".read-report-button[href='" + testReportURL + "']")
    .first()
  await expect(readApprovedReportButton).toBeEnabled()
  await readApprovedReportButton.click()
  await expect(page.locator(".report-show h4").first()).toHaveText(
    "This report is APPROVED."
  )
  const arthurPublishButton = page.locator(".publish-button").first()
  await arthurPublishButton.click()
  await expect(arthurPublishButton).toBeHidden()

  // check if page is redirected to search results

  const rollupLink = page
    .getByRole("link", {
      name: "Daily Rollup",
      exact: true
    })
    .first()
  await expect(rollupLink).toBeEnabled()
  await rollupLink.click()
  await expect(
    page,
    'Clicking the "Daily Rollup" link takes the user to the rollup page'
  ).toHaveURL(/\/rollup$/)
  await expect(page.locator("#daily-rollup")).toBeVisible()
  const rollupTableTab = page
    .locator(".report-collection button[value='table']")
    .first()
  await rollupTableTab.click()
  const reportCollectionTable = page.locator(".report-collection table").first()
  await expect(reportCollectionTable).toBeVisible()
  const approvedIntent = reportCollectionTable
    .getByRole("link", {
      name: "meeting goal",
      exact: true
    })
    .first()
  await expect(
    approvedIntent,
    "Daily Rollup report list includes the recently approved report"
  ).toHaveText("meeting goal")
  await login.logout()
})
async function approveReport(page, user) {
  const login = new LoginPage(page)
  await login.login("/", user)
  const reportsPending = page.locator(".home-tile").nth(1)
  await expect(reportsPending).toBeVisible()
  await reportsPending.click()
  await expect(reportsPending).toBeHidden()
  const reportsPendingSummaryTab = page
    .locator(".report-collection button[value='summary']")
    .first()
  await expect(reportsPendingSummaryTab).toBeEnabled()
  await reportsPendingSummaryTab.click()
  const readReportButton = page
    .locator(".read-report-button[href='" + testReportURL + "']")
    .first()
  await expect(readReportButton).toBeEnabled()
  await readReportButton.click()
  await expect(page.locator(".report-show h4").first()).toHaveText(
    "This report is PENDING approvals."
  )
  const ApproveButton = page.locator(".approve-button").first()
  await expect(ApproveButton).toBeEnabled()
  await ApproveButton.click()
  await expect(ApproveButton).toBeHidden()
  await login.logout()
}
test("Verify that validations work", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/")
  await page.locator("#createButton").click()
  await expect(page.locator(".legend .title-text").first()).toHaveText(
    "Create a new Report"
  )
  async function verifyFieldIsRequired(input, id, type, fieldName) {
    await input.click()
    await input.clear()
    const searchBarInput = page.locator("#searchBarInput").first()
    await searchBarInput.click()
    await expect(
      page.locator(`${type}[id="${id}"] ~ div[class="invalid-feedback"]`)
    ).toBeVisible()
    await input.pressSequentially("user input")
    await input.press("Tab") // fire blur event
    // send escape key to make sure any pop-ups are being closed
    await page.keyboard.press("Escape")
    await expect(
      page.locator(`textarea[id="${id}"] ~ div[class="invalid-feedback"]`),
      `After typing in ${fieldName} field, warning state goes away`
    ).toHaveCount(0)
  }
  const meetingGoalInput = page.locator("#intent").first()
  // check that parent div.form-group does not have class 'has-error'
  await expect(
    page.locator('textarea[id="intent"] ~ div[class="invalid-feedback"]'),
    "Meeting goal does not start in an invalid state"
  ).toHaveCount(0)
  await expect(meetingGoalInput, "Meeting goal field starts blank").toHaveValue(
    ""
  )

  // check that parent div.form-group now has a class 'has-error'
  await verifyFieldIsRequired(
    meetingGoalInput,
    "intent",
    "textarea",
    "Meeting goal"
  )
  const engagementDate = page.locator("#engagementDate").first()
  await expect(
    engagementDate,
    "Engagement date field starts blank"
  ).toHaveValue("")
  await engagementDate.click()
  await page
    .getByRole("button", {
      name: "Today",
      exact: true
    })
    .click()

  // set time as well
  const hourInput = page
    .locator("input.bp6-timepicker-input.bp6-timepicker-hour")
    .first()
  // clear field, enter data, fire blur event
  await hourInput.fill("23")
  await hourInput.press("Tab")
  const minuteInput = page
    .locator("input.bp6-timepicker-input.bp6-timepicker-minute")
    .first()
  // clear field, enter data, fire blur event
  await minuteInput.fill("45")
  await minuteInput.press("Tab")

  // Close from the input so focus restoration does not reopen the picker.
  await engagementDate.press("Escape")
  await expect(page.locator(".bp6-datepicker")).toHaveCount(0)

  // check date and time
  const dateTimeFormat = "DD-MM-YYYY HH:mm"
  const dateTimeValue = await engagementDate.inputValue()
  const expectedDateTime = moment().hour(23).minute(45).format(dateTimeFormat)
  expect(
    dateTimeValue,
    'Clicking the "today" button puts the current date in the engagement field'
  ).toBe(expectedDateTime)
  const locationInput = page.locator("#location").first()
  await expect(locationInput, "Location field starts blank").toHaveValue("")
  const locationShortcutButton = page
    .locator("#location-shortcut-list button")
    .first()
  await locationShortcutButton.click()
  await expect(
    locationInput,
    "Clicking the shortcut adds a location"
  ).toHaveValue("General Hospital")
  await expect(
    page.locator("#cancelledReason"),
    "Cancelled reason should not be present initially"
  ).toHaveCount(0)
  const atmosphereFormGroup = page.locator(".atmosphere-form-group").first()
  await expect(
    atmosphereFormGroup,
    "Atmospherics form group should be shown by default"
  ).toBeVisible()
  await expect(
    page.locator("#atmosphere-details"),
    "Atmospherics details should not be displayed before choosing atmospherics"
  ).toHaveCount(0)
  const positiveAtmosphereButton = page
    .locator('label[for="atmosphere_POSITIVE"]')
    .first()
  await positiveAtmosphereButton.click()
  const atmosphereDetails = page.locator("#atmosphereDetails").first()
  await expect(atmosphereDetails).toHaveAttribute(
    "placeholder",
    "Describe the atmosphere"
  )
  const neutralAtmosphereButton = page
    .locator('label[for="atmosphere_NEUTRAL"]')
    .first()
  await neutralAtmosphereButton.click()
  await expect(atmosphereDetails).toHaveAttribute(
    "placeholder",
    "Describe the atmosphere"
  )
  const negativeAtmosphereButton = page
    .locator('label[for="atmosphere_NEGATIVE"]')
    .first()
  await negativeAtmosphereButton.click()
  await expect(atmosphereDetails).toHaveAttribute(
    "placeholder",
    "Describe the atmosphere"
  )
  const reportPeopleFieldsetTitle = page
    .locator("#reportPeople-fieldset .title-text")
    .first()
  await expect(
    reportPeopleFieldsetTitle,
    "People fieldset should have correct title for an uncancelled enagement"
  ).toHaveText("People involved in this engagement")
  const cancelledCheckbox = page.locator(".cancelled-checkbox input").first()
  // Move element into view

  await cancelledCheckbox.scrollIntoViewIfNeeded()
  await cancelledCheckbox.click()
  await expect(
    page.locator(".atmosphere-form-group"),
    "After cancelling the enagement, the atmospherics should be hidden"
  ).toHaveCount(0)
  const cancelledReason = page.locator(".cancelled-reason-form-group").first()
  await expect(
    cancelledReason,
    "After cancelling the engagement, the cancellation reason should appear"
  ).toBeVisible()
  await expect(
    reportPeopleFieldsetTitle,
    "People fieldset should have correct title for a cancelled enagement"
  ).toHaveText("People who will be involved in this planned engagement")
  const advisorAttendeesRows = page.locator(".advisorAttendeesTable tbody tr")
  await expect(
    advisorAttendeesRows,
    "Advisor attendees table starts with 1 body row"
  ).toHaveCount(1)
  const interlocutorAttendeesRows = page.locator(
    ".interlocutorAttendeesTable tbody tr"
  )
  await expect(
    interlocutorAttendeesRows,
    "Interlocutor attendees table starts with 1 body row"
  ).toHaveCount(1)
  const advisorControls = page
    .locator(".advisorAttendeesTable tbody tr:first-child td")
    .nth(0)
  const advisorName = page
    .locator(".advisorAttendeesTable tbody tr:first-child td")
    .nth(2)
  const advisorPosition = page
    .locator(".advisorAttendeesTable tbody tr:first-child td")
    .nth(3)
  const advisorOrg = page
    .locator(".advisorAttendeesTable tbody tr:first-child td")
    .nth(5)
  await expect(
    advisorControls.locator("[name = 'primaryAttendeeADVISOR']").first(),
    "Advisor primary attendee checkbox should be checked"
  ).toBeChecked()
  await expect(advisorName).toHaveText("CIV Erin Erinson")
  await expect(advisorPosition).toHaveText("EF 2.2 Advisor D")
  await expect(advisorOrg).toHaveText("EF 2.2")
  const addAttendeeShortcutButtons = page.locator(
    "#reportPeople-shortcut-list button"
  )
  await expect(addAttendeeShortcutButtons.first()).toBeVisible()
  // Add all recent attendees
  const nrAttendees = await addAttendeeShortcutButtons.count()
  for (let i = 0; i < nrAttendees; i++) {
    await page.locator("#reportPeople-shortcut-list button").first().click()
  }
  // Match the shortcuts plus the initial advisor and interlocutor.
  await expect(
    advisorAttendeesRows.or(interlocutorAttendeesRows),
    "Clicking the shortcut buttons adds rows to the table"
  ).toHaveCount(nrAttendees + 2)
  const submitButton = page.locator("#formBottomSubmit").first()
  await submitButton.click()
  await expect(page.locator(".report-show h4").first()).toHaveText(
    "This is a DRAFT report and hasn't been submitted."
  )
  await login.logout()
})
