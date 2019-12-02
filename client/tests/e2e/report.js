let assert = require("assert")
let _includes = require("lodash/includes")
let moment = require("moment")
let test = require("../util/test")

var testReportURL = null

test("Draft and submit a report", async t => {
  t.plan(14)

  let {
    pageHelpers,
    $,
    $$,
    assertElementText,
    assertElementNotPresent,
    By,
    until,
    shortWaitMs
  } = t.context

  await httpRequestSmtpServer("DELETE")

  await pageHelpers.goHomeAndThenToReportsPage()
  await pageHelpers.writeInForm("#intent", "meeting goal")

  let $engagementDate = await $("#engagementDate")
  await $engagementDate.click()
  await t.context.driver.sleep(shortWaitMs) // wait for the datepicker to pop up

  await pageHelpers.clickTodayButton()

  let $intent = await $("#intent")
  await $intent.click() // click intent to make sure the date picker is being closed

  let $locationAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#location",
    "general hospita"
  )

  t.is(
    await $locationAdvancedSelect.getAttribute("value"),
    "General Hospital",
    "Clicking a location advanced single select widget suggestion populates the input field."
  )

  let $positiveAtmosphereButton = await $("#positiveAtmos")
  await $positiveAtmosphereButton.click()

  let $attendeesAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#attendees",
    "topferness, christopf"
  )

  // click outside the overlay to make sure the $attendeesShortcutList closes
  let $attendeesShortcutList = await $("#tasks-shortcut-list")
  await $attendeesShortcutList.click()

  t.is(
    await $attendeesAdvancedSelect.getAttribute("value"),
    "",
    "Closing the attendees advanced multi select overlay empties the input field."
  )

  let [
    $principalPrimaryInput,
    $principalName,
    $principalPosition,
    /* eslint-disable no-unused-vars */ $principalLocation /* eslint-enable no-unused-vars */,
    $principalOrg
  ] = await $$(".principalAttendeesTable tbody tr:last-child td")

  t.true(
    await $principalPrimaryInput.findElement(By.css("input")).isSelected(),
    "Principal primary attendee checkbox should be checked"
  )
  await assertElementText(t, $principalName, "CIV TOPFERNESS, Christopf")
  await assertElementText(
    t,
    $principalPosition,
    "Planning Captain, MOD-FO-00004"
  )
  await assertElementText(t, $principalOrg, "MoD")

  let $tasksAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#tasks",
    "1.1.B"
  )

  // click outside the overlay to make sure the $tasksAdvancedSelect closes
  let $keyOutcomes = await $("#keyOutcomes")
  await $keyOutcomes.click()

  t.is(
    await $tasksAdvancedSelect.getAttribute("value"),
    "",
    "Closing the tasks advanced multi select overlay empties the input field."
  )

  const taskRowSelector = ".tasks-selector table tbody tr td"
  let $newTaskRow = await $(taskRowSelector)
  await t.context.driver.wait(until.stalenessOf($newTaskRow))

  await assertElementText(
    t,
    await $(taskRowSelector),
    "1.1.B - Milestone the Second in EF 1.1"
  )

  await pageHelpers.writeInForm("#keyOutcomes", "key outcomes")
  await pageHelpers.writeInForm("#nextSteps", "next steps")
  await pageHelpers.writeInForm(
    ".reportTextField .public-DraftEditor-content",
    "engagement details"
  )

  let editorCssPath =
    ".reportSensitiveInformationField .public-DraftEditor-content"
  let $reportSensitiveInformationField = await $(editorCssPath)
  t.false(
    await $reportSensitiveInformationField.isDisplayed(),
    'Report sensitive info should not be present before "add sensitive information" button is clicked"'
  )

  let $addSensitiveInfoButton = await $("#toggleSensitiveInfo")
  await $addSensitiveInfoButton.click()

  await t.context.driver.wait(
    until.elementIsVisible($reportSensitiveInformationField)
  )
  await pageHelpers.writeInForm(editorCssPath, "sensitive info")
  let $addAuthGroupShortcutButtons = await $$(
    "#meeting-details .shortcut-list button"
  )
  // Add all recent authorization groups
  await Promise.all(
    $addAuthGroupShortcutButtons.map($button => $button.click())
  )

  let $formButtonSubmit = await $("#formBottomSubmit")
  await t.context.driver.wait(until.elementIsEnabled($formButtonSubmit))
  await $formButtonSubmit.click()
  await pageHelpers.assertReportShowStatusText(
    t,
    "This is a DRAFT report and hasn't been submitted."
  )

  let currentPathname = await t.context.getCurrentPathname()
  t.regex(
    currentPathname,
    /reports\/[0-9a-f-]+/,
    "URL is updated to reports/show page"
  )
  testReportURL = currentPathname

  let $submitReportButton = await $("#submitReportButton")
  await $submitReportButton.click()
  await t.context.driver.wait(until.stalenessOf($submitReportButton))
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

  let $allertSuccess = await t.context.driver.findElement(
    By.css(".alert-success")
  )
  await t.context.driver.wait(until.elementIsVisible($allertSuccess))
  await assertElementText(
    t,
    $allertSuccess,
    "Report submitted",
    "Clicking the submit report button displays a message telling the user that the action was successful."
  )

  var serverResponse = await httpRequestSmtpServer("GET")
  var jsonResponse = JSON.parse(serverResponse)
  await assert.strictEqual(jsonResponse.length, 0) // Domain not in active users
})

test("Publish report chain", async t => {
  t.plan(6)

  let {
    pageHelpers,
    $,
    $$,
    assertElementText,
    By,
    Key,
    until,
    shortWaitMs,
    longWaitMs
  } = t.context

  await httpRequestSmtpServer("DELETE")

  // Try to have Erin approve her own report
  await t.context.get("/", "erin")
  let $homeTileErin = await $$(".home-tile")
  let [
    /* eslint-disable no-unused-vars */ $draftReportsErin /* eslint-enable no-unused-vars */,
    $reportsPendingErin,
    /* eslint-disable no-unused-vars */
    $orgReportsErin,
    $plannedEngagementsErin
    /* eslint-enable no-unused-vars */
  ] = $homeTileErin
  await t.context.driver.wait(until.elementIsVisible($reportsPendingErin))
  await $reportsPendingErin.click()
  await t.context.driver.wait(until.stalenessOf($reportsPendingErin))
  let $reportCollection = await $(".report-collection em")
  await assertElementText(
    t,
    $reportCollection,
    "No reports found",
    "Erin should not be allowed to approve her own reports"
  )

  // First Jacob needs to approve the report, then rebecca can approve the report
  await t.context.get("/", "jacob")
  let $homeTileJacob = await $$(".home-tile")
  let [
    /* eslint-disable no-unused-vars */ $draftReportsJacob /* eslint-enable no-unused-vars */,
    $reportsPendingJacob,
    /* eslint-disable no-unused-vars */
    $orgReportsJacob,
    $plannedEngagementsJacob
    /* eslint-enable no-unused-vars */
  ] = $homeTileJacob
  await t.context.driver.wait(until.elementIsVisible($reportsPendingJacob))
  await $reportsPendingJacob.click()
  await t.context.driver.wait(until.stalenessOf($reportsPendingJacob))

  let $reportsPendingJacobSummaryTab = await $(
    ".report-collection button[value='summary']"
  )
  await t.context.driver.wait(
    until.elementIsEnabled($reportsPendingJacobSummaryTab)
  )
  await $reportsPendingJacobSummaryTab.click()

  let $readReportButtonJacob = await $(
    ".read-report-button[href='" + testReportURL + "']"
  )
  await t.context.driver.wait(until.elementIsEnabled($readReportButtonJacob))
  await $readReportButtonJacob.click()
  await pageHelpers.assertReportShowStatusText(
    t,
    "This report is PENDING approvals."
  )
  let $jacobApproveButton = await $(".approve-button")
  await t.context.driver.wait(until.elementIsEnabled($jacobApproveButton))
  await $jacobApproveButton.click()
  await t.context.driver.wait(until.stalenessOf($jacobApproveButton))

  await t.context.get("/", "rebecca")
  let $homeTile = await $$(".home-tile")
  let [
    /* eslint-disable no-unused-vars */ $draftReports /* eslint-enable no-unused-vars */,
    $reportsPending,
    /* eslint-disable no-unused-vars */
    $orgReports,
    $plannedEngagements
    /* eslint-enable no-unused-vars */
  ] = $homeTile
  await t.context.driver.wait(until.elementIsVisible($reportsPending))
  await $reportsPending.click()
  await t.context.driver.wait(until.stalenessOf($reportsPending))

  let $reportsPendingRebeccaSummaryTab = await $(
    ".report-collection button[value='summary']"
  )
  await t.context.driver.wait(
    until.elementIsEnabled($reportsPendingRebeccaSummaryTab)
  )
  await $reportsPendingRebeccaSummaryTab.click()

  let $readReportButtonRebecca = await $(
    ".read-report-button[href='" + testReportURL + "']"
  )
  await t.context.driver.wait(until.elementIsEnabled($readReportButtonRebecca))
  await $readReportButtonRebecca.click()

  await pageHelpers.assertReportShowStatusText(
    t,
    "This report is PENDING approvals."
  )
  let $rebeccaApproveButton = await $(".approve-button")
  await $rebeccaApproveButton.click()
  await t.context.driver.wait(until.stalenessOf($rebeccaApproveButton))

  // Admin user needs to publish the report
  await t.context.get("/", "arthur")
  let $homeTileArthur = await $$(".home-tile")
  let [
    /* eslint-disable no-unused-vars */
    $draftReportsArthur,
    $reportsPendingAll,
    $reportsPendingArthur,
    $plannedEngagementsArthur,
    $reportsSensitiveInfo,
    /* eslint-enable no-unused-vars */
    $approvedReports
  ] = $homeTileArthur
  await t.context.driver.wait(until.elementIsVisible($approvedReports))
  await $approvedReports.click()
  await t.context.driver.wait(until.stalenessOf($approvedReports))

  let $reportsApprovedSummaryTab = await $(
    ".report-collection button[value='summary']"
  )
  await $reportsApprovedSummaryTab.click()

  let $readApprovedReportButton = await $(
    ".read-report-button[href='" + testReportURL + "']"
  )
  await t.context.driver.wait(until.elementIsEnabled($readApprovedReportButton))
  await $readApprovedReportButton.click()

  await pageHelpers.assertReportShowStatusText(t, "This report is APPROVED.")
  let $arthurPublishButton = await $(".publish-button")
  await $arthurPublishButton.click()
  await t.context.driver.wait(until.stalenessOf($arthurPublishButton))

  // check if page is redirected to search results

  // let $notificationDailyRollup = await t.context.driver.findElement(By.css('.Toastify__toast-body'))
  // await assertElementText(
  //     t,
  //     $notificationDailyRollup,
  //     'Successfully approved report. It has been added to the daily rollup',
  //     'When a report is approved, the user sees a message indicating that it has been added to the daily rollup'
  // )

  let $rollupLink = await t.context.driver.findElement(
    By.linkText("Daily rollup")
  )
  await t.context.driver.wait(until.elementIsEnabled($rollupLink))
  await $rollupLink.click()
  let currentPathname = await t.context.getCurrentPathname()
  t.is(
    currentPathname,
    "/rollup",
    'Clicking the "daily rollup" link takes the user to the rollup page'
  )
  await $("#daily-rollup")

  let $$rollupDateRange = await $$(".rollupDateRange .bp3-input")
  await $$rollupDateRange[0].click()
  await t.context.driver.sleep(shortWaitMs) // wait for datepicker to show
  let $todayButton = await t.context.driver.findElement(
    By.xpath('//a/div[text()="Today"]')
  )
  await $todayButton.click()
  // Now dismiss the date popup
  await $$rollupDateRange[0].sendKeys(Key.TAB)
  await $$rollupDateRange[1].sendKeys(Key.TAB)
  await t.context.driver.sleep(longWaitMs) // wait for report collection to load

  let $rollupTableTab = await $(".report-collection button[value='table']")
  await $rollupTableTab.click()

  let $reportCollectionTable = await $(".report-collection table")
  await t.context.driver.wait(until.elementIsVisible($reportCollectionTable))
  let $approvedIntent = await $reportCollectionTable.findElement(
    By.linkText("meeting goal")
  )
  await assertElementText(
    t,
    $approvedIntent,
    "meeting goal",
    "Daily rollup report list includes the recently approved report"
  )

  var serverResponse = await httpRequestSmtpServer("GET")
  var jsonResponse = JSON.parse(serverResponse)
  await assert.strictEqual(jsonResponse.length, 0) // Domains not in active users
})

test("Verify that validation and other reports/new interactions work", async t => {
  t.plan(29)

  let {
    assertElementText,
    $,
    $$,
    assertElementNotPresent,
    pageHelpers,
    shortWaitMs,
    By
  } = t.context

  await httpRequestSmtpServer("DELETE")

  await pageHelpers.goHomeAndThenToReportsPage()
  await assertElementText(
    t,
    await $(".legend .title-text"),
    "Create a new Report"
  )

  let $searchBarInput = await $("#searchBarInput")

  async function verifyFieldIsRequired(
    $fieldGroup,
    $input,
    warningClass,
    fieldName
  ) {
    await $input.click()
    await $input.clear()
    await $searchBarInput.click()

    t.true(
      _includes(await $fieldGroup.getAttribute("class"), warningClass),
      `${fieldName} enters invalid state when the user leaves the field without entering anything`
    )

    await $input.sendKeys("user input")
    await $input.sendKeys(t.context.Key.TAB) // fire blur event
    t.false(
      _includes(await $fieldGroup.getAttribute("class"), warningClass),
      `After typing in ${fieldName} field, warning state goes away`
    )
  }

  let $meetingGoalInput = await $("#intent")
  let $meetingGoalDiv = await t.context.driver.findElement(
    By.xpath(
      '//textarea[@id="intent"]/ancestor::div[contains(concat(" ", normalize-space(@class), " "), " form-group ")]'
    )
  )
  // check that parent div.form-group does not have class 'has-error'
  t.false(
    _includes(await $meetingGoalDiv.getAttribute("class"), "has-error"),
    "Meeting goal does not start in an invalid state"
  )
  t.is(
    await $meetingGoalInput.getAttribute("value"),
    "",
    "Meeting goal field starts blank"
  )

  // check that parent div.form-group now has a class 'has-error'
  await verifyFieldIsRequired(
    $meetingGoalDiv,
    $meetingGoalInput,
    "has-error",
    "Meeting goal"
  )

  let $engagementDate = await $("#engagementDate")
  t.is(
    await $engagementDate.getAttribute("value"),
    "",
    "Engagement date field starts blank"
  )
  await $engagementDate.click()
  await t.context.driver.sleep(shortWaitMs) // wait for the datepicker to pop up

  await pageHelpers.clickTodayButton()

  // set time as well
  let $hourInput = await $("input.bp3-timepicker-input.bp3-timepicker-hour")
  // clear field, enter data, fire blur event
  await $hourInput.sendKeys(
    t.context.Key.END +
      t.context.Key.BACK_SPACE.repeat(2) +
      "23" +
      t.context.Key.TAB
  )
  let $minuteInput = await $("input.bp3-timepicker-input.bp3-timepicker-minute")
  // clear field, enter data, fire blur event
  await $minuteInput.sendKeys(
    t.context.Key.END +
      t.context.Key.BACK_SPACE.repeat(2) +
      "45" +
      t.context.Key.TAB
  )

  // check date and time
  let dateTimeFormat = "DD-MM-YYYY HH:mm"
  let dateTimeValue = await $engagementDate.getAttribute("value")
  let expectedDateTime = moment()
    .hour(23)
    .minute(45)
    .format(dateTimeFormat)
  t.is(
    dateTimeValue,
    expectedDateTime,
    'Clicking the "today" button puts the current date in the engagement field'
  )

  let $locationInput = await $("#location")
  t.is(
    await $locationInput.getAttribute("value"),
    "",
    "Location field starts blank"
  )

  let $locationShortcutButton = await $("#location-shortcut-list button")
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
  let $atmosphereFormGroup = await $(".atmosphere-form-group")
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

  let $positiveAtmosphereButton = await $("#positiveAtmos")
  await $positiveAtmosphereButton.click()

  let $atmosphereDetails = await $("#atmosphereDetails")
  t.is(
    await $atmosphereDetails.getAttribute("placeholder"),
    "Why was this engagement positive? (optional)"
  )

  let $neutralAtmosphereButton = await $("#neutralAtmos")
  await $neutralAtmosphereButton.click()
  t.is(
    (await $atmosphereDetails.getAttribute("placeholder")).trim(),
    "Why was this engagement neutral?"
  )

  let $negativeAtmosphereButton = await $("#negativeAtmos")
  await $negativeAtmosphereButton.click()
  t.is(
    (await $atmosphereDetails.getAttribute("placeholder")).trim(),
    "Why was this engagement negative?"
  )

  let $atmosphereDetailsGroup = await t.context.driver.findElement(
    By.xpath(
      '//input[@id="atmosphereDetails"]/ancestor::div[contains(concat(" ", normalize-space(@class), " "), " form-group ")]'
    )
  )

  await $neutralAtmosphereButton.click()
  // check that parent div.form-group now has a class 'has-error'
  await verifyFieldIsRequired(
    $atmosphereDetailsGroup,
    $atmosphereDetails,
    "has-error",
    "Neutral atmospherics details"
  )

  let $attendanceFieldsetTitle = await $("#attendance-fieldset .title-text")
  await assertElementText(
    t,
    $attendanceFieldsetTitle,
    "Meeting attendance",
    "Meeting attendance fieldset should have correct title for an uncancelled enagement"
  )

  let $cancelledCheckbox = await $(".cancelled-checkbox")
  await $cancelledCheckbox.click()

  await assertElementNotPresent(
    t,
    ".atmosphere-form-group",
    "After cancelling the enagement, the atmospherics should be hidden",
    shortWaitMs
  )
  let $cancelledReason = await $(".cancelled-reason-form-group")
  t.true(
    await $cancelledReason.isDisplayed(),
    "After cancelling the engagement, the cancellation reason should appear"
  )
  await assertElementText(
    t,
    $attendanceFieldsetTitle,
    "Planned attendance",
    "Meeting attendance fieldset should have correct title for a cancelled enagement"
  )

  let $advisorAttendeesRows = await $$(".advisorAttendeesTable tbody tr")
  t.is(
    $advisorAttendeesRows.length,
    1,
    "Advisor attendees table starts with 1 body rows"
  )

  let $principalAttendeesRows = await $$(".principalAttendeesTable tbody tr")
  t.is(
    $principalAttendeesRows.length,
    1,
    "Principal attendees table starts with 1 body rows"
  )

  let [
    $advisorPrimaryCheckbox,
    $advisorName,
    $advisorPosition,
    /* eslint-disable no-unused-vars */ $advisorLocation /* eslint-enable no-unused-vars */,
    $advisorOrg
  ] = await $$(".advisorAttendeesTable tbody tr:first-child td")

  t.is(
    await $advisorPrimaryCheckbox
      .findElement(By.css("input"))
      .getAttribute("value"),
    "on",
    "Advisor primary attendee checkbox should be checked"
  )
  await assertElementText(t, $advisorName, "CIV ERINSON, Erin")
  await assertElementText(t, $advisorPosition, "EF 2.2 Advisor D")
  await assertElementText(t, $advisorOrg, "EF 2.2")

  let $addAttendeeShortcutButtons = await $$("#attendees-shortcut-list button")
  // Add all recent attendees
  await Promise.all($addAttendeeShortcutButtons.map($button => $button.click()))

  $advisorAttendeesRows = await $$(".advisorAttendeesTable tbody tr")
  $principalAttendeesRows = await $$(".principalAttendeesTable tbody tr")
  t.is(
    $advisorAttendeesRows.length + $principalAttendeesRows.length,
    4,
    "Clicking the shortcut buttons adds rows to the table"
  )

  let $submitButton = await $("#formBottomSubmit")
  await $submitButton.click()
  await pageHelpers.assertReportShowStatusText(
    t,
    "This is a DRAFT report and hasn't been submitted."
  )

  var serverResponse = await httpRequestSmtpServer("GET")
  var jsonResponse = JSON.parse(serverResponse)
  await assert.strictEqual(jsonResponse.length, 0) // No email should be sent
})

function httpRequestSmtpServer(requestType) {
  return new Promise((resolve, reject) => {
    var XMLHttpRequest = require("xhr2")
    const xhttp = new XMLHttpRequest()
    // FIXME: Hard-coded URL
    const url = "http://localhost:1180/api/emails"
    xhttp.open(requestType, url)
    xhttp.send()
    xhttp.onreadystatechange = e => {
      if (xhttp.readyState === 4) {
        if (xhttp.status === 200) {
          resolve(xhttp.responseText)
        }
      }
    }
  })
}
