let test = require('../util/test')

test('Move someone in and out of a position', async t => {
    t.plan(9)

    let {$, $$, assertElementText, By, until} = t.context

    await t.context.get('/', 'rebecca')

    await t.context.pageHelpers.clickMyOrgLink()

    let positionName = 'EF 2.2 Advisor D'
    let person = 'ERINSON, Erin'
    let rank = 'CIV'
    let personName = rank + ' ' + person

    await t.context.pageHelpers.clickPersonNameFromSupportedPositionsFieldset(personName, positionName)

    let $changeAssignedPositionButton = await $('.change-assigned-position')
    await $changeAssignedPositionButton.click()

    let $removePersonButton = await $('.remove-person-from-position')
    await $removePersonButton.click()

    await assertElementText(t, await $('p.not-assigned-to-position-message'), 'ERINSON, Erin is not assigned to a position.')
    
    await t.context.pageHelpers.clickMyOrgLink()

    let $vacantPositionRows = await $$('#vacantPositions table tbody tr')
    let $positionToFillCell
    for (let $row of $vacantPositionRows) {
        let [$billetCell, $advisorCell] = await $row.findElements(By.css('td'))
        let billetText = await $billetCell.getText()
        let advisorText = await $advisorCell.getText()

        if (billetText === positionName && advisorText === 'Unfilled') {
            $positionToFillCell = $billetCell
            break
        }
    }

    if (!$positionToFillCell) {
        t.fail(`Could not find ${positionName} in the vacant positions table.`)
    }

    await t.context.driver.wait(until.elementIsVisible($positionToFillCell))
    let $positionToFillLink = await $positionToFillCell.findElement(By.css('a'))
    await $positionToFillLink.click()
    let currentPathname = await t.context.getCurrentPathname()
    t.regex(currentPathname, /positions\/[0-9a-f-]+/, 'URL is updated to positions/show page')

    await assertElementText(t, await $('.legend .title-text'), positionName)
    await assertElementText(t, await $('.position-empty-message'), `${positionName} is currently empty.`)

    let $changeAssignedPersonButton = await $('button.change-assigned-person')
    await $changeAssignedPersonButton.click()

    let $assignedPerson = await t.context.pageHelpers.chooseAutocompleteOption('.select-person-autocomplete', personName)
    t.is(
        await $assignedPerson.getAttribute('value'),
        person,
        'Clicking a person autocomplete suggestion populates the autocomplete field.'
    )
    let $saveButton = await $('button.save-button')
    await $saveButton.click()

    await assertElementText(t, await $('h4.assigned-person-name'), personName)

    let $personLink = await $('h4.assigned-person-name a')
    await $personLink.click()
    currentPathname = await t.context.getCurrentPathname()
    t.regex(currentPathname, /people\/[0-9a-f-]+/, 'URL is updated to people/show page')

    await assertElementText(t, await $('.position-name'), positionName)

    await t.context.pageHelpers.clickMyOrgLink()

    let $supportedPositionsRows = await $$('#supportedPositions table tbody tr')
    let foundCorrectRow = false
    for (let $row of $supportedPositionsRows) {
        let [$billetCell, $advisorCell] = await $row.findElements(By.css('td'))
        let billetText = await $billetCell.getText()
        let advisorText = await $advisorCell.getText()

        if (billetText === positionName && advisorText === personName) {
            foundCorrectRow = true
            break
        }
    }
    t.true(foundCorrectRow, `Could not find ${positionName} and ${personName} in the supported positions table`)
})
