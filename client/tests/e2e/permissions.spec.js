import { expect, test } from "@playwright/test"
import { v4 as uuidv4 } from "uuid"
import { RichTextEditor } from "./components/RichTextEditor.js"
import { LoginPage } from "./pages/LoginPage.js"
import { OrganizationPage } from "./pages/OrganizationPage.js"

// Permission updates must stay in the same worker.
test.describe.configure({
  mode: "serial"
})

test("checking superuser permissions", async ({ page }) => {
  const login = new LoginPage(page)
  const organization = new OrganizationPage(page)
  await login.login("/", "rebecca")
  const createButton = page.locator("#createButton").first()
  await createButton.click()
  const createPersonButton = page.locator("#new-person").first()
  await createPersonButton.click()
  await expect(
    page.locator("#fg-user"),
    "Rebecca should not be able to create new users"
  ).toHaveCount(0)

  // Cancel Create Person
  const cancelButton = page
    .getByRole("button", { name: "Cancel", exact: true })
    .first()
  await cancelButton.click()
  const alertOkButton = page
    .locator(".triggerable-confirm-bootstrap-modal")
    .getByRole("button", { name: "OK", exact: true })
    .first()
  await alertOkButton.click()
  await page.locator("#my-work").click()
  await organization.openMyOrganization()
  const rebeccaLink = await findSuperuserLink(
    page,
    "CTR Rebecca Beccabon",
    "EF 2.2"
  )
  await rebeccaLink.click()
  await expect(rebeccaLink).toBeHidden()
  await validateUserCanEditUserForCurrentPage(page, true)

  // User is superuser, they may edit position of type superuser for
  // the organization their position is administrating
  await editAndSavePositionFromCurrentUserPage(page, true)
  await login.logout()
  await login.login("/", "rebecca")
  await page.locator("#my-work").click()
  await organization.openMyOrganization()
  const jacobLink = await findSuperuserLink(
    page,
    "CIV Jacob Jacobson",
    "EF 2.2"
  )
  await jacobLink.click()
  await expect(jacobLink).toBeHidden()
  await validateUserCanEditUserForCurrentPage(page, true)

  // User is superuser, they may edit position of type superuser for
  // the organization their position is administrating
  await editAndSavePositionFromCurrentUserPage(page, true)

  // User is superuser, they may edit positions only for
  // organizations their position is assigned to
  const otherAdvisorOrgPositionLink = await getFromSearchResults(
    page,
    "EF 1 Manager",
    "EF 1 Manager",
    "positions"
  )
  await otherAdvisorOrgPositionLink.click()
  await expect(otherAdvisorOrgPositionLink).toBeHidden()
  await expect(
    page.locator(".edit-position"),
    "superuser should not be able to edit positions of the advisor organization their position is not administrating"
  ).toHaveCount(0)
  const nonAdministratingOrgLink = await getFromSearchResults(
    page,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await nonAdministratingOrgLink.click()
  await validateSuperuserNonAdministratingOrgPermissions(page)
  const locationLink = await getFromSearchResults(
    page,
    "General Hospital",
    "General Hospital",
    "locations"
  )
  await locationLink.click()
  await validateSuperuserLocationPermissions(page)
  await login.logout()
  await login.login("/", "jacob")
  const ownOrgPositionLink = await getFromSearchResults(
    page,
    "EF 2.2 Final Reviewer",
    "EF 2.2 Final Reviewer",
    "positions"
  )
  await ownOrgPositionLink.click()
  await expect(ownOrgPositionLink).toBeHidden()
  const editPositionButton = page.locator(".edit-position").first()
  await expect(editPositionButton).toBeVisible()
  await login.logout()
  await login.login("/", "andrew")
  const ef11Link = await getFromSearchResults(
    page,
    "EF 1.1",
    "EF 1.1",
    "organizations"
  )
  await ef11Link.click()
  // Check that Andrew is (also) superuser of EF 1.1
  await findSuperuserLink(
    page,
    "CIV Andrew Anderson",
    "EF 1 | Planning Programming, Budgeting and Execution"
  )
  await organization.openPerson("OF-2 Elizabeth Elizawell")
  await validateUserCanEditUserForCurrentPage(page, true)
  await login.logout()
  await login.login("/", "bob")
  const modLink = await getFromSearchResults(
    page,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await modLink.click()
  // Check that Bob is (also) superuser of MoD
  await findSuperuserLink(page, "CIV Bob Bobtown", "MoD | Ministry of Defense")
  await organization.openPerson("CIV Kyle Kyleson")
  await validateUserCanEditUserForCurrentPage(page, true)
  const otherPrincipalOrgPositionLink = await getFromSearchResults(
    page,
    "Chief of Police",
    "Chief of Police - MOI-Pol-HQ-00001",
    "positions"
  )
  await otherPrincipalOrgPositionLink.click()
  await expect(otherPrincipalOrgPositionLink).toBeHidden()
  await expect(
    page.locator(".edit-position"),
    "superuser should not be able to edit positions of the principal organization their position is not administrating"
  ).toHaveCount(0)
  await login.logout()
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
test("checking regular user permissions", async ({ page }) => {
  const login = new LoginPage(page)
  const organization = new OrganizationPage(page)
  await login.login("/", "jack")
  await page.locator("#my-work").click()
  await organization.openMyOrganization()
  await organization.openPerson("OF-9 Jack Jackson")
  await validateUserCanEditUserForCurrentPage(page, false)
  const positionName = page.locator(".position-name").first()
  await positionName.click()
  await expect(
    page.locator(".edit-position"),
    "Jack should not be able to edit his own position"
  ).toHaveCount(0)
  await login.logout()
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
test("checking admin permissions", async ({ page }) => {
  const login = new LoginPage(page)
  const organization = new OrganizationPage(page)
  await login.login("/", "arthur")
  const createButton = page.locator("#createButton").first()
  await createButton.click()
  const createPersonButton = page.locator("#new-person").first()
  await createPersonButton.click()
  const userInput = page.locator("#fg-user").first()
  await expect(userInput).toBeVisible()
  const userButton = page.locator('label[for="user_true"]').first()
  await userButton.click()
  const addusersButton = page.locator("#addusersButton").first()
  await expect(addusersButton).toBeVisible()

  // Cancel Create Person
  const cancelButton = page
    .getByRole("button", { name: "Cancel", exact: true })
    .first()
  await cancelButton.click()
  const alertOkButton = page
    .locator(".triggerable-confirm-bootstrap-modal")
    .getByRole("button", { name: "OK", exact: true })
    .first()
  await alertOkButton.click()
  await page.locator("#my-work").click()
  await organization.openMyOrganization()
  const element = page
    .locator("a")
    .filter({
      hasText: "CIV Arthur Dmin"
    })
    .first()
  await element.click()
  await validateUserCanEditUserForCurrentPage(page, true)
  // User is admin, and can therefore edit (its own) admin position type
  await editAndSavePositionFromCurrentUserPage(page, true)
  const orgLink = await getFromSearchResults(
    page,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await orgLink.click()
  await validateAdminOrgPermissions(page)
  const locationLink = await getFromSearchResults(
    page,
    "General Hospital",
    "General Hospital",
    "locations"
  )
  await locationLink.click()
  await validateAdminLocationPermissions(page)
  await login.logout()
})

test("admins can edit superusers and their positions", async ({ page }) => {
  const login = new LoginPage(page)
  await login.login("/", "arthur")
  const rebeccaPersonLink = await getFromSearchResults(
    page,
    "rebecca",
    "CTR Rebecca Beccabon",
    "people"
  )
  await rebeccaPersonLink.click()
  await expect(rebeccaPersonLink).toBeHidden()
  await validateUserCanEditUserForCurrentPage(page, true)

  // User is admin, and can therefore edit a superuser position type
  await editAndSavePositionFromCurrentUserPage(page, true)
  await login.logout()
})
function validateUserCannotEditOtherUser(
  testTitle,
  user,
  searchQuery,
  otherUserName,
  otherUserPosition
) {
  test(testTitle, async ({ page }) => {
    const login = new LoginPage(page)
    await login.login("/", user)
    const arthurPersonLink = await getFromSearchResults(
      page,
      searchQuery,
      otherUserName,
      "people"
    )
    await arthurPersonLink.click()
    await expect(
      page.locator(".edit-person"),
      `${user} should not be able to edit ${otherUserName}`
    ).toHaveCount(0)
    const arthurPositionLink = await getFromSearchResults(
      page,
      searchQuery,
      otherUserPosition,
      "people"
    )
    await arthurPositionLink.click()
    await expect(
      page.locator(".edit-position"),
      `${user} should not be able edit the "${otherUserPosition}" position`
    ).toHaveCount(0)
    await login.logout()
  })
}
async function findSuperuserLink(
  page,
  desiredSuperuserName,
  desiredOrganizationsAdministrated
) {
  const row = page.locator("#superuser-table tbody tr").filter({
    has: page
      .locator("td:nth-child(5)")
      .getByText(desiredSuperuserName, { exact: true })
  })
  await expect(row).toHaveCount(1)
  await expect(row.locator("td").nth(3)).toHaveText(
    desiredOrganizationsAdministrated
  )
  return row
    .locator("td:nth-child(5) a")
    .filter({ hasText: desiredSuperuserName })
}
async function validateUserCanEditUserForCurrentPage(page, canChangeName) {
  const editPersonButton = page.locator(".edit-person").first()
  await expect(editPersonButton).toBeVisible()
  await editPersonButton.click()
  if (canChangeName) {
    // The user can should be able to change the name
    await expect(
      page.locator('[name="familyName"]'),
      "Family name of a person should be enabled"
    ).toBeEnabled()
    await expect(
      page.locator('[name="givenName"]'),
      "Given name of a person should be enabled"
    ).toBeEnabled()
  }

  // Check that user can change the biography
  const bioTextArea = page.locator(".biography .editable").first()
  await expect
    .poll(async () => {
      const originalBioText = await bioTextArea.innerText()
      return originalBioText !== ""
    })
    .toBeTruthy()
  const originalBioText = (await bioTextArea.innerText())
    .replace(/\uFEFF/g, "")
    .trim()
  const fakeBioText = ` fake bio ${uuidv4()}`
  await new RichTextEditor(page, ".biography .editable").fill(
    `${originalBioText}\n${fakeBioText}`
  )
  await page.locator("#formBottomSubmit").click()
  await expect(page.locator(".alert").first()).toHaveText("Person saved")
  await expect(page.locator(".biography .editable").first()).toHaveText(
    `${originalBioText}\n${fakeBioText}`
  )
}
async function editAndSavePositionFromCurrentUserPage(page, validateTrue) {
  const positionName = page.locator(".position-name").first()
  await positionName.click()
  await validationEditPositionOnCurrentPage(page, validateTrue)
}
async function validationEditPositionOnCurrentPage(page, validateTrue) {
  const editButton = page.locator(".edit-position").first()
  await expect(editButton).toBeVisible()
  await editButton.click()
  await page.locator("#formBottomSubmit").click()
  if (validateTrue) {
    await expect(page.locator(".alert").first()).toHaveText("Position saved")
  } else {
    await expect(page.locator(".alert").first()).toHaveText(
      "Forbidden: Exception while fetching data (/updatePosition) : You do not have permissions to do this"
    )
  }
}
async function validateSuperuserNonAdministratingOrgPermissions(page) {
  await expect(
    page.locator("#editButton"),
    "Superusers should not be able to edit non-administrating organizations"
  ).toHaveCount(0)
}
async function validateAdminOrgPermissions(page) {
  const editOrgButton = page.locator("#editButton").first()
  await expect(editOrgButton).toBeVisible()
  await editOrgButton.click()
  await expect(
    page.locator("#parentOrg"),
    "Field parentOrganization of an organization should be enabled for admins"
  ).toBeEnabled()
  await expect(
    page.locator("#shortName"),
    "Field shortName of an organization should be enabled for admins"
  ).toBeEnabled()
  await expect(
    page.locator("#longName"),
    "Field longName of an organization should be enabled for admins"
  ).toBeEnabled()
}
async function validateSuperuserLocationPermissions(page) {
  const editLocationButton = page.locator("#editButton").first()
  await expect(editLocationButton).toBeVisible()
  await editLocationButton.click()
  await expect(
    page.locator('[name="name"]'),
    "Field name of a location should be disabled for superusers"
  ).toBeDisabled()
  await expect(
    page.getByRole("radio", { name: "Active", exact: true }),
    "Field status of a location should be enabled for superusers"
  ).toBeEnabled()
}
async function validateAdminLocationPermissions(page) {
  const editLocationButton = page.locator("#editButton").first()
  await expect(editLocationButton).toBeVisible()
  await editLocationButton.click()
  await expect(
    page.locator('[name="name"]'),
    "Field name of a location should be enabled for admins"
  ).toBeEnabled()
  await expect(
    page.getByRole("radio", { name: "Active", exact: true }),
    "Field status of a location should be enabled for admins"
  ).toBeEnabled()
}
async function getFromSearchResults(
  page,
  searchQuery,
  resultText,
  searchResultsType
) {
  const searchBar = page.locator("#searchBarInput").first()
  await searchBar.clear()
  await searchBar.pressSequentially(searchQuery)
  const searchBarSubmit = page.locator("#searchBarSubmit").first()
  await searchBarSubmit.click()
  const searchResultsIdentifier = ["locations"].includes(searchResultsType)
    ? `.${searchResultsType.slice(0, -1)}-collection`
    : `#${searchResultsType}-search-results`
  const link = page
    .locator(searchResultsIdentifier)
    .locator("td a")
    .filter({ hasText: new RegExp(`^${RegExp.escape(resultText)}$`) })
    .first()
  await expect(link).toBeVisible()
  return link
}
test("checking superuser that can create top-level organizations permissions", async ({
  page
}) => {
  const login = new LoginPage(page)
  await login.login("/", "jim")

  // Jim can create top-level organizations
  await canCreateOrganization(page)
  // but Jim can not edit organizations
  const nonAdministratingOrgLink = await getFromSearchResults(
    page,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await nonAdministratingOrgLink.click()
  await validateSuperuserNonAdministratingOrgPermissions(page)
  await login.logout()
})

test("checking superuser that can edit any organizations permissions", async ({
  page
}) => {
  const login = new LoginPage(page)
  await login.login("/", "billie")

  // Billie can create top-level organizations
  await canCreateOrganization(page)
  // And she can also edit any organization
  const nonAdministratingOrgLink = await getFromSearchResults(
    page,
    "MoD",
    "MoD | Ministry of Defense",
    "organizations"
  )
  await nonAdministratingOrgLink.click()
  await validateAdminOrgPermissions(page)
  await login.logout()
})
async function canCreateOrganization(page) {
  const createButton = page.locator("#createButton").first()
  await createButton.click()
  const createOrganizationButton = page.locator("#new-organization").first()
  await createOrganizationButton.click()
  const organizationInput = page.locator("#shortName").first()
  await expect(organizationInput).toBeVisible()

  // Cancel Create Organization
  const cancelButton = page
    .getByRole("button", { name: "Cancel", exact: true })
    .first()
  await cancelButton.click()
}
test("checking superuser that can create top-level tasks permissions", async ({
  page
}) => {
  const login = new LoginPage(page)
  await login.login("/", "jim")

  // Jim can create top-level tasks
  await canCreateTask(page)
  // but Jim can not edit tasks
  const notResponsibleForTaskLink = await getFromSearchResults(
    page,
    "1.1.C",
    "1.1.C",
    "tasks"
  )
  await notResponsibleForTaskLink.click()
  await validateSuperuserNotResponsibleForTaskPermissions(page)
  await login.logout()
})

test("checking superuser that can edit any tasks permissions", async ({
  page
}) => {
  const login = new LoginPage(page)
  await login.login("/", "billie")

  // Billie can create top-level tasks
  await canCreateTask(page)
  // And she can also edit any task
  const notResponsibleForTaskLink = await getFromSearchResults(
    page,
    "1.1.C",
    "1.1.C",
    "tasks"
  )
  await notResponsibleForTaskLink.click()
  await validateSuperuserResponsibleForTaskPermissions(page)
  await login.logout()
})
async function validateSuperuserNotResponsibleForTaskPermissions(page) {
  await expect(
    page.locator("#editButton"),
    "Superusers should not be able to edit not-responsible-for tasks"
  ).toHaveCount(0)
}
async function validateSuperuserResponsibleForTaskPermissions(page) {
  const editTaskButton = page.locator("#editButton").first()
  await expect(editTaskButton).toBeVisible()
  await editTaskButton.click()
  await expect(
    page.locator("#parentTask"),
    "Field parentTask of a task should be enabled for admins"
  ).toBeEnabled()
  await expect(
    page.locator("#shortName"),
    "Field shortName of a task should be enabled for admins"
  ).toBeEnabled()
  await expect(
    page.locator("#longName"),
    "Field longName of a task should be enabled for admins"
  ).toBeEnabled()
}
async function canCreateTask(page) {
  const createButton = page.locator("#createButton").first()
  await createButton.click()
  const createTaskButton = page.locator("#new-objective").first()
  await createTaskButton.click()
  const taskInput = page.locator("#shortName").first()
  await expect(taskInput).toBeVisible()

  // Cancel Create Task
  const cancelButton = page
    .getByRole("button", { name: "Cancel", exact: true })
    .first()
  await cancelButton.click()
}
