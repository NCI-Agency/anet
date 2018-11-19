let test = require('../util/test'),
    moment = require('moment'),
    uuidv4 = require('uuid/v4')

test('checking super user permissions', async t => {
    t.plan(12)

    await t.context.get('/', 'rebecca')
    await t.context.pageHelpers.clickMyOrgLink()

    let $rebeccaLink = await findSuperUserLink(t, 'CTR BECCABON, Rebecca')

    await $rebeccaLink.click()

    await validateUserCanEditUserForCurrentPage(t)

    // User is super user, only admins may edit position of type super user
    await editAndSavePositionFromCurrentUserPage(t, false)
    // We are now still on the edit position page

    await t.context.get('/', 'rebecca')
    await t.context.pageHelpers.clickMyOrgLink()
    let $jacobLink = await findSuperUserLink(t, 'CIV JACOBSON, Jacob')
    await $jacobLink.click()

    await validateUserCanEditUserForCurrentPage(t)

    // User is super user, only admins may edit position of type super user
    await editAndSavePositionFromCurrentUserPage(t, false)

    let $principalOrgLink =
      await getPrincipalOrgFromSearchResults(t, 'MoD')
    await $principalOrgLink.click()
    await validateSuperUserPrincipalOrgPermissions(t)
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
    t.plan(9)

    await t.context.get('/', 'arthur')
    await t.context.pageHelpers.clickMyOrgLink()
    let $arthurLink = await findSuperUserLink(t, 'CIV DMIN, Arthur')
    await $arthurLink.click()

    await validateUserCanEditUserForCurrentPage(t)
    // User is admin, and can therefore edit an admin position type
    await editAndSavePositionFromCurrentUserPage(t, true)

    let $principalOrgLink =
      await getPrincipalOrgFromSearchResults(t, 'MoD')
    await $principalOrgLink.click()
    await validateAdminPrincipalOrgPermissions(t)

})

test('admins can edit superusers and their positions', async t => {
    t.plan(3)

    await t.context.get('/', 'arthur')

    let [$rebeccaPersonLink] =
        await getUserPersonAndPositionFromSearchResults(t, 'rebecca', 'CTR BECCABON, Rebecca', 'EF 2.2 Final Reviewer')
    await $rebeccaPersonLink.click()
    await validateUserCanEditUserForCurrentPage(t)

    // User is admin, and can therefore edit a super user position type
    await editAndSavePositionFromCurrentUserPage(t, true)
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

    let $bioTextArea = await $('.biography .public-DraftEditor-content')
    await t.context.driver.wait(
        async () => {
            let originalBioText = await $bioTextArea.getText()
            return originalBioText !== ''
        },
        moment.duration(5, 'seconds').asMilliseconds(),
        'This test assumes that the current user has a non-empty biography.'
    )
    let originalBioText = await $bioTextArea.getText()

    let fakeBioText = `fake bio ${uuidv4()} `
    await $bioTextArea.sendKeys(fakeBioText)

    await t.context.pageHelpers.clickFormBottomSubmit()

    await assertElementText(t, await $('.alert'), 'Person saved')
    await assertElementText(t, await $('#biography p'), fakeBioText + originalBioText)
}

async function editAndSavePositionFromCurrentUserPage(t, validateTrue) {
    let {$} = t.context

    let $positionName = await $('.position-name')
    await $positionName.click()
    await validationEditPositionOnCurrentPage(t, validateTrue)
}

async function validationEditPositionOnCurrentPage(t, validateTrue) {
    let {$, assertElementText, until} = t.context
    let $editButton = await $('.edit-position')
    await t.context.driver.wait(until.elementIsVisible($editButton))
    await $editButton.click()
    await t.context.pageHelpers.clickFormBottomSubmit()
    if (validateTrue) {
      await assertElementText(t, await $('.alert'), 'Position saved')
    }
    else {
      await assertElementText(t, await $('.alert'), 'Forbidden: Exception while fetching data (/updatePosition) : You do not have permissions to do this')
    }
}

async function getUserPersonAndPositionFromSearchResults(t, searchQuery, personName, positionName) {
    let {$, $$} = t.context

    let $searchBar = await $('#searchBarInput')
    await $searchBar.clear()
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

async function getPrincipalOrgFromSearchResults(t, principalOrgName) {
  let {$, $$} = t.context

  let $searchBar = await $('#searchBarInput')
  await $searchBar.clear()
  await $searchBar.sendKeys(principalOrgName)

  let $searchBarSubmit = await $('#searchBarSubmit')
  await $searchBarSubmit.click()

  let $searchResultLinks = await $$('#organizations-search-results td a')

  async function findLinkWithText(text) {
      for (let $link of $searchResultLinks) {
          let linkText = await $link.getText()
          if (linkText === text) {
              return $link
          }
      }
      t.fail(`Could not find link with text '${text}' when searching '${principalOrgName}'. The data does not match what this test expects.`)
  }

  let $rebeccaPrincipalOrgLink = await findLinkWithText(principalOrgName)

  return $rebeccaPrincipalOrgLink
}

async function validateSuperUserPrincipalOrgPermissions(t) {
  let {$, assertElementDisabled, assertElementEnabled} = t.context

  let $editPrincipalOrgButton = await $('#editButton')
  await t.context.driver.wait(t.context.until.elementIsVisible($editPrincipalOrgButton))
  await $editPrincipalOrgButton.click()
  await assertElementDisabled(t, '#advisorOrgButton',
    'Field advisorOrgButton of a principal organization should be disabled for super users')
  await assertElementDisabled(t, '#principalOrgButton',
  'Field principalOrgButton of a principal organization should be disabled for super users')
  await assertElementDisabled(t, '#parentOrg',
    'Field parentOrganization of a principal organization should be disabled for super users')
  await assertElementDisabled(t, '#shortName',
      'Field shortName of a principal organization should be disabled for super users')
  await assertElementDisabled(t, '#longName',
      'Field longName of a principal organization should be disabled for super users')
  await assertElementDisabled(t, '#identificationCode',
      'Field identificationCode of a principal organization should be disabled for super users')
}

async function validateAdminPrincipalOrgPermissions(t) {
  let {$, assertElementEnabled} = t.context

  let $editPrincipalOrgButton = await $('#editButton')
  await t.context.driver.wait(t.context.until.elementIsVisible($editPrincipalOrgButton))
  await $editPrincipalOrgButton.click()
  await assertElementEnabled(t, '#advisorOrgButton',
    'Field advisorOrgButton of a principal organization should be enabled for admins')
  await assertElementEnabled(t, '#principalOrgButton',
  'Field principalOrgButton of a principal organization should be enabled for admins')
  await assertElementEnabled(t, '#parentOrg',
    'Field parentOrganization of a principal organization should be enabled for admins')
  await assertElementEnabled(t, '#shortName',
      'Field shortName of a principal organization should be enabled for admins')
  await assertElementEnabled(t, '#longName',
      'Field longName of a principal organization should be enabled for admins')
  await assertElementEnabled(t, '#identificationCode',
      'Field identificationCode of a principal organization should be enabled for admins')
}
