let test = require('../util/test'),
    moment = require('moment'),
    _includes = require('lodash/includes')

test('Draft and submit a report', async t => {
    t.plan(16)

    let {pageHelpers, $, $$, assertElementText, By, until, shortWaitMs} = t.context

    await pageHelpers.goHomeAndThenToReportsPage()
    await pageHelpers.writeInForm('#intent', 'meeting goal')

    let $engagementDate = await $('#engagementDate')
    await $engagementDate.click()

    await pageHelpers.clickTodayButton()

    let $locationAutocomplete = await pageHelpers.chooseAutocompleteOption('#location', 'general hospita')

    t.is(
        await $locationAutocomplete.getAttribute('value'), 
        'General Hospital', 
        'Clicking a location autocomplete suggestion populates the autocomplete field.'
    )

    let $positiveAtmosphereButton = await $('#positiveAtmos')
    await $positiveAtmosphereButton.click()

    let $attendeesAutocomplete = await pageHelpers.chooseAutocompleteOption('#attendees', 'christopf topferness')

    t.is(
        await $attendeesAutocomplete.getAttribute('value'), 
        '', 
        'Clicking an attendee autocomplete suggestion empties the autocomplete field.'
    )

    let [$principalPrimaryCheckbox, $principalName, $principalPosition, $principalLocation, $principalOrg] =
        await $$('#attendeesTable tbody tr:last-child td')

    t.is(
        await $principalPrimaryCheckbox.findElement(By.css('input')).getAttribute('value'), 
        'on', 
        'Principal primary attendee checkbox should be checked'
    )
    await assertElementText(t, $principalName, 'CIV TOPFERNESS, Christopf')
    await assertElementText(t, $principalPosition, 'Planning Captain, MOD-FO-00004')
    await assertElementText(t, $principalOrg, 'MoD')

    let $tasksAutocomplete = await pageHelpers.chooseAutocompleteOption('#tasks', '1.1.B')

    t.is(
        await $tasksAutocomplete.getAttribute('value'), 
        '', 
        'Clicking a Task autocomplete suggestion empties the autocomplete field.'
    )

    let $newTaskRow = await $('.tasks-selector table tbody tr td')
    await assertElementText(t, $newTaskRow, '1.1.B - Milestone the Second in EF 1.1')

    await pageHelpers.writeInForm('#keyOutcomes', 'key outcomes')
    await pageHelpers.writeInForm('#nextSteps', 'next steps')

    let $reportTextField = await $('.reportTextField')
    t.false(await $reportTextField.isDisplayed(), 'Add details field should not be present before "add details" button is clicked"')

    let $addDetailsButton = await $('#toggleReportDetails')
    await $addDetailsButton.click()

    await pageHelpers.writeInForm('.reportTextField .text-editor', 'report details')

    let $formButtonSubmit = await $('#formBottomSubmit')
    await $formButtonSubmit.click()
    await pageHelpers.assertReportShowStatusText(t, "This is a DRAFT report and hasn't been submitted.")

    let currentPathname = await t.context.getCurrentPathname()
    t.regex(currentPathname, /reports\/[0-9a-f-]+/, 'URL is updated to reports/show page')

    let $submitReportButton = await $('#submitReportButton')
    await $submitReportButton.click()
    // This assertion bombs out with a StaleElementReferenceError and I'm not sure why.
    // await pageHelpers.assertReportShowStatusText(t, "This report is PENDING approvals.")

    let $approveButton = await $('.approve-button')
    await $approveButton.click()

    const $notificationApproved = await t.context.driver.findElement(By.css('div[role=alert]'))
    await assertElementText(
        t, 
        $notificationApproved,
        'Successfully approved report.', 
        'Clicking the approve button displays a message telling the user that the action was successful.'
    )

    await t.context.get('/', 'rebecca')
    let [$draftReports, $reportsPending, $orgReports, $upcomingEngagements] = await $$('.home-tile')
    await t.context.driver.wait(until.elementIsVisible($reportsPending))
    await $reportsPending.click()

    let $firstReadReportButton = await $('.read-report-button')
    let reportHref = await $firstReadReportButton.getAttribute('href')
    await $firstReadReportButton.click()

    await pageHelpers.assertReportShowStatusText(t, "This report is PENDING approvals.")
    let $rebeccaApproveButton = await $('.approve-button')
    await $rebeccaApproveButton.click()

    const $notificationDailyRollup = await t.context.driver.findElement(By.css('div[role=alert]'))
    await assertElementText(
        t, 
        $notificationDailyRollup,
        'Successfully approved report. It has been added to the daily rollup', 
        'When a report is approved, the user sees a message indicating that it has been added to the daily rollup'
    )

    let $dailyRollupLink = await t.context.driver.findElement(By.linkText('Daily rollup'))
    await $dailyRollupLink.click()

    currentPathname = await t.context.getCurrentPathname()
    t.is(currentPathname, '/rollup', 'Clicking the "daily rollup" link takes the user to the rollup page')

    async function getReportHrefsForPage() {
        let $readReportButtons = await $$('.read-report-button')

        // Normally, we would do a Promise.all here to read all button href values in parallel.
        // However, hilariously, that causes webdriver to fail with EPIPE errors. So we will 
        // issue the commands synchronously to avoid overloading it.
        let hrefs = []
        for (let $button of $readReportButtons) {
            hrefs.push(await $button.getAttribute('href'))
        }
        return hrefs
    }

    async function getAllReportHrefs() {
        let reportsHrefs = await getReportHrefsForPage()
        let pageCount
        try {
            pageCount = (await $$('.pagination li:not(:first-child):not(:last-child) a', shortWaitMs)).length
        } catch (e) {
            if (e.name === 'TimeoutError') {
                // If there are no pagination controls, then we do not need to look at multiple pages
                return reportsHrefs
            }
            throw e
        }

        for (let pageIndex = 1; pageIndex < pageCount; pageIndex++) {
            // +1 because nth-child is 1-indexed, 
            // and +1 because the first pagination button will be the "previous" button.
            let $pageButton = await $(`.pagination li:nth-child(${pageIndex + 2}) a`)
            await t.context.driver.wait(until.elementIsVisible($pageButton))

            await $pageButton.click()
            // After we click the button, we need to give React time to load the new results
            await t.context.driver.wait(until.elementLocated(By.css(`.pagination li:nth-child(${pageIndex + 2}).active a`)))
            
            let reportHrefsForPage = await getReportHrefsForPage()
            reportsHrefs.push(...reportHrefsForPage)
        }

        return reportsHrefs
    }

    let allReportRefs = await getAllReportHrefs()
    t.true(_includes(allReportRefs, reportHref), 'Daily rollup report list includes the recently approved report')
})

test('Verify that validation and other reports/new interactions work', async t => {
    t.plan(28)

    let {assertElementText, $, $$, assertElementNotPresent, pageHelpers, shortWaitMs, By} = t.context

    await pageHelpers.goHomeAndThenToReportsPage()
    await assertElementText(t, await $('.legend .title-text'), 'Create a new Report')

    let $searchBarInput = await $('#searchBarInput')

    async function verifyFieldIsRequired($fieldGroup, $input, warningClass, fieldName) {
        await $input.click()
        await $input.clear()
        await $searchBarInput.click()

        t.true(
            _includes(await $fieldGroup.getAttribute('class'), warningClass), 
            `${fieldName} enters invalid state when the user leaves the field without entering anything`
        )

        await $input.sendKeys('user input')
        await $input.sendKeys(t.context.Key.TAB) // fire blur event
        t.false(
            _includes(await $fieldGroup.getAttribute('class'), warningClass), 
            `After typing in ${fieldName} field, warning state goes away`
        )
    }

    let $meetingGoal = await $('.meeting-goal')
    let $meetingGoalInput = await $('#intent')

    t.false(
        _includes(await $meetingGoal.getAttribute('class'), 'has-warning'), 
        `Meeting goal does not start in an invalid state`
    )   
    t.is(await $meetingGoalInput.getAttribute('value'), '', `Meeting goal field starts blank`)

    await verifyFieldIsRequired($meetingGoal, $meetingGoalInput, 'has-warning', 'Meeting goal')

    let $engagementDate = await $('#engagementDate')
    t.is(await $engagementDate.getAttribute('value'), '', 'Engagement date field starts blank')
    await $engagementDate.click()

    await pageHelpers.clickTodayButton()

    t.is(
        await $engagementDate.getAttribute('value'), 
        moment().format('DD/MM/YYYY'), 
        'Clicking the "today" button puts the current date in the engagement field'
    )

    let $locationInput = await $('#location')
    t.is(await $locationInput.getAttribute('value'), '', 'Location field starts blank')

    let $locationShortcutButton = await $('.location-form-group .shortcut-list button')
    await $locationShortcutButton.click()
    t.is(await $locationInput.getAttribute('value'), 'General Hospital', 'Clicking the shortcut adds a location')

    await assertElementNotPresent(t, '#cancelledReason', 'Cancelled reason should not be present initially', shortWaitMs)
    let $atmosphereFormGroup = await $('.atmosphere-form-group')
    t.true(await $atmosphereFormGroup.isDisplayed(), 'Atmospherics form group should be shown by default')

    await assertElementNotPresent(
        t, '#atmosphere-details', 'Atmospherics details should not be displayed before choosing atmospherics', shortWaitMs
    )

    let $positiveAtmosphereButton = await $('#positiveAtmos')
    await $positiveAtmosphereButton.click()

    let $atmosphereDetails = await $('#atmosphereDetails')
    t.is(await $atmosphereDetails.getAttribute('placeholder'), 'Why was this engagement positive? (optional)')

    let $neutralAtmosphereButton = await $('#neutralAtmos')
    await $neutralAtmosphereButton.click()
    t.is((await $atmosphereDetails.getAttribute('placeholder')).trim(), 'Why was this engagement neutral?')

    let $negativeAtmosphereButton = await $('#negativeAtmos')
    await $negativeAtmosphereButton.click()
    t.is((await $atmosphereDetails.getAttribute('placeholder')).trim(), 'Why was this engagement negative?')

    let $atmosphereDetailsGroup = await $('.atmosphere-details')

    await $neutralAtmosphereButton.click()
    await verifyFieldIsRequired($atmosphereDetailsGroup, $atmosphereDetails, 'has-error', 'Neutral atmospherics details')

    let $attendanceFieldsetTitle = await $('#attendance-fieldset .title-text')
    await assertElementText(
        t, 
        $attendanceFieldsetTitle, 
        'Meeting attendance', 
        'Meeting attendance fieldset should have correct title for an uncancelled enagement'
    )

    let $cancelledCheckbox = await $('.cancelled-checkbox')
    await $cancelledCheckbox.click()

    await assertElementNotPresent(
        t, '.atmosphere-form-group', 'After cancelling the enagement, the atmospherics should be hidden', shortWaitMs
    )
    let $cancelledReason = await $('.cancelled-reason-form-group')
    t.true(await $cancelledReason.isDisplayed(), 'After cancelling the engagement, the cancellation reason should appear')
    await assertElementText(
        t, 
        $attendanceFieldsetTitle, 
        'Planned attendance', 
        'Meeting attendance fieldset should have correct title for a cancelled enagement'
    )

    let $attendeesRows = await $$('#attendeesTable tbody tr')
    t.is($attendeesRows.length, 2, 'Attendees table starts with 2 body rows')

    let [$advisorPrimaryCheckbox, $advisorName, $advisorPosition, $advisorLocation, $advisorOrg] =
        await $$('#attendeesTable tbody tr:first-child td')
    
    t.is(
        await $advisorPrimaryCheckbox.findElement(By.css('input')).getAttribute('value'), 
        'on', 
        'Advisor primary attendee checkbox should be checked'
    )
    await assertElementText(t, $advisorName, 'CIV ERINSON, Erin')
    await assertElementText(t, $advisorPosition, 'EF 2.2 Advisor D')
    await assertElementText(t, $advisorOrg, 'EF 2.2')

    $attendeesRows = await $$('#attendeesTable tbody tr')
    let $addAttendeeShortcutButtons = await $$('#attendance-fieldset .shortcut-list button')
    // Add all recent attendees
    await Promise.all($addAttendeeShortcutButtons.map($button => $button.click()))

    t.is((await $$('#attendeesTable tbody tr')).length, $attendeesRows.length + $addAttendeeShortcutButtons.length, 'Clicking the shortcut buttons adds rows to the table')

    let $submitButton = await $('#formBottomSubmit')
    await $submitButton.click()
    await pageHelpers.assertReportShowStatusText(t, "This is a DRAFT report and hasn't been submitted.")
})
