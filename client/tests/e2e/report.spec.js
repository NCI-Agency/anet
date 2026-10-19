import moment from "moment"
import { expect, test } from "./support.js"

// Report creation and approval must stay in the same worker.
test.describe.configure({
  mode: "serial"
})

let testReportURL = null
test("Draft and submit a report", async ({ app }) => {
  const {
    pageHelpers,
    $,
    $$,
    assertElementText,
    assertElementNotPresent,
    shortWaitMs,
    mediumWaitMs
  } = app
  await app.login("/", "erin")
  const $createButton = await app.$("#createButton")
  await $createButton.click()
  await pageHelpers.writeInForm("#intent", "meeting goal")
  const $engagementDate = await $("#engagementDate")
  await $engagementDate.click()

  await pageHelpers.clickTodayButton()

  // send escape key to make sure the date picker is being closed
  await app.page.keyboard.press("Escape")
  const $locationAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#location",
    "ge",
    2
  )
  await expect(
    $locationAdvancedSelect,
    "Clicking a location advanced single select widget suggestion populates the input field."
  ).toHaveValue("General Hospital")
  const $positiveAtmosphereButton = await $('label[for="atmosphere_POSITIVE"]')
  await $positiveAtmosphereButton.click()
  const $attendeesAdvancedSelect1 =
    await pageHelpers.chooseAdvancedSelectOption(
      "#reportPeople",
      "topferness, christopf"
    )
  const $newReportTitle = await app.page
    .locator("xpath=" + '//h4/span[text()="Create a new Report"]')
    .first()
  await $newReportTitle.click()

  await expect(
    $attendeesAdvancedSelect1,
    "Closing the attendees advanced multi select overlay empties the input field."
  ).toHaveValue("")
  const [
    $interlocutorControls1,
    /* eslint-disable no-unused-vars */ $interlocutorConflictBtn /* eslint-enable no-unused-vars */,
    $interlocutorName1,
    $interlocutorPosition1,
    /* eslint-disable no-unused-vars */ $interlocutorLocation1 /* eslint-enable no-unused-vars */,
    $interlocutorOrg1
  ] = await $$(".interlocutorAttendeesTable tbody tr:nth-child(2) td")
  const $interlocutorPrimaryInput1 = await $interlocutorControls1
    .locator("[name = 'primaryAttendeeINTERLOCUTOR']")
    .first()
  await expect(
    $interlocutorPrimaryInput1,
    "Interlocutor primary attendee checkbox should be checked"
  ).toBeChecked()
  await assertElementText($interlocutorName1, "CIV Christopf Topferness")
  await assertElementText(
    $interlocutorPosition1,
    "Planning Captain, MOD-FO-00004"
  )
  await assertElementText($interlocutorOrg1, "MoD | Ministry of Defense")
  const $attendeesAdvancedSelect2 =
    await pageHelpers.chooseAdvancedSelectOption(
      "#reportPeople",
      "steveson, steve"
    )
  await $newReportTitle.click()

  await expect(
    $attendeesAdvancedSelect2,
    "Closing the attendees advanced multi select overlay empties the input field."
  ).toHaveValue("")
  const [
    $interlocutorControls2,
    /* eslint-disable no-unused-vars */ $interlocutorAuthorConflictBtn /* eslint-enable no-unused-vars */,
    $interlocutorName2 /* eslint-disable no-unused-vars */,
    $interlocutorPosition2,
    $interlocutorLocation2,
    $interlocutorOrg2 /* eslint-enable no-unused-vars */
  ] = await $$(".interlocutorAttendeesTable tbody tr:last-child td")
  await assertElementText($interlocutorName2, "OF-4 Steve Steveson")
  const $interlocutorPrimaryInput2 = await $interlocutorControls2
    .locator("[name = 'primaryAttendeeINTERLOCUTOR']")
    .first()
  await expect(
    $interlocutorPrimaryInput2,
    "Second interlocutor primary attendee checkbox should not be checked"
  ).not.toBeChecked()
  await $interlocutorPrimaryInput2.click()
  await expect(
    $interlocutorPrimaryInput2,
    "Second interlocutor primary attendee checkbox should now be checked"
  ).toBeChecked()
  await expect(
    $interlocutorPrimaryInput1,
    "First interlocutor primary attendee checkbox should no longer be checked"
  ).not.toBeChecked()
  const $tasksAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#tasks",
    "2.B",
    2
  )
  const $tasksTitle = await app.page
    .locator("xpath=" + '//h4/span[text()="Objectives"]')
    .first()
  await $tasksTitle.click()

  await expect(
    $tasksAdvancedSelect,
    "Closing the tasks advanced multi select overlay empties the input field."
  ).toHaveValue("")
  const $newTaskRow = await $("#tasks-tasks table tbody tr td")
  await assertElementText($newTaskRow, "EF 2\n»\n2.B")
  await pageHelpers.writeInForm("#keyOutcomes", "key outcomes")
  await pageHelpers.writeInForm("#nextSteps", "next steps")
  await pageHelpers.writeInForm(
    ".reportTextField .editable",
    "engagement details",
    shortWaitMs // wait for Slate to save the editor contents
  )
  const editorCssPath = ".reportSensitiveInformationField .editable"
  const $reportSensitiveInformationField = await $(editorCssPath)
  await expect(
    $reportSensitiveInformationField,
    'Report sensitive info should not be present before "add sensitive information" button is clicked"'
  ).not.toBeVisible()
  const $addSensitiveInfoButton = await $("#toggleSensitiveInfo")
  await $addSensitiveInfoButton.click()
  await expect($reportSensitiveInformationField).toBeVisible()
  await pageHelpers.writeInForm(
    editorCssPath,
    "sensitive info",
    shortWaitMs // wait for Slate to save the editor contents
  )
  const $communitiesButton = await $('button[value="AuthorizationGroup"]')
  await $communitiesButton.click()
  // Wait for the filters to change

  const $communitiesInput = await $("input#authorizedMembers")
  await $communitiesInput.click()
  // Wait for the pop-up to fill

  // Add all communities
  const $allCommunities = await $$(
    "#entitySelect-popover input[type='checkbox']"
  )
  for (const $community of $allCommunities) {
    await $community.click()
  }
  const $formButtonSubmit = await $("#formBottomSubmit")
  await expect($formButtonSubmit).toBeEnabled({
    timeout: mediumWaitMs
  })
  await $formButtonSubmit.click()
  await pageHelpers.assertReportShowStatusText(
    "This is a DRAFT report and hasn't been submitted."
  )
  await expect(app.page, "URL is updated to reports/show page").toHaveURL(
    /\/reports\/[0-9a-f-]+/
  )
  testReportURL = new URL(app.page.url()).pathname
  const $submitReportButton = await $("#submitReportButton")
  await $submitReportButton.click()
  await expect($submitReportButton).toBeHidden({
    timeout: mediumWaitMs
  })
  await assertElementNotPresent(
    "#submitReportButton",
    "Submit button should be gone",
    shortWaitMs
  )
  await pageHelpers.assertReportShowStatusText(
    "This report is PENDING approvals."
  )
  const $allertSuccess = await app.page.locator(".alert-success").first()
  await expect($allertSuccess).toBeVisible({
    timeout: mediumWaitMs
  })
  await assertElementText(
    $allertSuccess,
    "Report submitted",
    "Clicking the submit report button displays a message telling the user that the action was successful."
  )
  await app.logout()
})

test("Publish report chain", async ({ app }) => {
  const { pageHelpers, $, $$, assertElementText, mediumWaitMs } = app

  // First Jacob needs to approve the report, then Rebecca can approve the report
  await approveReport(app, "jacob")
  await approveReport(app, "rebecca")
  // Then the task owner can approve the report
  await approveReport(app, "henry")

  // Admin user needs to publish the report
  await app.login("/", "arthur")
  const $homeTileArthur = await $$(".home-tile")
  const [
    /* eslint-disable no-unused-vars */ $draftReportsArthur,
    $reportsPendingAll,
    $reportsPendingArthur,
    $plannedEngagementsArthur,
    $reportsSensitiveInfo /* eslint-enable no-unused-vars */,
    $approvedReports
  ] = $homeTileArthur
  await expect($approvedReports).toBeVisible({
    timeout: mediumWaitMs
  })
  await $approvedReports.click()
  await expect($approvedReports).toBeHidden({
    timeout: mediumWaitMs
  })
  const $reportsApprovedSummaryTab = await $(
    ".report-collection button[value='summary']"
  )
  await $reportsApprovedSummaryTab.click()
  const $readApprovedReportButton = await $(
    ".read-report-button[href='" + testReportURL + "']"
  )
  await expect($readApprovedReportButton).toBeEnabled({
    timeout: mediumWaitMs
  })
  await $readApprovedReportButton.click()
  await pageHelpers.assertReportShowStatusText("This report is APPROVED.")
  const $arthurPublishButton = await $(".publish-button")
  await $arthurPublishButton.click()
  await expect($arthurPublishButton).toBeHidden({
    timeout: mediumWaitMs
  })

  // check if page is redirected to search results

  const $rollupLink = await app.page
    .getByRole("link", {
      name: "Daily Rollup",
      exact: true
    })
    .first()
  await expect($rollupLink).toBeEnabled({
    timeout: mediumWaitMs
  })
  await $rollupLink.click()
  await expect(
    app.page,
    'Clicking the "Daily Rollup" link takes the user to the rollup page'
  ).toHaveURL(/\/rollup$/)
  await $("#daily-rollup")

  const $rollupTableTab = await $(".report-collection button[value='table']")
  await $rollupTableTab.click()
  const $reportCollectionTable = await $(".report-collection table")
  await expect($reportCollectionTable).toBeVisible({
    timeout: mediumWaitMs
  })
  const $approvedIntent = await $reportCollectionTable
    .getByRole("link", {
      name: "meeting goal",
      exact: true
    })
    .first()
  await assertElementText(
    $approvedIntent,
    "meeting goal",
    "Daily Rollup report list includes the recently approved report"
  )
  await app.logout()
})

async function approveReport(app, user) {
  const { pageHelpers, $, $$, mediumWaitMs } = app
  await app.login("/", user)
  const $homeTile = await $$(".home-tile")
  const [
    /* eslint-disable no-unused-vars */ $draftReports /* eslint-enable no-unused-vars */,
    $reportsPending /* eslint-disable no-unused-vars */,
    $orgReports,
    $plannedEngagements
    /* eslint-enable no-unused-vars */
  ] = $homeTile
  await expect($reportsPending).toBeVisible({
    timeout: mediumWaitMs
  })
  await $reportsPending.click()
  await expect($reportsPending).toBeHidden({
    timeout: mediumWaitMs
  })
  const $reportsPendingSummaryTab = await $(
    ".report-collection button[value='summary']"
  )
  await expect($reportsPendingSummaryTab).toBeEnabled()
  await $reportsPendingSummaryTab.click()
  const $readReportButton = await $(
    ".read-report-button[href='" + testReportURL + "']"
  )
  await expect($readReportButton).toBeEnabled({
    timeout: mediumWaitMs
  })
  await $readReportButton.click()
  await pageHelpers.assertReportShowStatusText(
    "This report is PENDING approvals."
  )
  const $ApproveButton = await $(".approve-button")
  await expect($ApproveButton).toBeEnabled({
    timeout: mediumWaitMs
  })
  await $ApproveButton.click()
  await expect($ApproveButton).toBeHidden({
    timeout: mediumWaitMs
  })
  await app.logout()
}

test("Verify that validations work", async ({ app }) => {
  const {
    assertElementText,
    $,
    $$,
    assertElementNotPresent,
    pageHelpers,
    shortWaitMs
  } = app
  await pageHelpers.goHomeAndThenToReportsPage()
  await assertElementText(await $(".legend .title-text"), "Create a new Report")
  async function verifyFieldIsRequired($input, id, type, fieldName) {
    await $input.click()
    await $input.clear()
    const $searchBarInput = await $("#searchBarInput")
    await $searchBarInput.click()
    await expect(
      app.page.locator(`${type}[id="${id}"] ~ div[class="invalid-feedback"]`)
    ).toBeVisible()
    await $input.pressSequentially("user input")
    await $input.press("Tab") // fire blur event
    // send escape key to make sure any pop-ups are being closed
    await app.page.keyboard.press("Escape")
    await expect(
      app.page.locator(`textarea[id="${id}"] ~ div[class="invalid-feedback"]`),
      `After typing in ${fieldName} field, warning state goes away`
    ).toHaveCount(0)
  }
  const $meetingGoalInput = await $("#intent")
  // check that parent div.form-group does not have class 'has-error'
  await expect(
    app.page.locator('textarea[id="intent"] ~ div[class="invalid-feedback"]'),
    "Meeting goal does not start in an invalid state"
  ).toHaveCount(0)
  await expect(
    $meetingGoalInput,
    "Meeting goal field starts blank"
  ).toHaveValue("")

  // check that parent div.form-group now has a class 'has-error'
  await verifyFieldIsRequired(
    $meetingGoalInput,
    "intent",
    "textarea",
    "Meeting goal"
  )
  const $engagementDate = await $("#engagementDate")
  await expect(
    $engagementDate,
    "Engagement date field starts blank"
  ).toHaveValue("")
  await $engagementDate.click()

  await pageHelpers.clickTodayButton()

  // set time as well
  const $hourInput = await $("input.bp6-timepicker-input.bp6-timepicker-hour")
  // clear field, enter data, fire blur event
  await $hourInput.fill("23")
  await $hourInput.press("Tab")
  const $minuteInput = await $(
    "input.bp6-timepicker-input.bp6-timepicker-minute"
  )
  // clear field, enter data, fire blur event
  await $minuteInput.fill("45")
  await $minuteInput.press("Tab")

  // send escape key to make sure the date picker is being closed
  await app.page.keyboard.press("Escape")

  // check date and time
  const dateTimeFormat = "DD-MM-YYYY HH:mm"
  const dateTimeValue = await $engagementDate.inputValue()
  const expectedDateTime = moment().hour(23).minute(45).format(dateTimeFormat)
  expect(
    dateTimeValue,
    'Clicking the "today" button puts the current date in the engagement field'
  ).toBe(expectedDateTime)
  const $locationInput = await $("#location")
  await expect($locationInput, "Location field starts blank").toHaveValue("")
  const $locationShortcutButton = await $("#location-shortcut-list button")
  await $locationShortcutButton.click()
  await expect(
    $locationInput,
    "Clicking the shortcut adds a location"
  ).toHaveValue("General Hospital")
  await assertElementNotPresent(
    "#cancelledReason",
    "Cancelled reason should not be present initially",
    shortWaitMs
  )
  const $atmosphereFormGroup = await $(".atmosphere-form-group")
  await expect(
    $atmosphereFormGroup,
    "Atmospherics form group should be shown by default"
  ).toBeVisible()
  await assertElementNotPresent(
    "#atmosphere-details",
    "Atmospherics details should not be displayed before choosing atmospherics",
    shortWaitMs
  )
  const $positiveAtmosphereButton = await $('label[for="atmosphere_POSITIVE"]')
  await $positiveAtmosphereButton.click()
  const $atmosphereDetails = await $("#atmosphereDetails")
  await expect($atmosphereDetails).toHaveAttribute(
    "placeholder",
    "Describe the atmosphere"
  )
  const $neutralAtmosphereButton = await $('label[for="atmosphere_NEUTRAL"]')
  await $neutralAtmosphereButton.click()
  await expect($atmosphereDetails).toHaveAttribute(
    "placeholder",
    "Describe the atmosphere"
  )
  const $negativeAtmosphereButton = await $('label[for="atmosphere_NEGATIVE"]')
  await $negativeAtmosphereButton.click()
  await expect($atmosphereDetails).toHaveAttribute(
    "placeholder",
    "Describe the atmosphere"
  )
  const $reportPeopleFieldsetTitle = await $(
    "#reportPeople-fieldset .title-text"
  )
  await assertElementText(
    $reportPeopleFieldsetTitle,
    "People involved in this engagement",
    "People fieldset should have correct title for an uncancelled enagement"
  )
  const $cancelledCheckbox = await $(".cancelled-checkbox input")
  // Move element into view

  await $cancelledCheckbox.scrollIntoViewIfNeeded()
  await $cancelledCheckbox.click()
  await assertElementNotPresent(
    ".atmosphere-form-group",
    "After cancelling the enagement, the atmospherics should be hidden",
    shortWaitMs
  )
  const $cancelledReason = await $(".cancelled-reason-form-group")
  await expect(
    $cancelledReason,
    "After cancelling the engagement, the cancellation reason should appear"
  ).toBeVisible()
  await assertElementText(
    $reportPeopleFieldsetTitle,
    "People who will be involved in this planned engagement",
    "People fieldset should have correct title for a cancelled enagement"
  )
  let $advisorAttendeesRows = await $$(".advisorAttendeesTable tbody tr")
  expect(
    $advisorAttendeesRows.length,
    "Advisor attendees table starts with 1 body rows"
  ).toBe(1)
  let $interlocutorAttendeesRows = await $$(
    ".interlocutorAttendeesTable tbody tr"
  )
  expect(
    $interlocutorAttendeesRows.length,
    "Interlocutor attendees table starts with 1 body rows"
  ).toBe(1)
  const [
    $advisorControls,
    /* eslint-disable no-unused-vars */ $advisorConflictBtn /* eslint-enable no-unused-vars */,
    $advisorName,
    $advisorPosition,
    /* eslint-disable no-unused-vars */ $advisorLocation /* eslint-enable no-unused-vars */,
    $advisorOrg
  ] = await $$(".advisorAttendeesTable tbody tr:first-child td")
  await expect(
    $advisorControls.locator("[name = 'primaryAttendeeADVISOR']").first(),
    "Advisor primary attendee checkbox should be checked"
  ).toBeChecked()
  await assertElementText($advisorName, "CIV Erin Erinson")
  await assertElementText($advisorPosition, "EF 2.2 Advisor D")
  await assertElementText($advisorOrg, "EF 2.2")
  const $addAttendeeShortcutButtons = await $$(
    "#reportPeople-shortcut-list button"
  )
  // Add all recent attendees
  const nrAttendees = $addAttendeeShortcutButtons.length
  for (let i = 0; i < nrAttendees; i++) {
    await (await $("#reportPeople-shortcut-list button")).click()
  }
  $advisorAttendeesRows = await $$(".advisorAttendeesTable tbody tr")
  $interlocutorAttendeesRows = await $$(".interlocutorAttendeesTable tbody tr")
  expect(
    $advisorAttendeesRows.length + $interlocutorAttendeesRows.length,
    "Clicking the shortcut buttons adds rows to the table"
  ).toBe(
    // should match the number of shortcut buttons plus the initial advisor and interlocutor
    nrAttendees + 2
  )
  const $submitButton = await $("#formBottomSubmit")
  await $submitButton.click()
  await pageHelpers.assertReportShowStatusText(
    "This is a DRAFT report and hasn't been submitted."
  )
  await app.logout()
})
