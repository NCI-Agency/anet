import { v4 as uuidv4 } from "uuid"
import { expect, fail, test } from "./support.js"

// Permission updates must stay in the same worker.
test.describe.configure({
  mode: "serial"
})

test("checking superuser permissions", async ({ app }) => {
  const { pageHelpers, $, assertElementNotPresent, shortWaitMs } = app
  await app.login("/", "rebecca")
  const $createButton = await $("#createButton")
  await $createButton.click()
  const $createPersonButton = await $("#new-person")
  await $createPersonButton.click()
  await assertElementNotPresent(
    "#fg-user",
    "Rebecca should not be able to create new users",
    shortWaitMs
  )

  // Cancel Create Person
  const $cancelButton = await app.page
    .locator("xpath=" + '//button[text()="Cancel"]')
    .first()
  await $cancelButton.click()
  const $alertOkButton = await app.page
    .locator(
      "xpath=" +
        '//div[contains(@class, "triggerable-confirm-bootstrap-modal")]//button[text()="OK"]'
    )
    .first()
  await $alertOkButton.click()
  await pageHelpers.clickMenuLinksButton()
  await pageHelpers.clickMyOrgLink()
  const $rebeccaLink = await findSuperuserLink(
    app,
    "CTR Rebecca Beccabon",
    "EF 2.2"
  )
  await $rebeccaLink.click()
  await expect($rebeccaLink).toBeHidden()
  await validateUserCanEditUserForCurrentPage(app, true)
  const biography = app.page.locator(".biography .editable")
  const savedBiography = await biography.innerText()
  await app.page.reload()
  await expect(biography).toHaveText(savedBiography)

  // User is superuser, they may edit position of type superuser for
  // the organization their position is administrating
  await editAndSavePositionFromCurrentUserPage(app, true)
  await app.logout()
  await app.login("/", "rebecca")
  await pageHelpers.clickMenuLinksButton()
  await pageHelpers.clickMyOrgLink()
  const $jacobLink = await findSuperuserLink(
    app,
    "CIV Jacob Jacobson",
    "EF 2.2"
  )
  await $jacobLink.click()
  await expect($jacobLink).toBeHidden()
  await validateUserCanEditUserForCurrentPage(app, true)

  // User is superuser, they may edit position of type superuser for
  // the organization their position is administrating
  await editAndSavePositionFromCurrentUserPage(app, true)

  // User is superuser, they may edit positions only for
  // organizations their position is assigned to
  const $otherAdvisorOrgPositionLink = await getFromSearchResults(
    app,
    "EF 1 Manager",
    "EF 1 Manager",
    "positions"
  )
  await $otherAdvisorOrgPositionLink.click()
  await expect($otherAdvisorOrgPositionLink).toBeHidden()
  await assertElementNotPresent(
    ".edit-position",
    "superuser should not be able to edit positions of the advisor organization their position is not administrating",
    shortWaitMs
  )
  const $nonAdministratingOrgLink = await getFromSearchResults(
    app,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await $nonAdministratingOrgLink.click()
  await validateSuperuserNonAdministratingOrgPermissions(app)
  const $locationLink = await getFromSearchResults(
    app,
    "General Hospital",
    "General Hospital",
    "locations"
  )
  await $locationLink.click()
  await validateSuperuserLocationPermissions(app)
  await app.logout()
  await app.login("/", "jacob")
  const $ownOrgPositionLink = await getFromSearchResults(
    app,
    "EF 2.2 Final Reviewer",
    "EF 2.2 Final Reviewer",
    "positions"
  )
  await $ownOrgPositionLink.click()
  await expect($ownOrgPositionLink).toBeHidden()
  const $editPositionButton = await $(".edit-position")
  await expect($editPositionButton).toBeVisible()
  await app.logout()
  await app.login("/", "andrew")
  const $ef11Link = await getFromSearchResults(
    app,
    "EF 1.1",
    "EF 1.1",
    "organizations"
  )
  await $ef11Link.click()
  // Check that Andrew is (also) superuser of EF 1.1
  await findSuperuserLink(
    app,
    "CIV Andrew Anderson",
    "EF 1 | Planning Programming, Budgeting and Execution"
  )
  await pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    "OF-2 Elizabeth Elizawell"
  )

  await validateUserCanEditUserForCurrentPage(app, true)
  await app.logout()
  await app.login("/", "bob")
  const $modLink = await getFromSearchResults(
    app,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await $modLink.click()
  // Check that Bob is (also) superuser of MoD
  await findSuperuserLink(app, "CIV Bob Bobtown", "MoD | Ministry of Defense")
  await pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    "CIV Kyle Kyleson"
  )

  await validateUserCanEditUserForCurrentPage(app, true)
  const $otherPrincipalOrgPositionLink = await getFromSearchResults(
    app,
    "Chief of Police",
    "Chief of Police - MOI-Pol-HQ-00001",
    "positions"
  )
  await $otherPrincipalOrgPositionLink.click()
  await expect($otherPrincipalOrgPositionLink).toBeHidden()
  await assertElementNotPresent(
    ".edit-position",
    "superuser should not be able to edit positions of the principal organization their position is not administrating",
    shortWaitMs
  )
  await app.logout()
})

validateUserCannotEditOtherUser(
  "superuser cannot edit administrator",
  "rebecca",
  "arthur",
  "CIV Arthur Dmin",
  "ANET Administrator"
)

validateUserCannotEditOtherUser(
  "superuser cannot edit people from the organizations their position is not administrating",
  "jacob",
  "andrew",
  "CIV Andrew Anderson",
  "EF 1 Manager"
)

test("checking regular user permissions", async ({ app }) => {
  const { pageHelpers, $, assertElementNotPresent, shortWaitMs } = app
  await app.login("/", "jack")
  await pageHelpers.clickMenuLinksButton()
  await pageHelpers.clickMyOrgLink()
  await pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    "OF-9 Jack Jackson"
  )

  await validateUserCanEditUserForCurrentPage(app, false)
  const $positionName = await $(".position-name")
  await $positionName.click()
  await assertElementNotPresent(
    ".edit-position",
    "Jack should not be able to edit his own position",
    shortWaitMs
  )
  await app.logout()
})

validateUserCannotEditOtherUser(
  "Regular user cannot edit superuser people or positions",
  "jack",
  "rebecca",
  "CTR Rebecca Beccabon",
  "EF 2.2 Final Reviewer"
)

validateUserCannotEditOtherUser(
  "Regular user cannot edit admin people or positions",
  "jack",
  "arthur",
  "CIV Arthur Dmin",
  "ANET Administrator"
)

test("checking admin permissions", async ({ app }) => {
  const { $, shortWaitMs } = app
  await app.login("/", "arthur")
  const $createButton = await $("#createButton")
  await $createButton.click()
  const $createPersonButton = await $("#new-person")
  await $createPersonButton.click()
  const $userInput = await $("#fg-user")
  await expect($userInput).toBeVisible({
    timeout: shortWaitMs
  })
  const $userButton = await $('label[for="user_true"]')
  await $userButton.click()
  const $addusersButton = await $("#addusersButton")
  await expect($addusersButton).toBeVisible({
    timeout: shortWaitMs
  })

  // Cancel Create Person
  const $cancelButton = await app.page
    .locator("xpath=" + '//button[text()="Cancel"]')
    .first()
  await $cancelButton.click()
  const $alertOkButton = await app.page
    .locator(
      "xpath=" +
        '//div[contains(@class, "triggerable-confirm-bootstrap-modal")]//button[text()="OK"]'
    )
    .first()
  await $alertOkButton.click()
  await app.pageHelpers.clickMenuLinksButton()
  await app.pageHelpers.clickMyOrgLink()
  const element = await app.page
    .locator("a")
    .filter({ hasText: "CIV Arthur Dmin" })
    .first()
  await element.click()
  await validateUserCanEditUserForCurrentPage(app, true)
  // User is admin, and can therefore edit (its own) admin position type
  await editAndSavePositionFromCurrentUserPage(app, true)
  const $orgLink = await getFromSearchResults(
    app,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await $orgLink.click()
  await validateAdminOrgPermissions(app)
  const $locationLink = await getFromSearchResults(
    app,
    "General Hospital",
    "General Hospital",
    "locations"
  )
  await $locationLink.click()
  await validateAdminLocationPermissions(app)
  await app.logout()
})

test("admins can edit superusers and their positions", async ({ app }) => {
  await app.login("/", "arthur")
  const $rebeccaPersonLink = await getFromSearchResults(
    app,
    "rebecca",
    "CTR Rebecca Beccabon",
    "people"
  )
  await $rebeccaPersonLink.click()
  await expect($rebeccaPersonLink).toBeHidden()
  await validateUserCanEditUserForCurrentPage(app, true)

  // User is admin, and can therefore edit a superuser position type
  await editAndSavePositionFromCurrentUserPage(app, true)
  await app.logout()
})

function validateUserCannotEditOtherUser(
  testTitle,
  user,
  searchQuery,
  otherUserName,
  otherUserPosition
) {
  test(testTitle, async ({ app }) => {
    const { assertElementNotPresent, shortWaitMs } = app
    await app.login("/", user)
    const $arthurPersonLink = await getFromSearchResults(
      app,
      searchQuery,
      otherUserName,
      "people"
    )
    await $arthurPersonLink.click()

    await assertElementNotPresent(
      ".edit-person",
      `${user} should not be able to edit ${otherUserName}`,
      shortWaitMs
    )
    const $arthurPositionLink = await getFromSearchResults(
      app,
      searchQuery,
      otherUserPosition,
      "people"
    )
    await $arthurPositionLink.click()
    await assertElementNotPresent(
      ".edit-position",
      `${user} should not be able edit the "${otherUserPosition}" position`,
      shortWaitMs
    )
    await app.logout()
  })
}

async function findSuperuserLink(
  app,
  desiredSuperuserName,
  desiredOrganizationsAdministrated
) {
  const $superuserRows = await app.$$("[id=superuser-table] tbody tr")
  let $foundSuperuser
  let $foundOrganizationsAdministrated
  for (const $superuserRow of $superuserRows) {
    const $superuserLink = await $superuserRow
      .locator("td:nth-child(5) span a")
      .first()
    const superuserName = await $superuserLink.innerText()
    if (superuserName === desiredSuperuserName) {
      $foundSuperuser = $superuserLink
      const organizationsAdministratedElem = await $superuserRow
        .locator("td:nth-child(4)")
        .first()
      const organizationsAdministrated =
        await organizationsAdministratedElem.innerText()
      if (organizationsAdministrated === desiredOrganizationsAdministrated) {
        $foundOrganizationsAdministrated = organizationsAdministrated
      }
      break
    }
  }
  if (!$foundSuperuser) {
    fail(
      `Could not find superuser '${desiredSuperuserName}'. The data does not match what this test expects.`
    )
  }
  if (!$foundOrganizationsAdministrated) {
    fail(
      `Organizations administrated by '${desiredSuperuserName}' do not match what this test expects.`
    )
  }
  return $foundSuperuser
}

async function validateUserCanEditUserForCurrentPage(app, canChangeName) {
  const { $, assertElementEnabled, assertElementText } = app

  const $editPersonButton = await $(".edit-person")
  await expect($editPersonButton).toBeVisible()
  await $editPersonButton.click()
  if (canChangeName) {
    // The user can should be able to change the name
    await assertElementEnabled(
      '[name="familyName"]',
      "Family name of a person should be enabled"
    )
    await assertElementEnabled(
      '[name="givenName"]',
      "Given name of a person should be enabled"
    )
  }

  // Check that user can change the biography
  const $bioTextArea = await $(".biography .editable")
  await expect
    .poll(async () => {
      const originalBioText = await $bioTextArea.innerText()
      return originalBioText !== ""
    })
    .toBeTruthy()
  const originalBioText = (await $bioTextArea.innerText())
    .replace(/\uFEFF/g, "")
    .trim()
  const fakeBioText = ` fake bio ${uuidv4()}`
  await $bioTextArea.fill(`${originalBioText}\n${fakeBioText}`)
  await $bioTextArea.blur()

  await app.pageHelpers.clickFormBottomSubmit()

  await assertElementText(await $(".alert"), "Person saved")
  await assertElementText(
    await $(".biography .editable"),
    `${originalBioText}\n${fakeBioText}`
  )
}

async function editAndSavePositionFromCurrentUserPage(app, validateTrue) {
  const { $ } = app
  const $positionName = await $(".position-name")
  await $positionName.click()
  await validationEditPositionOnCurrentPage(app, validateTrue)
}

async function validationEditPositionOnCurrentPage(app, validateTrue) {
  const { $, assertElementText, mediumWaitMs } = app
  const $editButton = await $(".edit-position")
  await expect($editButton).toBeVisible({
    timeout: mediumWaitMs
  })
  await $editButton.click()
  await app.pageHelpers.clickFormBottomSubmit()

  if (validateTrue) {
    await assertElementText(await $(".alert"), "Position saved")
  } else {
    await assertElementText(
      await $(".alert"),
      "Forbidden: Exception while fetching data (/updatePosition) : You do not have permissions to do this"
    )
  }
}

async function validateSuperuserNonAdministratingOrgPermissions(app) {
  const { assertElementNotPresent, shortWaitMs } = app
  await assertElementNotPresent(
    "#editButton",
    "Superusers should not be able to edit non-administrating organizations",
    shortWaitMs
  )
}

async function validateAdminOrgPermissions(app) {
  const { $, assertElementEnabled } = app
  const $editOrgButton = await $("#editButton")
  await expect($editOrgButton).toBeVisible()
  await $editOrgButton.click()
  await assertElementEnabled(
    "#parentOrg",
    "Field parentOrganization of an organization should be enabled for admins"
  )
  await assertElementEnabled(
    "#shortName",
    "Field shortName of an organization should be enabled for admins"
  )
  await assertElementEnabled(
    "#longName",
    "Field longName of an organization should be enabled for admins"
  )
}

async function validateSuperuserLocationPermissions(app) {
  const { $, assertElementEnabled, assertElementDisabled } = app
  const $editLocationButton = await $("#editButton")
  await expect($editLocationButton).toBeVisible()
  await $editLocationButton.click()
  await assertElementDisabled(
    '[name="name"]',
    "Field name of a location should be disabled for superusers"
  )
  await assertElementEnabled(
    '[name="status"]',
    "Field status of a location should be enabled for superusers"
  )
}

async function validateAdminLocationPermissions(app) {
  const { $, assertElementEnabled } = app
  const $editLocationButton = await $("#editButton")
  await expect($editLocationButton).toBeVisible()
  await $editLocationButton.click()
  await assertElementEnabled(
    '[name="name"]',
    "Field name of a location should be enabled for admins"
  )
  await assertElementEnabled(
    '[name="status"]',
    "Field status of a location should be enabled for admins"
  )
}

async function getFromSearchResults(
  app,
  searchQuery,
  resultText,
  searchResultsType
) {
  const { $, $$ } = app
  const $searchBar = await $("#searchBarInput")
  await $searchBar.clear()
  await $searchBar.pressSequentially(searchQuery)
  const $searchBarSubmit = await $("#searchBarSubmit")
  await $searchBarSubmit.click()
  const searchResultsIdentifier = ["locations"].includes(searchResultsType)
    ? `.${searchResultsType.slice(0, -1)}-collection`
    : `#${searchResultsType}-search-results`
  const $searchResultLinks = await $$(`${searchResultsIdentifier} td a`)
  async function findLinkWithText(text) {
    for (const $link of $searchResultLinks) {
      const linkText = await $link.innerText()
      if (linkText === text) {
        return $link
      }
    }
    fail(
      `Could not find link with text '${text}' when searching '${searchQuery}'. The data does not match what this test expects.`
    )
  }
  return await findLinkWithText(resultText)
}

test("checking superuser that can create top-level organizations permissions", async ({
  app
}) => {
  await app.login("/", "jim")

  // Jim can create top-level organizations
  await canCreateOrganization(app)
  // but Jim can not edit organizations
  const $nonAdministratingOrgLink = await getFromSearchResults(
    app,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await $nonAdministratingOrgLink.click()
  await validateSuperuserNonAdministratingOrgPermissions(app)
  await app.logout()
})

test("checking superuser that can edit any organizations permissions", async ({
  app
}) => {
  await app.login("/", "billie")

  // Billie can create top-level organizations
  await canCreateOrganization(app)
  // And she can also edit any organization
  const $nonAdministratingOrgLink = await getFromSearchResults(
    app,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await $nonAdministratingOrgLink.click()
  await validateAdminOrgPermissions(app)
  await app.logout()
})

async function canCreateOrganization(app) {
  const { $, shortWaitMs } = app
  const $createButton = await $("#createButton")
  await $createButton.click()
  const $createOrganizationButton = await $("#new-organization")
  await $createOrganizationButton.click()
  const $organizationInput = await $("#shortName")
  await expect($organizationInput).toBeVisible({
    timeout: shortWaitMs
  })

  // Cancel Create Organization
  const $cancelButton = await app.page
    .locator("xpath=" + '//button[text()="Cancel"]')
    .first()
  await $cancelButton.click()
}

test("checking superuser that can create top-level tasks permissions", async ({
  app
}) => {
  await app.login("/", "jim")

  // Jim can create top-level tasks
  await canCreateTask(app)
  // but Jim can not edit tasks
  const $notResponsibleForTaskLink = await getFromSearchResults(
    app,
    "1.1.C",
    "1.1.C",
    "tasks"
  )
  await $notResponsibleForTaskLink.click()
  await validateSuperuserNotResponsibleForTaskPermissions(app)
  await app.logout()
})

test("checking superuser that can edit any tasks permissions", async ({
  app
}) => {
  await app.login("/", "billie")

  // Billie can create top-level tasks
  await canCreateTask(app)
  // And she can also edit any task
  const $notResponsibleForTaskLink = await getFromSearchResults(
    app,
    "1.1.C",
    "1.1.C",
    "tasks"
  )
  await $notResponsibleForTaskLink.click()
  await validateSuperuserResponsibleForTaskPermissions(app)
  await app.logout()
})

async function validateSuperuserNotResponsibleForTaskPermissions(app) {
  const { assertElementNotPresent, shortWaitMs } = app
  await assertElementNotPresent(
    "#editButton",
    "Superusers should not be able to edit not-responsible-for tasks",
    shortWaitMs
  )
}

async function validateSuperuserResponsibleForTaskPermissions(app) {
  const { $, assertElementEnabled } = app
  const $editTaskButton = await $("#editButton")
  await expect($editTaskButton).toBeVisible()
  await $editTaskButton.click()
  await assertElementEnabled(
    "#parentTask",
    "Field parentTask of a task should be enabled for admins"
  )
  await assertElementEnabled(
    "#shortName",
    "Field shortName of a task should be enabled for admins"
  )
  await assertElementEnabled(
    "#longName",
    "Field longName of a task should be enabled for admins"
  )
}

async function canCreateTask(app) {
  const { $, shortWaitMs } = app
  const $createButton = await $("#createButton")
  await $createButton.click()
  const $createTaskButton = await $("#new-objective")
  await $createTaskButton.click()
  const $taskInput = await $("#shortName")
  await expect($taskInput).toBeVisible({
    timeout: shortWaitMs
  })

  // Cancel Create Task
  const $cancelButton = await app.page
    .locator("xpath=" + '//button[text()="Cancel"]')
    .first()
  await $cancelButton.click()
}
