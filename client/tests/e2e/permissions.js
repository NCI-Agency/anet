const uuidv4 = require("uuid").v4
const test = require("../util/test")

test.serial("checking superuser permissions", async t => {
  t.plan(25)

  const { pageHelpers, $, By, driver, assertElementNotPresent, shortWaitMs } =
    t.context

  await t.context.get("/", "rebecca")

  const $createButton = await $("#createButton")
  await $createButton.click()
  const $createPersonButton = await $("#new-person")
  await $createPersonButton.click()
  await assertElementNotPresent(
    t,
    "#fg-user",
    "Rebecca should not be able to create new users",
    shortWaitMs
  )

  // Cancel Create Person
  const $cancelButton = await driver.findElement(
    By.xpath('//button[text()="Cancel"]')
  )
  await $cancelButton.click()
  const $alertOkButton = await driver.findElement(
    By.xpath(
      '//div[contains(@class, "triggerable-confirm-bootstrap-modal")]//button[text()="OK"]'
    )
  )
  await $alertOkButton.click()

  await pageHelpers.clickMenuLinksButton()
  await pageHelpers.clickMyOrgLink()

  const $rebeccaLink = await findSuperuserLink(
    t,
    "CTR BECCABON, Rebecca",
    "EF 2.2"
  )

  await $rebeccaLink.click()
  await t.context.driver.wait(t.context.untilStalenessOf($rebeccaLink))

  await validateUserCanEditUserForCurrentPage(t, true)

  // User is superuser, they may edit position of type superuser for
  // the organization their position is administrating
  await editAndSavePositionFromCurrentUserPage(t, true)

  await t.context.logout()

  await t.context.get("/", "rebecca")
  await pageHelpers.clickMenuLinksButton()
  await pageHelpers.clickMyOrgLink()
  const $jacobLink = await findSuperuserLink(t, "CIV JACOBSON, Jacob", "EF 2.2")
  await $jacobLink.click()
  await t.context.driver.wait(t.context.untilStalenessOf($jacobLink))

  await validateUserCanEditUserForCurrentPage(t, true)

  // User is superuser, they may edit position of type superuser for
  // the organization their position is administrating
  await editAndSavePositionFromCurrentUserPage(t, true)

  // User is superuser, they may edit positions only for
  // organizations their position is assigned to
  const $otherAdvisorOrgPositionLink = await getFromSearchResults(
    t,
    "EF 1 Manager",
    "EF 1 Manager",
    "positions"
  )
  await $otherAdvisorOrgPositionLink.click()
  await t.context.driver.wait(
    t.context.untilStalenessOf($otherAdvisorOrgPositionLink)
  )
  await assertElementNotPresent(
    t,
    ".edit-position",
    "superuser should not be able to edit positions of the advisor organization their position is not administrating",
    shortWaitMs
  )

  const $nonAdministratingOrgLink = await getFromSearchResults(
    t,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await $nonAdministratingOrgLink.click()
  await validateSuperuserNonAdministratingOrgPermissions(t)

  const $locationLink = await getFromSearchResults(
    t,
    "General Hospital",
    "General Hospital 47.571772,-52.741935",
    "locations"
  )
  await $locationLink.click()
  await validateSuperuserLocationPermissions(t)

  await t.context.logout()

  await t.context.get("/", "jacob")
  const $ownOrgPositionLink = await getFromSearchResults(
    t,
    "EF 2.2 Final Reviewer",
    "EF 2.2 Final Reviewer",
    "positions"
  )
  await $ownOrgPositionLink.click()
  await t.context.driver.wait(t.context.untilStalenessOf($ownOrgPositionLink))

  const $editPositionButton = await $(".edit-position")
  await t.context.driver.wait(
    t.context.until.elementIsVisible($editPositionButton)
  )
  t.pass('Jacob should be able to edit his own organization ("EF 2.2")')

  await t.context.logout()

  await t.context.get("/", "andrew")
  const $ef11Link = await getFromSearchResults(
    t,
    "EF 1.1",
    "EF 1.1",
    "organizations"
  )
  await $ef11Link.click()
  // Check that Andrew is (also) superuser of EF 1.1
  await findSuperuserLink(
    t,
    "CIV ANDERSON, Andrew",
    "EF 1 | Planning Programming, Budgeting and Execution"
  )
  await pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    "Capt ELIZAWELL, Elizabeth"
  )
  await t.context.driver.sleep(shortWaitMs) // wait for transition
  await validateUserCanEditUserForCurrentPage(t, true)
  await t.context.logout()

  await t.context.get("/", "bob")
  const $modLink = await getFromSearchResults(
    t,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await $modLink.click()
  // Check that Bob is (also) superuser of MoD
  await findSuperuserLink(t, "CIV BOBTOWN, Bob", "MoD | Ministry of Defense")
  await pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    "CIV KYLESON, Kyle"
  )
  await t.context.driver.sleep(shortWaitMs) // wait for transition
  await validateUserCanEditUserForCurrentPage(t, true)

  const $otherPrincipalOrgPositionLink = await getFromSearchResults(
    t,
    "Chief of Police",
    "Chief of Police - MOI-Pol-HQ-00001",
    "positions"
  )
  await $otherPrincipalOrgPositionLink.click()
  await t.context.driver.wait(
    t.context.untilStalenessOf($otherPrincipalOrgPositionLink)
  )
  await assertElementNotPresent(
    t,
    ".edit-position",
    "superuser should not be able to edit positions of the principal organization their position is not administrating",
    shortWaitMs
  )
  await t.context.logout()
})

validateUserCannotEditOtherUser(
  "superuser cannot edit administrator",
  "rebecca",
  "arthur",
  "CIV DMIN, Arthur",
  "ANET Administrator"
)

validateUserCannotEditOtherUser(
  "superuser cannot edit people from the organizations their position is not administrating",
  "jacob",
  "andrew",
  "CIV ANDERSON, Andrew",
  "EF 1 Manager"
)

test.serial("checking regular user permissions", async t => {
  t.plan(3)

  const { pageHelpers, $, assertElementNotPresent, shortWaitMs } = t.context

  await t.context.get("/", "jack")
  await pageHelpers.clickMenuLinksButton()
  await pageHelpers.clickMyOrgLink()
  await pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    "OF-9 JACKSON, Jack"
  )
  await t.context.driver.sleep(shortWaitMs) // wait for transition

  await validateUserCanEditUserForCurrentPage(t, false)

  const $positionName = await $(".position-name")
  await $positionName.click()
  await assertElementNotPresent(
    t,
    ".edit-position",
    "Jack should not be able to edit his own position",
    shortWaitMs
  )

  await t.context.logout()
})

validateUserCannotEditOtherUser(
  "Regular user cannot edit superuser people or positions",
  "jack",
  "rebecca",
  "CTR BECCABON, Rebecca",
  "EF 2.2 Final Reviewer"
)

validateUserCannotEditOtherUser(
  "Regular user cannot edit admin people or positions",
  "jack",
  "arthur",
  "CIV DMIN, Arthur",
  "ANET Administrator"
)

test.serial("checking admin permissions", async t => {
  t.plan(10)

  const { $, By, driver, until, shortWaitMs } = t.context

  await t.context.get("/", "arthur")

  const $createButton = await $("#createButton")
  await $createButton.click()
  const $createPersonButton = await $("#new-person")
  await $createPersonButton.click()
  const $userInput = await $("#fg-user")
  await driver.wait(until.elementIsVisible($userInput), shortWaitMs)
  const $userButton = await $('label[for="user_true"]')
  await $userButton.click()
  const $domainUsernameInput = await $("#domainUsername")
  await driver.wait(until.elementIsVisible($domainUsernameInput), shortWaitMs)

  // Cancel Create Person
  const $cancelButton = await driver.findElement(
    By.xpath('//button[text()="Cancel"]')
  )
  await $cancelButton.click()
  const $alertOkButton = await driver.findElement(
    By.xpath(
      '//div[contains(@class, "triggerable-confirm-bootstrap-modal")]//button[text()="OK"]'
    )
  )
  await $alertOkButton.click()

  await t.context.pageHelpers.clickMenuLinksButton()
  await t.context.pageHelpers.clickMyOrgLink()

  const element = await t.context.driver.findElement(
    By.linkText("CIV DMIN, Arthur")
  )
  await element.click()

  await validateUserCanEditUserForCurrentPage(t, true)
  // User is admin, and can therefore edit (its own) admin position type
  await editAndSavePositionFromCurrentUserPage(t, true)

  const $orgLink = await getFromSearchResults(
    t,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await $orgLink.click()
  await validateAdminOrgPermissions(t)

  const $locationLink = await getFromSearchResults(
    t,
    "General Hospital",
    "General Hospital 47.571772,-52.741935",
    "locations"
  )
  await $locationLink.click()
  await validateAdminLocationPermissions(t)

  await t.context.logout()
})

test.serial("admins can edit superusers and their positions", async t => {
  t.plan(5)

  await t.context.get("/", "arthur")

  const $rebeccaPersonLink = await getFromSearchResults(
    t,
    "rebecca",
    "CTR BECCABON, Rebecca",
    "people"
  )
  await $rebeccaPersonLink.click()
  await t.context.driver.wait(t.context.untilStalenessOf($rebeccaPersonLink))
  await validateUserCanEditUserForCurrentPage(t, true)

  // User is admin, and can therefore edit a superuser position type
  await editAndSavePositionFromCurrentUserPage(t, true)

  await t.context.logout()
})

function validateUserCannotEditOtherUser(
  testTitle,
  user,
  searchQuery,
  otherUserName,
  otherUserPosition
) {
  test(testTitle, async t => {
    t.plan(2)

    const { assertElementNotPresent, shortWaitMs } = t.context

    await t.context.get("/", user)

    const $arthurPersonLink = await getFromSearchResults(
      t,
      searchQuery,
      otherUserName,
      "people"
    )
    await $arthurPersonLink.click()
    await t.context.driver.sleep(shortWaitMs) // wait for transition
    await assertElementNotPresent(
      t,
      ".edit-person",
      `${user} should not be able to edit ${otherUserName}`,
      shortWaitMs
    )

    const $arthurPositionLink = await getFromSearchResults(
      t,
      searchQuery,
      otherUserPosition,
      "people"
    )
    await $arthurPositionLink.click()
    await assertElementNotPresent(
      t,
      ".edit-position",
      `${user} should not be able edit the "${otherUserPosition}" position`,
      shortWaitMs
    )

    await t.context.logout()
  })
}

async function findSuperuserLink(
  t,
  desiredSuperuserName,
  desiredOrganizationsAdministrated
) {
  const $superuserRows = await t.context.$$("[id=superuser-table] tbody tr")
  let $foundSuperuser
  let $foundOrganizationsAdministrated
  for (const $superuserRow of $superuserRows) {
    const $superuserLink = await $superuserRow.findElement(
      t.context.By.css("td:nth-child(5) span a")
    )
    const superuserName = await $superuserLink.getText()
    if (superuserName === desiredSuperuserName) {
      $foundSuperuser = $superuserLink
      const organizationsAdministratedElem = await $superuserRow.findElement(
        t.context.By.css("td:nth-child(4)")
      )
      const organizationsAdministrated =
        await organizationsAdministratedElem.getText()
      if (organizationsAdministrated === desiredOrganizationsAdministrated) {
        $foundOrganizationsAdministrated = organizationsAdministrated
      }
      break
    }
  }

  if (!$foundSuperuser) {
    t.fail(
      `Could not find superuser '${desiredSuperuserName}'. The data does not match what this test expects.`
    )
  }

  if (!$foundOrganizationsAdministrated) {
    t.fail(
      `Organizations administrated by '${desiredSuperuserName}' do not match what this test expects.`
    )
  }

  return $foundSuperuser
}

async function validateUserCanEditUserForCurrentPage(t, canChangeName) {
  const {
    $,
    assertElementEnabled,
    assertElementText,
    shortWaitMs,
    mediumWaitMs,
    longWaitMs
  } = t.context

  await t.context.driver.sleep(mediumWaitMs) // wait for transition
  const $editPersonButton = await $(".edit-person")
  await t.context.driver.wait(
    t.context.until.elementIsVisible($editPersonButton)
  )
  await $editPersonButton.click()

  if (canChangeName) {
    // The user can should be able to change the name
    await assertElementEnabled(
      t,
      '[name="lastName"]',
      "Last name of a person should be enabled"
    )
    await assertElementEnabled(
      t,
      '[name="firstName"]',
      "First name of a person should be enabled"
    )
  }

  // Check that user can change the biography
  const $bioTextArea = await $(
    ".biography .editable",
    shortWaitMs // wait for Slate to save the editor contents
  )
  await t.context.driver.wait(
    async() => {
      const originalBioText = await $bioTextArea.getText()
      return originalBioText !== ""
    },
    longWaitMs,
    "This test assumes that the current user has a non-empty biography."
  )
  const originalBioText = await $bioTextArea.getText()

  const fakeBioText = ` fake bio ${uuidv4()}`
  await $bioTextArea.sendKeys(t.context.Key.END + fakeBioText)
  // wait for component to update (internal) state
  await t.context.driver.sleep(shortWaitMs)

  await t.context.pageHelpers.clickFormBottomSubmit()
  await t.context.driver.sleep(shortWaitMs) // wait for transition

  await assertElementText(t, await $(".alert"), "Person saved")
  await assertElementText(
    t,
    await $(".biography p"),
    originalBioText + fakeBioText
  )
}

async function editAndSavePositionFromCurrentUserPage(t, validateTrue) {
  const { $ } = t.context

  const $positionName = await $(".position-name")
  await $positionName.click()
  await validationEditPositionOnCurrentPage(t, validateTrue)
}

async function validationEditPositionOnCurrentPage(t, validateTrue) {
  const { $, assertElementText, until, shortWaitMs, mediumWaitMs } = t.context
  const $editButton = await $(".edit-position")
  await t.context.driver.wait(until.elementIsVisible($editButton), mediumWaitMs)
  await $editButton.click()
  await t.context.pageHelpers.clickFormBottomSubmit()
  await t.context.driver.sleep(shortWaitMs) // wait for transition
  if (validateTrue) {
    await assertElementText(t, await $(".alert"), "Position saved")
  } else {
    await assertElementText(
      t,
      await $(".alert"),
      "Forbidden: Exception while fetching data (/updatePosition) : You do not have permissions to do this"
    )
  }
}

async function validateSuperuserNonAdministratingOrgPermissions(t) {
  const { assertElementNotPresent, shortWaitMs } = t.context

  await assertElementNotPresent(
    t,
    "#editButton",
    "Superusers should not be able to edit non-administrating organizations",
    shortWaitMs
  )
}

async function validateAdminOrgPermissions(t) {
  const { $, assertElementEnabled } = t.context

  const $editOrgButton = await $("#editButton")
  await t.context.driver.wait(t.context.until.elementIsVisible($editOrgButton))
  await $editOrgButton.click()
  await assertElementEnabled(
    t,
    "#parentOrg",
    "Field parentOrganization of an organization should be enabled for admins"
  )
  await assertElementEnabled(
    t,
    "#shortName",
    "Field shortName of an organization should be enabled for admins"
  )
  await assertElementEnabled(
    t,
    "#longName",
    "Field longName of an organization should be enabled for admins"
  )
}

async function validateSuperuserLocationPermissions(t) {
  const { $, assertElementEnabled, assertElementDisabled } = t.context

  const $editLocationButton = await $("#editButton")
  await t.context.driver.wait(
    t.context.until.elementIsVisible($editLocationButton)
  )
  await $editLocationButton.click()
  await assertElementDisabled(
    t,
    '[name="name"]',
    "Field name of a location should be disabled for superusers"
  )
  await assertElementEnabled(
    t,
    '[name="status"]',
    "Field status of a location should be enabled for superusers"
  )
}

async function validateAdminLocationPermissions(t) {
  const { $, assertElementEnabled } = t.context

  const $editLocationButton = await $("#editButton")
  await t.context.driver.wait(
    t.context.until.elementIsVisible($editLocationButton)
  )
  await $editLocationButton.click()
  await assertElementEnabled(
    t,
    '[name="name"]',
    "Field name of a location should be enabled for admins"
  )
  await assertElementEnabled(
    t,
    '[name="status"]',
    "Field status of a location should be enabled for admins"
  )
}

async function getFromSearchResults(
  t,
  searchQuery,
  resultText,
  searchResultsType
) {
  const { $, $$ } = t.context

  const $searchBar = await $("#searchBarInput")
  await $searchBar.clear()
  await $searchBar.sendKeys(searchQuery)

  const $searchBarSubmit = await $("#searchBarSubmit")
  await $searchBarSubmit.click()

  const $searchResultLinks = await $$(
    "#" + searchResultsType + "-search-results td a"
  )

  async function findLinkWithText(text) {
    for (const $link of $searchResultLinks) {
      const linkText = await $link.getText()
      if (linkText === text) {
        return $link
      }
    }
    t.fail(
      `Could not find link with text '${text}' when searching '${searchQuery}'. The data does not match what this test expects.`
    )
  }

  return await findLinkWithText(resultText)
}
