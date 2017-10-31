let test = require('../util/test'),
    moment = require('moment'),
    guid = require('guid')

test('checking super user permissions', async t => {
    t.plan(6)

    await t.context.get('/', 'rebecca')
    await t.context.pageHelpers.clickMyOrgLink()

    let $rebeccaLink = await findSuperUserLink(t, 'CTR BECCABON, Rebecca')
    await $rebeccaLink.click()

    await validateUserCanEditUserForCurrentPage(t)
    await editAndSavePositionFromCurrentUserPage(t)

    await t.context.pageHelpers.clickMyOrgLink()
    let $jacobLink = await findSuperUserLink(t, 'CIV JACOBSON, Jacob')

    await $jacobLink.click()
    await validateUserCanEditUserForCurrentPage(t)

    await editAndSavePositionFromCurrentUserPage(t)
})

validateUserCannotEditOtherUser(
    'super user cannot edit administrator', 'rebecca',
    'arthur', 'CIV DMIN, Arthur', 'ANET Administrator'
)

test('checking regular user permissions', async t => {
    t.plan(3)

    let {pageHelpers, $, assertElementNotPresent, shortWaitMs} = t.context

    await t.context.get('/', 'jack')
    await t.context.pageHelpers.clickMyOrgLink()
    await pageHelpers.clickPersonNameFromSupportedPositionsFieldset('OF-9 JACKSON, Jack')

    await validateUserCanEditUserForCurrentPage(t)

    let $positionName = await $('.position-name')
    await $positionName.click()
    await assertElementNotPresent(t, '.edit-position', 'Jack should not be able to edit his own position', shortWaitMs)
})

validateUserCannotEditOtherUser(
    'Regular user cannot edit super user people or positions', 'jack', 'rebecca',
    'CTR BECCABON, Rebecca', 'EF 2.2 Final Reviewer'
)

validateUserCannotEditOtherUser(
    'Regular user cannot edit admin people or positions', 'jack', 'arthur', 'CIV DMIN, Arthur', 'ANET Administrator'
)

test('checking admin permissions', async t => {
    t.plan(3)

    await t.context.get('/', 'arthur')
    await t.context.pageHelpers.clickMyOrgLink()
    let $arthurLink = await findSuperUserLink(t, 'CIV DMIN, Arthur')
    await $arthurLink.click()

    await validateUserCanEditUserForCurrentPage(t)
    await editAndSavePositionFromCurrentUserPage(t)
})

test('admins can edit superusers and their positions', async t => {
    t.plan(3)

    await t.context.get('/', 'arthur')

    let [$rebeccaPersonLink] =
        await getUserPersonAndPositionFromSearchResults(t, 'rebecca', 'CTR BECCABON, Rebecca', 'EF 2.2 Final Reviewer')
    await $rebeccaPersonLink.click()
    await validateUserCanEditUserForCurrentPage(t)

    let $rebeccaPositionLink =
        (await getUserPersonAndPositionFromSearchResults(t, 'rebecca', 'CTR BECCABON, Rebecca', 'EF 2.2 Final Reviewer'))[1]
    await $rebeccaPositionLink.click()
    await validatePositionCanBeEditedOnCurrentPage(t)
})

function validateUserCannotEditOtherUser(testTitle, user, searchQuery, otherUserName, otherUserPosition) {
    test(testTitle, async t => {
        t.plan(2)

        let {assertElementNotPresent, shortWaitMs} = t.context

        await t.context.get('/', user)

        let [$arthurPersonLink] =
            await getUserPersonAndPositionFromSearchResults(t, searchQuery, otherUserName, otherUserPosition)
        await $arthurPersonLink.click()
        await assertElementNotPresent(t, '.edit-person', `${user} should not be able to edit ${otherUserName}`, shortWaitMs)

        let $arthurPositionLink =
            (await getUserPersonAndPositionFromSearchResults(t, searchQuery, otherUserName, otherUserPosition))[1]
        await $arthurPositionLink.click()
        await assertElementNotPresent(t, '.edit-position', `${user} should not be able edit the "${otherUserPosition}" position`, shortWaitMs)
    })
}

async function findSuperUserLink(t, desiredSuperUserName) {
    let $superUserLinks = await t.context.$$('#superUsers p a')
    let $foundLink
    for (let $superUserLink of $superUserLinks) {
        let superUserName = await $superUserLink.getText()
        if (superUserName === desiredSuperUserName) {
            $foundLink = $superUserLink
            break
        }
    }

    if (!$foundLink) {
        t.fail(`Could not find superuser '${desiredSuperUserName}'. The data does not match what this test expects.`)
    }

    return $foundLink
}

async function validateUserCanEditUserForCurrentPage(t) {
    let {$, assertElementText} = t.context

    let $editPersonButton = await $('.edit-person')
    await t.context.driver.wait(t.context.until.elementIsVisible($editPersonButton))
    await $editPersonButton.click()

    let $bioTextArea = await $('.biography .text-editor')
    await t.context.driver.wait(
        async () => {
            let originalBioText = await $bioTextArea.getText()
            return originalBioText !== ''
        },
        moment.duration(5, 'seconds').asMilliseconds(),
        'This test assumes that the current user has a non-empty biography.'
    )
    let originalBioText = await $bioTextArea.getText()

    let fakeBioText = `fake bio ${guid.raw()} `
    await $bioTextArea.sendKeys(fakeBioText)

    await t.context.pageHelpers.clickFormBottomSubmit()

    await assertElementText(t, await $('.alert'), 'Person saved successfully')
    await assertElementText(t, await $('#biography p'), fakeBioText + originalBioText)
}

async function editAndSavePositionFromCurrentUserPage(t) {
    let {$} = t.context

    let $positionName = await $('.position-name')
    await $positionName.click()
    await validatePositionCanBeEditedOnCurrentPage(t)
}

async function validatePositionCanBeEditedOnCurrentPage(t) {
    let {$, assertElementText, until} = t.context
    let $editButton = await $('.edit-position')
    await t.context.driver.wait(until.elementIsVisible($editButton))
    await $editButton.click()
    await t.context.pageHelpers.clickFormBottomSubmit()

    await assertElementText(t, await $('.alert'), 'Saved Position')
}

async function getUserPersonAndPositionFromSearchResults(t, searchQuery, personName, positionName) {
    let {$, $$} = t.context

    let $searchBar = await $('#searchBarInput')
    await $searchBar.sendKeys(searchQuery)

    let $searchBarSubmit = await $('#searchBarSubmit')
    await $searchBarSubmit.click()

    let $searchResultLinks = await $$('.people-search-results td a')

    async function findLinkWithText(text) {
        for (let $link of $searchResultLinks) {
            let linkText = await $link.getText()
            if (linkText === text) {
                return $link
            }
        }
        t.fail(`Could not find link with text '${text}' when searching '${searchQuery}'. The data does not match what this test expects.`)
    }

    let $arthurPersonLink = await findLinkWithText(personName)
    let $arthurPositionLink = await findLinkWithText(positionName)

    return [$arthurPersonLink, $arthurPositionLink]
}
