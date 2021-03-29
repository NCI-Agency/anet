const _includes = require("lodash/includes")
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

  const $intent = await $("#intent")
  await $intent.click() // click intent to make sure the date picker is being closed

  const $locationAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#location",
    "general hospit",
    2 // choose filter "All"
  )

  t.is(
    await $locationAdvancedSelect.getAttribute("value"),
    "General Hospital",
    "Clicking a location advanced single select widget suggestion populates the input field."
  )

  const $positiveAtmosphereButton = await $("#positiveAtmos")
  await $positiveAtmosphereButton.click()

  const $attendeesAdvancedSelect1 = await pageHelpers.chooseAdvancedSelectOption(
    "#reportPeople",
    "topferness, christopf",
    2 // choose filter "All"
  )

  const $attendeesTitle = await t.context.driver.findElement(
    // if future "People who will be involved in this planned engagement"
    By.xpath('//h2/span[text()="People involved in this engagement"]')
  )
  await $attendeesTitle.click()

  t.is(
    await $attendeesAdvancedSelect1.getAttribute("value"),
    "",
    "Closing the attendees advanced multi select overlay empties the input field."
  )

  const [
    $principalPrimary1,
    /* eslint-disable no-unused-vars */ $principalAttendee1 /* eslint-enable no-unused-vars */,
    /* eslint-disable no-unused-vars */ $principalAuthor1 /* eslint-enable no-unused-vars */,
    /* eslint-disable no-unused-vars */ $principalConflictBtn /* eslint-enable no-unused-vars */,
    $principalName1,
    $principalPosition1,
    /* eslint-disable no-unused-vars */ $principalLocation1 /* eslint-enable no-unused-vars */,
    $principalOrg1
  ] = await $$(".principalAttendeesTable tbody tr:nth-child(2) td")

  const $principalPrimaryInput1 = await $principalPrimary1.findElement(
    By.css("input")
  )
  t.true(
    await $principalPrimaryInput1.isSelected(),
    "Principal primary attendee checkbox should be checked"
  )

  await assertElementText(t, $principalName1, "CIV TOPFERNESS, Christopf")
  await assertElementText(
    t,
    $principalPosition1,
    "Planning Captain, MOD-FO-00004"
  )
  await assertElementText(t, $principalOrg1, "MoD")

  const $attendeesAdvancedSelect2 = await pageHelpers.chooseAdvancedSelectOption(
    "#reportPeople",
    "steveson, steve",
    2 // choose filter "All"
  )
  await $attendeesTitle.click()

  t.is(
    await $attendeesAdvancedSelect2.getAttribute("value"),
    "",
    "Closing the attendees advanced multi select overlay empties the input field."
  )

  const [
    $principalPrimary2,
    /* eslint-disable no-unused-vars */ $principalAttendeeCheckbox2 /* eslint-enable no-unused-vars */,
    /* eslint-disable no-unused-vars */ $principalAuthorCheckbox2 /* eslint-enable no-unused-vars */,
    /* eslint-disable no-unused-vars */ $principalAuthorConflictBtn /* eslint-enable no-unused-vars */,
    $principalName2,
    /* eslint-disable no-unused-vars */
    $principalPosition2,
    $principalLocation2,
    $principalOrg2 /* eslint-enable no-unused-vars */
  ] = await $$(".principalAttendeesTable tbody tr:last-child td")

  await assertElementText(t, $principalName2, "LtCol STEVESON, Steve")
  const $principalPrimaryInput2 = await $principalPrimary2.findElement(
    By.css("input")
  )
  t.false(
    await $principalPrimaryInput2.isSelected(),
    "Second principal primary attendee checkbox should not be checked"
  )

  await $principalPrimaryInput2.click()
  t.true(
    await $principalPrimaryInput2.isSelected(),
    "Second principal primary attendee checkbox should now be checked"
  )
  t.false(
    await $principalPrimaryInput1.isSelected(),
    "First principal primary attendee checkbox should no longer be checked"
  )

  const $tasksAdvancedSelect = await pageHelpers.chooseAdvancedSelectOption(
    "#tasks",
    "2.A",
    2 // choose filter "All"
  )

  const $tasksTitle = await t.context.driver.findElement(
    By.xpath('//h2/span[text()="Efforts"]')
  )
  await $tasksTitle.click()

  t.is(
    await $tasksAdvancedSelect.getAttribute("value"),
    "",
    "Closing the tasks advanced multi select overlay empties the input field."
  )

  const $newTaskRow = await $("#tasks-tasks table tbody tr td")
  await assertElementText(t, $newTaskRow, "2.A")

  await pageHelpers.writeInForm("#keyOutcomes", "key outcomes")
  await pageHelpers.writeInForm("#nextSteps", "next steps")
  await pageHelpers.writeInForm(
    ".reportTextField .public-DraftEditor-content",
    "engagement details",
    shortWaitMs // wait for Draftail to save the editor contents
  )

  const editorCssPath =
    ".reportSensitiveInformationField .public-DraftEditor-content"
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
    shortWaitMs // wait for Draftail to save the editor contents
  )
  const $authGroupsInput = await $("#authorizationGroups")
  await $authGroupsInput.click()
  const $recentAuthGroups = await $$(
    "#authorizationGroups-popover table tbody tr input"
  )
  // Add all recent authorization groups
  await Promise.all($recentAuthGroups.map($elem => $elem.click()))

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
    until.stalenessOf($submitReportButton),
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
})

test.serial("Publish report chain", async t => {
  t.plan(6)

  const {
    pageHelpers,
    $,
    $$,
    assertElementText,
    By,
    Key,
    until,
    shortWaitMs,
    mediumWaitMs,
    longWaitMs
  } = t.context

  // First Jacob needs to approve the report, then Rebecca can approve the report
  await approveReport(t, "jacob")
  await approveReport(t, "rebecca")
  // Then the task owner can approve the report
  await approveReport(t, "henry")

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
  await t.context.driver.wait(until.stalenessOf($approvedReports), mediumWaitMs)

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
    until.stalenessOf($arthurPublishButton),
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

  const $$rollupDateRange = await $$(".rollupDateRange .bp3-input")
  await $$rollupDateRange[0].click()
  await t.context.driver.sleep(shortWaitMs) // wait for datepicker to show
  const $todayButton = await t.context.driver.findElement(
    By.xpath('//a/div[text()="Today"]')
  )
  await $todayButton.click()
  // Now dismiss the date popup
  await $$rollupDateRange[0].sendKeys(Key.TAB)
  await $$rollupDateRange[1].sendKeys(Key.TAB)
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
  await t.context.driver.wait(until.stalenessOf($reportsPending), mediumWaitMs)

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
  await t.context.driver.wait(until.stalenessOf($ApproveButton), mediumWaitMs)
}
test.serial(
  "Verify that validation and other reports/new interactions work",
  async t => {
    t.plan(29)

    const {
      assertElementText,
      $,
      $$,
      assertElementNotPresent,
      pageHelpers,
      shortWaitMs,
      By
    } = t.context

    await pageHelpers.goHomeAndThenToReportsPage()
    await assertElementText(
      t,
      await $(".legend .title-text"),
      "Create a new Report"
    )

    const $searchBarInput = await $("#searchBarInput")

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

    const $meetingGoalInput = await $("#intent")
    const $meetingGoalDiv = await t.context.driver.findElement(
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
    const $hourInput = await $("input.bp3-timepicker-input.bp3-timepicker-hour")
    // clear field, enter data, fire blur event
    await $hourInput.sendKeys(
      t.context.Key.END +
        t.context.Key.BACK_SPACE.repeat(2) +
        "23" +
        t.context.Key.TAB
    )
    const $minuteInput = await $(
      "input.bp3-timepicker-input.bp3-timepicker-minute"
    )
    // clear field, enter data, fire blur event
    await $minuteInput.sendKeys(
      t.context.Key.END +
        t.context.Key.BACK_SPACE.repeat(2) +
        "45" +
        t.context.Key.TAB
    )

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

    await $locationInput.click()
    const $recentLocation = await $(
      "#location-popover table tbody tr:first-child"
    )
    await $recentLocation.click()
    t.is(
      await $locationInput.getAttribute("value"),
      "General Hospital",
      "Should be able to add a recent location"
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

    const $positiveAtmosphereButton = await $("#positiveAtmos")
    await $positiveAtmosphereButton.click()

    const $atmosphereDetails = await $("#atmosphereDetails")
    t.is(
      await $atmosphereDetails.getAttribute("placeholder"),
      "Why was this engagement positive? (optional)"
    )

    const $neutralAtmosphereButton = await $("#neutralAtmos")
    await $neutralAtmosphereButton.click()
    t.is(
      (await $atmosphereDetails.getAttribute("placeholder")).trim(),
      "Why was this engagement neutral?"
    )

    const $negativeAtmosphereButton = await $("#negativeAtmos")
    await $negativeAtmosphereButton.click()
    t.is(
      (await $atmosphereDetails.getAttribute("placeholder")).trim(),
      "Why was this engagement negative?"
    )

    const $atmosphereDetailsGroup = await t.context.driver.findElement(
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

    const $reportPeopleFieldsetTitle = await $(
      "#reportPeople-fieldset .title-text"
    )
    await assertElementText(
      t,
      $reportPeopleFieldsetTitle,
      "People involved in this engagement",
      "People fieldset should have correct title for an uncancelled enagement"
    )

    const $cancelledCheckbox = await $(".cancelled-checkbox")
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

    let $principalAttendeesRows = await $$(".principalAttendeesTable tbody tr")
    t.is(
      $principalAttendeesRows.length,
      1,
      "Principal attendees table starts with 1 body rows"
    )

    const [
      $advisorPrimaryCheckbox,
      /* eslint-disable no-unused-vars */ $advisorAttendeeCheckbox /* eslint-enable no-unused-vars */,
      /* eslint-disable no-unused-vars */ $advisorAuthorCheckbox /* eslint-enable no-unused-vars */,
      /* eslint-disable no-unused-vars */ $advisorConflictBtn /* eslint-enable no-unused-vars */,
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

    const $attendeesInput = await $("#reportPeople")
    await $attendeesInput.click()
    const $recentAttendees = await $$(
      "#reportPeople-popover table tbody tr input"
    )
    // Add all recent attendees
    await Promise.all($recentAttendees.map($elem => $elem.click()))

    $advisorAttendeesRows = await $$(".advisorAttendeesTable tbody tr")
    $principalAttendeesRows = await $$(".principalAttendeesTable tbody tr")
    t.is(
      $advisorAttendeesRows.length + $principalAttendeesRows.length,
      5,
      "Should be able to add recent attendees to the table"
    )

    const $submitButton = await $("#formBottomSubmit")
    await $submitButton.click()
    await pageHelpers.assertReportShowStatusText(
      t,
      "This is a DRAFT report and hasn't been submitted."
    )
  }
)
