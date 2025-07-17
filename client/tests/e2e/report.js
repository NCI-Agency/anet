const moment = require("moment")
const test = require("../util/test")

let testReportURL = null

test.serial("Draft and submit a report", async t => {
  t.plan(19)

  const {
    pageHelpers,
    $,
    $$,
    assertElementText,
    assertElementNotPresent,
    By,
    until,
    shortWaitMs,
    mediumWaitMs
  } = t.context

  await t.context.get("/", "erin")

  const $createButton = await t.context.$("#createButton")
  await $createButton.click()

  await pageHelpers.writeInForm("#intent", "meeting goal")

  const $engagementDate = await $("#engagementDate")
  await $engagementDate.click()
  await t.context.driver.sleep(shortWaitMs) // wait for the datepicker to pop up

  await pageHelpers.clickTodayButton()

  // send escape key to make sure the date picker is being closed
  await t.context.driver.actions().sendKeys(t.context.Key.ESCAPE).perform()

  const $locationAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#location",
    "ge",
    2
  )

  t.is(
    await $locationAdvancedSelect.getAttribute("value"),
    "General Hospital",
    "Clicking a location advanced single select widget suggestion populates the input field."
  )

  const $positiveAtmosphereButton = await $('label[for="atmosphere_POSITIVE"]')
  await $positiveAtmosphereButton.click()

  const $attendeesAdvancedSelect1 =
    await pageHelpers.chooseAdvancedSelectOption(
      "#reportPeople",
      "topferness, christopf"
    )

  const $newReportTitle = await t.context.driver.findElement(
    By.xpath('//h4/span[text()="Create a new Report"]')
  )
  await $newReportTitle.click()
  await t.context.driver.sleep(shortWaitMs) // wait for the advanced select overlay to disappear

  t.is(
    await $attendeesAdvancedSelect1.getAttribute("value"),
    "",
    "Closing the attendees advanced multi select overlay empties the input field."
  )

  const [
    $interlocutorControls1,
    /* eslint-disable no-unused-vars */ $interlocutorConflictBtn /* eslint-enable no-unused-vars */,
    $interlocutorName1,
    $interlocutorPosition1,
    /* eslint-disable no-unused-vars */ $interlocutorLocation1 /* eslint-enable no-unused-vars */,
    $interlocutorOrg1
  ] = await $$(".interlocutorAttendeesTable tbody tr:nth-child(2) td")

  const $interlocutorPrimaryInput1 = await $interlocutorControls1.findElement(
    By.css("[name = 'primaryAttendeeINTERLOCUTOR']")
  )
  t.true(
    await $interlocutorPrimaryInput1.isSelected(),
    "Interlocutor primary attendee checkbox should be checked"
  )

  await assertElementText(t, $interlocutorName1, "CIV TOPFERNESS, Christopf")
  await assertElementText(
    t,
    $interlocutorPosition1,
    "Planning Captain, MOD-FO-00004"
  )
  await assertElementText(t, $interlocutorOrg1, "MoD | Ministry of Defense")

  const $attendeesAdvancedSelect2 =
    await pageHelpers.chooseAdvancedSelectOption(
      "#reportPeople",
      "steveson, steve"
    )
  await $newReportTitle.click()
  await t.context.driver.sleep(shortWaitMs) // wait for the advanced select overlay to disappear

  t.is(
    await $attendeesAdvancedSelect2.getAttribute("value"),
    "",
    "Closing the attendees advanced multi select overlay empties the input field."
  )

  const [
    $interlocutorControls2,
    /* eslint-disable no-unused-vars */ $interlocutorAuthorConflictBtn /* eslint-enable no-unused-vars */,
    $interlocutorName2,
    /* eslint-disable no-unused-vars */
    $interlocutorPosition2,
    $interlocutorLocation2,
    $interlocutorOrg2 /* eslint-enable no-unused-vars */
  ] = await $$(".interlocutorAttendeesTable tbody tr:last-child td")

  await assertElementText(t, $interlocutorName2, "OF-4 STEVESON, Steve")
  const $interlocutorPrimaryInput2 = await $interlocutorControls2.findElement(
    By.css("[name = 'primaryAttendeeINTERLOCUTOR']")
  )
  t.false(
    await $interlocutorPrimaryInput2.isSelected(),
    "Second interlocutor primary attendee checkbox should not be checked"
  )

  await $interlocutorPrimaryInput2.click()
  t.true(
    await $interlocutorPrimaryInput2.isSelected(),
    "Second interlocutor primary attendee checkbox should now be checked"
  )
  t.false(
    await $interlocutorPrimaryInput1.isSelected(),
    "First interlocutor primary attendee checkbox should no longer be checked"
  )

  const $tasksAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#tasks",
    "2.B",
    2
  )

  const $tasksTitle = await t.context.driver.findElement(
    By.xpath('//h4/span[text()="Objectives"]')
  )
  await $tasksTitle.click()
  await t.context.driver.sleep(shortWaitMs) // wait for the advanced select overlay to disappear

  t.is(
    await $tasksAdvancedSelect.getAttribute("value"),
    "",
    "Closing the tasks advanced multi select overlay empties the input field."
  )

  const $newTaskRow = await $("#tasks-tasks table tbody tr td")
  await assertElementText(t, $newTaskRow, "EF 2 » 2.B")

  await pageHelpers.writeInForm("#keyOutcomes", "key outcomes")
  await pageHelpers.writeInForm("#nextSteps", "next steps")
  await pageHelpers.writeInForm(
    ".reportTextField .editable",
    "engagement details",
    shortWaitMs // wait for Slate to save the editor contents
  )

  const editorCssPath = ".reportSensitiveInformationField .editable"
  const $reportSensitiveInformationField = await $(editorCssPath)
  t.false(
    await $reportSensitiveInformationField.isDisplayed(),
    'Report sensitive info should not be present before "add sensitive information" button is clicked"'
  )

  const $addSensitiveInfoButton = await $("#toggleSensitiveInfo")
  await $addSensitiveInfoButton.click()

  await t.context.driver.wait(
    until.elementIsVisible($reportSensitiveInformationField)
  )
  await pageHelpers.writeInForm(
    editorCssPath,
    "sensitive info",
    shortWaitMs // wait for Slate to save the editor contents
  )
  const $addAuthGroupShortcutButtons = await $$(
    "#authorizationGroups-shortcut-list button"
  )
  // Add all recent communities
  const nrAuthGroups = $addAuthGroupShortcutButtons.length
  for (let i = 0; i < nrAuthGroups; i++) {
    await (await $("#authorizationGroups-shortcut-list button")).click()
  }

  const $formButtonSubmit = await $("#formBottomSubmit")
  await t.context.driver.wait(
    until.elementIsEnabled($formButtonSubmit),
    mediumWaitMs
  )
  await $formButtonSubmit.click()
  await pageHelpers.assertReportShowStatusText(
    t,
    "This is a DRAFT report and hasn't been submitted."
  )

  const currentPathname = await t.context.getCurrentPathname()
  t.regex(
    currentPathname,
    /reports\/[0-9a-f-]+/,
    "URL is updated to reports/show page"
  )
  testReportURL = currentPathname

  const $submitReportButton = await $("#submitReportButton")
  await $submitReportButton.click()
  await t.context.driver.wait(
    t.context.untilStalenessOf($submitReportButton),
    mediumWaitMs
  )
  await assertElementNotPresent(
    t,
    "#submitReportButton",
    "Submit button should be gone",
    shortWaitMs
  )
  await pageHelpers.assertReportShowStatusText(
    t,
    "This report is PENDING approvals."
  )

  const $allertSuccess = await t.context.driver.findElement(
    By.css(".alert-success")
  )
  await t.context.driver.wait(
    until.elementIsVisible($allertSuccess),
    mediumWaitMs
  )
  await assertElementText(
    t,
    $allertSuccess,
    "Report submitted",
    "Clicking the submit report button displays a message telling the user that the action was successful."
  )

  await t.context.logout()
})

test.serial("Publish report chain", async t => {
  t.plan(6)

  const {
    pageHelpers,
    $,
    $$,
    assertElementText,
    By,
    until,
    mediumWaitMs,
    longWaitMs
  } = t.context

  // First Jacob needs to approve the report, then Rebecca can approve the report
  await approveReport(t, "jacob")
  await approveReport(t, "rebecca")
  // Then the task owner can approve the report
  await approveReport(t, "jack")

  // Admin user needs to publish the report
  await t.context.get("/", "arthur")
  const $homeTileArthur = await $$(".home-tile")
  const [
    /* eslint-disable no-unused-vars */
    $draftReportsArthur,
    $reportsPendingAll,
    $reportsPendingArthur,
    $plannedEngagementsArthur,
    $reportsSensitiveInfo,
    /* eslint-enable no-unused-vars */
    $approvedReports
  ] = $homeTileArthur
  await t.context.driver.wait(
    until.elementIsVisible($approvedReports),
    mediumWaitMs
  )
  await $approvedReports.click()
  await t.context.driver.wait(
    t.context.untilStalenessOf($approvedReports),
    mediumWaitMs
  )

  const $reportsApprovedSummaryTab = await $(
    ".report-collection button[value='summary']"
  )
  await $reportsApprovedSummaryTab.click()

  const $readApprovedReportButton = await $(
    ".read-report-button[href='" + testReportURL + "']"
  )
  await t.context.driver.wait(
    until.elementIsEnabled($readApprovedReportButton),
    mediumWaitMs
  )
  await $readApprovedReportButton.click()

  await pageHelpers.assertReportShowStatusText(t, "This report is APPROVED.")
  const $arthurPublishButton = await $(".publish-button")
  await $arthurPublishButton.click()
  await t.context.driver.wait(
    t.context.untilStalenessOf($arthurPublishButton),
    mediumWaitMs
  )

  // check if page is redirected to search results

  // let $notificationDailyRollup = await t.context.driver.findElement(By.css('.Toastify__toast-body'))
  // await assertElementText(
  //     t,
  //     $notificationDailyRollup,
  //     'Successfully approved report. It has been added to the daily rollup',
  //     'When a report is approved, the user sees a message indicating that it has been added to the daily rollup'
  // )

  const $rollupLink = await t.context.driver.findElement(
    By.linkText("Daily Rollup")
  )
  await t.context.driver.wait(until.elementIsEnabled($rollupLink), mediumWaitMs)
  await $rollupLink.click()
  const currentPathname = await t.context.getCurrentPathname()
  t.is(
    currentPathname,
    "/rollup",
    'Clicking the "Daily Rollup" link takes the user to the rollup page'
  )
  await $("#daily-rollup")

  await t.context.driver.sleep(longWaitMs) // wait for report collection to load

  const $rollupTableTab = await $(".report-collection button[value='table']")
  await $rollupTableTab.click()

  const $reportCollectionTable = await $(".report-collection table")
  await t.context.driver.wait(
    until.elementIsVisible($reportCollectionTable),
    mediumWaitMs
  )
  const $approvedIntent = await $reportCollectionTable.findElement(
    By.linkText("meeting goal")
  )
  await assertElementText(
    t,
    $approvedIntent,
    "meeting goal",
    "Daily Rollup report list includes the recently approved report"
  )

  await t.context.logout()
})

async function approveReport(t, user) {
  const { pageHelpers, $, $$, until, mediumWaitMs } = t.context

  await t.context.get("/", user)
  const $homeTile = await $$(".home-tile")
  const [
    /* eslint-disable no-unused-vars */ $draftReports /* eslint-enable no-unused-vars */,
    $reportsPending,
    /* eslint-disable no-unused-vars */
    $orgReports,
    $plannedEngagements
    /* eslint-enable no-unused-vars */
  ] = $homeTile
  await t.context.driver.wait(
    until.elementIsVisible($reportsPending),
    mediumWaitMs
  )
  await $reportsPending.click()
  await t.context.driver.wait(
    t.context.untilStalenessOf($reportsPending),
    mediumWaitMs
  )

  const $reportsPendingSummaryTab = await $(
    ".report-collection button[value='summary']"
  )
  await t.context.driver.wait(until.elementIsEnabled($reportsPendingSummaryTab))
  await $reportsPendingSummaryTab.click()

  const $readReportButton = await $(
    ".read-report-button[href='" + testReportURL + "']"
  )
  await t.context.driver.wait(
    until.elementIsEnabled($readReportButton),
    mediumWaitMs
  )
  await $readReportButton.click()
  await pageHelpers.assertReportShowStatusText(
    t,
    "This report is PENDING approvals."
  )
  const $ApproveButton = await $(".approve-button")
  await t.context.driver.wait(
    until.elementIsEnabled($ApproveButton),
    mediumWaitMs
  )
  await $ApproveButton.click()
  await t.context.driver.wait(
    t.context.untilStalenessOf($ApproveButton),
    mediumWaitMs
  )

  await t.context.logout()
}
test.serial("Verify that validations work", async t => {
  t.plan(26)

  const {
    assertElementText,
    $,
    $$,
    assertElementNotPresent,
    pageHelpers,
    shortWaitMs,
    By,
    until
  } = t.context

  await pageHelpers.goHomeAndThenToReportsPage()
  await assertElementText(
    t,
    await $(".legend .title-text"),
    "Create a new Report"
  )

  async function verifyFieldIsRequired($input, id, type, fieldName) {
    await $input.click()
    await $input.clear()
    const $searchBarInput = await $("#searchBarInput")
    await $searchBarInput.click()

    await t.context.driver.wait(
      until.elementLocated(
        By.css(`${type}[id="${id}"] ~ div[class="invalid-feedback"]`)
      )
    )

    await $input.sendKeys("user input")
    await $input.sendKeys(t.context.Key.TAB) // fire blur event
    // send escape key to make sure any pop-ups are being closed
    await t.context.driver.actions().sendKeys(t.context.Key.ESCAPE).perform()

    t.false(
      (await t.context.driver.findElements(
        By.css(`textarea[id="${id}"] ~ div[class="invalid-feedback"]`)
      ).length) > 0,
      `After typing in ${fieldName} field, warning state goes away`
    )
  }

  const $meetingGoalInput = await $("#intent")
  // check that parent div.form-group does not have class 'has-error'
  t.false(
    (await t.context.driver.findElements(
      By.css('textarea[id="intent"] ~ div[class="invalid-feedback"]')
    ).length) > 0,
    "Meeting goal does not start in an invalid state"
  )
  t.is(
    await $meetingGoalInput.getAttribute("value"),
    "",
    "Meeting goal field starts blank"
  )

  // check that parent div.form-group now has a class 'has-error'
  await verifyFieldIsRequired(
    $meetingGoalInput,
    "intent",
    "textarea",
    "Meeting goal"
  )

  const $engagementDate = await $("#engagementDate")
  t.is(
    await $engagementDate.getAttribute("value"),
    "",
    "Engagement date field starts blank"
  )
  await $engagementDate.click()
  await t.context.driver.sleep(shortWaitMs) // wait for the datepicker to pop up

  await pageHelpers.clickTodayButton()

  // set time as well
  const $hourInput = await $("input.bp6-timepicker-input.bp6-timepicker-hour")
  // clear field, enter data, fire blur event
  await $hourInput.sendKeys(
    t.context.Key.END +
      t.context.Key.BACK_SPACE.repeat(2) +
      "23" +
      t.context.Key.TAB
  )
  const $minuteInput = await $(
    "input.bp6-timepicker-input.bp6-timepicker-minute"
  )
  // clear field, enter data, fire blur event
  await $minuteInput.sendKeys(
    t.context.Key.END +
      t.context.Key.BACK_SPACE.repeat(2) +
      "45" +
      t.context.Key.TAB
  )

  // send escape key to make sure the date picker is being closed
  await t.context.driver.actions().sendKeys(t.context.Key.ESCAPE).perform()

  // check date and time
  const dateTimeFormat = "DD-MM-YYYY HH:mm"
  const dateTimeValue = await $engagementDate.getAttribute("value")
  const expectedDateTime = moment().hour(23).minute(45).format(dateTimeFormat)
  t.is(
    dateTimeValue,
    expectedDateTime,
    'Clicking the "today" button puts the current date in the engagement field'
  )

  const $locationInput = await $("#location")
  t.is(
    await $locationInput.getAttribute("value"),
    "",
    "Location field starts blank"
  )

  const $locationShortcutButton = await $("#location-shortcut-list button")
  await $locationShortcutButton.click()
  t.is(
    await $locationInput.getAttribute("value"),
    "General Hospital",
    "Clicking the shortcut adds a location"
  )

  await assertElementNotPresent(
    t,
    "#cancelledReason",
    "Cancelled reason should not be present initially",
    shortWaitMs
  )
  const $atmosphereFormGroup = await $(".atmosphere-form-group")
  t.true(
    await $atmosphereFormGroup.isDisplayed(),
    "Atmospherics form group should be shown by default"
  )

  await assertElementNotPresent(
    t,
    "#atmosphere-details",
    "Atmospherics details should not be displayed before choosing atmospherics",
    shortWaitMs
  )

  const $positiveAtmosphereButton = await $('label[for="atmosphere_POSITIVE"]')
  await $positiveAtmosphereButton.click()

  const $atmosphereDetails = await $("#atmosphereDetails")
  t.is(
    await $atmosphereDetails.getAttribute("placeholder"),
    "Describe the atmosphere"
  )

  const $neutralAtmosphereButton = await $('label[for="atmosphere_NEUTRAL"]')
  await $neutralAtmosphereButton.click()
  t.is(
    await $atmosphereDetails.getAttribute("placeholder"),
    "Describe the atmosphere"
  )

  const $negativeAtmosphereButton = await $('label[for="atmosphere_NEGATIVE"]')
  await $negativeAtmosphereButton.click()
  t.is(
    await $atmosphereDetails.getAttribute("placeholder"),
    "Describe the atmosphere"
  )

  const $reportPeopleFieldsetTitle = await $(
    "#reportPeople-fieldset .title-text"
  )
  await assertElementText(
    t,
    $reportPeopleFieldsetTitle,
    "People involved in this engagement",
    "People fieldset should have correct title for an uncancelled enagement"
  )

  const $cancelledCheckbox = await $(".cancelled-checkbox input")
  // Move element into view
  const actions = t.context.driver.actions({ async: true })
  await actions.move({ origin: $cancelledCheckbox }).perform()
  await $cancelledCheckbox.click()

  await assertElementNotPresent(
    t,
    ".atmosphere-form-group",
    "After cancelling the enagement, the atmospherics should be hidden",
    shortWaitMs
  )
  const $cancelledReason = await $(".cancelled-reason-form-group")
  t.true(
    await $cancelledReason.isDisplayed(),
    "After cancelling the engagement, the cancellation reason should appear"
  )
  await assertElementText(
    t,
    $reportPeopleFieldsetTitle,
    "People who will be involved in this planned engagement",
    "People fieldset should have correct title for a cancelled enagement"
  )

  let $advisorAttendeesRows = await $$(".advisorAttendeesTable tbody tr")
  t.is(
    $advisorAttendeesRows.length,
    1,
    "Advisor attendees table starts with 1 body rows"
  )

  let $interlocutorAttendeesRows = await $$(
    ".interlocutorAttendeesTable tbody tr"
  )
  t.is(
    $interlocutorAttendeesRows.length,
    1,
    "Interlocutor attendees table starts with 1 body rows"
  )

  const [
    $advisorControls,
    /* eslint-disable no-unused-vars */ $advisorConflictBtn /* eslint-enable no-unused-vars */,
    $advisorName,
    $advisorPosition,
    /* eslint-disable no-unused-vars */ $advisorLocation /* eslint-enable no-unused-vars */,
    $advisorOrg
  ] = await $$(".advisorAttendeesTable tbody tr:first-child td")

  t.is(
    await $advisorControls
      .findElement(By.css("[name = 'primaryAttendeeADVISOR']"))
      .getAttribute("value"),
    "on",
    "Advisor primary attendee checkbox should be checked"
  )
  await assertElementText(t, $advisorName, "CIV ERINSON, Erin")
  await assertElementText(t, $advisorPosition, "EF 2.2 Advisor D")
  await assertElementText(t, $advisorOrg, "EF 2.2")

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
  t.is(
    $advisorAttendeesRows.length + $interlocutorAttendeesRows.length,
    // should match the number of shortcut buttons plus the initial advisor and interlocutor
    nrAttendees + 2,
    "Clicking the shortcut buttons adds rows to the table"
  )

  const $submitButton = await $("#formBottomSubmit")
  await $submitButton.click()
  await pageHelpers.assertReportShowStatusText(
    t,
    "This is a DRAFT report and hasn't been submitted."
  )

  await t.context.logout()
})
