import { expect, test } from "@playwright/test"
import { AdvancedSelect } from "../components/AdvancedSelect.js"
import { LoginPage } from "../pages/LoginPage.js"
import { OrganizationPage } from "../pages/OrganizationPage.js"

// Position updates must stay in the same worker.
test.describe.configure({
  mode: "serial"
})

test("Move someone in and out of a position", async ({ page }) => {
  const login = new LoginPage(page)
  const organization = new OrganizationPage(page)
  // Login as rebecca (superuser).
  await login.login("/", "rebecca")
  await page.locator("#my-work").click()
  await organization.openMyOrganization()
  const positionName = "EF 2.2 Advisor C"
  const positionRole = "Member"
  const person = "Reina Reinton"
  const personName = "CIV Reina Reinton"
  await organization.openPerson(personName, positionName)
  const changeAssignedPositionButton = page
    .locator("button.change-assigned-position")
    .first()
  await expect(changeAssignedPositionButton).toBeVisible()
  // Move element into view

  await changeAssignedPositionButton.scrollIntoViewIfNeeded()
  await changeAssignedPositionButton.click()
  const removePersonButton = page
    .locator("button.remove-person-from-position")
    .first()
  await expect(removePersonButton).toBeVisible()
  await removePersonButton.click()
  await expect(removePersonButton).toBeHidden()
  const notAssignedMsg = page.locator("div#position").first()
  await expect(notAssignedMsg).toBeVisible()
  await expect(notAssignedMsg).toHaveText("<none>")
  await organization.openMyOrganization()
  const vacantPosition = organization.vacantPositions
    .filter({
      has: page
        .locator("td:first-child")
        .getByText(positionName, { exact: true })
    })
    .filter({
      has: page
        .locator("td:nth-child(2)")
        .getByText(positionRole, { exact: true })
    })
    .filter({
      has: page
        .locator("td:nth-child(3)")
        .getByText("Unfilled", { exact: true })
    })
  await vacantPosition.locator("td:first-child a").click()
  await expect(page, "URL is updated to positions/show page").toHaveURL(
    /\/positions\/[0-9a-f-]+/
  )
  await expect(page.locator(".legend .title-text").first()).toHaveText(
    `Position ${positionName}`
  )
  await expect(page.locator(".position-empty-message").first()).toHaveText(
    `${positionName} is currently empty.`
  )
  const assignCurrentPersonButton = page
    .locator("button.assign-current-person")
    .first()
  await assignCurrentPersonButton.click()
  const assignedPerson = await new AdvancedSelect(page, "#person").choose(
    person
  )
  await expect(
    assignedPerson,
    "Clicking a person advanced single select widget suggestion populates the input field."
  ).toHaveValue(person)
  const saveButton = page.locator("button.save-button").first()
  await saveButton.click()
  await expect(saveButton).toBeHidden()
  await expect(page.locator("h4.assigned-person-name").first()).toHaveText(
    personName
  )
  const personLink = page.locator("h4.assigned-person-name a").first()
  await personLink.click()
  await expect(page, "URL is updated to people/show page").toHaveURL(
    /\/people\/[0-9a-f-]+/
  )
  await expect(page.locator(".position-name").first()).toHaveText(positionName)

  // The change in position is also visible in the Previous positions
  const previousPositionsRows = page.locator("#previous-positions tbody tr")
  await expect(
    previousPositionsRows.last().locator("td").nth(1),
    "Last cell has no end date"
  ).toHaveText(/[0-9a-f\s]+-[\s]?/i)
  await expect(
    previousPositionsRows.nth(-2).locator("td").nth(1),
    "One before last cell has an end date"
  ).toHaveText(/[0-9a-f\s]+-[0-9a-f\s]+/i)
  await organization.openMyOrganization()
  const supportedPosition = organization.supportedPositions
    .filter({
      has: page
        .locator("td:first-child")
        .getByText(positionName, { exact: true })
    })
    .filter({
      has: page
        .locator("td:nth-child(2)")
        .getByText(positionRole, { exact: true })
    })
    .filter({
      has: page
        .locator("td:nth-child(3)")
        .getByText(personName, { exact: true })
    })
  await expect(supportedPosition).toHaveCount(1)
  await login.logout()
})

test("Update permissions while changing positions", async ({ page }) => {
  const organization = new OrganizationPage(page)
  const login = new LoginPage(page)
  const testUserMapper = {
    admin: 0,
    regular_1: 1,
    regular_2: 2,
    superuser_1: 3,
    superuser_2: 4
  }

  /* In order to grab the user and a specific attribute,
    follow the following format: testUsers[testUserMapper.reina].personName */
  const testUsers = [
    {
      positionName: "EF 5 Admin",
      person: "Michael Scott",
      rank: "CIV",
      personName: "CIV Michael Scott"
    },
    {
      positionName: "EF 5.1 Advisor Quality Assurance",
      person: "Creed Bratton ",
      rank: "CIV",
      personName: "CIV Creed Bratton"
    },
    {
      positionName: "EF 5.1 Advisor Accounting",
      person: "Kevin Malone",
      rank: "CIV",
      personName: "CIV Kevin Malone"
    },
    {
      positionName: "EF 5.1 Superuser Sales 1",
      person: "Jim Halpert",
      rank: "CIV",
      personName: "CIV Jim Halpert"
    },
    {
      positionName: "EF 5.1 Superuser Sales 2",
      person: "Dwight Schrute",
      rank: "CIV",
      personName: "CIV Dwight Schrute"
    }
  ]

  // Helper function to navigate to the organization home page.
  async function navigateOrganization(orgName) {
    // Click on "Top-Level Organizations" dropdown menu.
    const topLevelOrganizations = page
      .getByRole("button", {
        name: "Top-level Organizations",
        exact: true
      })
      .first()
    // Click on the dropdown menu button.
    await topLevelOrganizations.click()
    // From the menu, select the desired organization.
    await page
      .locator('a.dropdown-item[href^="/organizations/"]')
      .filter({ hasText: new RegExp(`^${RegExp.escape(orgName)}$`) })
      .click()
  }

  // Helper function to navigate to the sub-organization page.
  async function navigateSubOrganization(subOrgName) {
    // Navigate to sub organization
    const subOrganizationLink = page
      .locator("a")
      .filter({
        hasText: subOrgName
      })
      .first()
    // Click on the link of desired sub organization.
    await subOrganizationLink.click()
    // Wait for page to translate.
  }

  // Helper function to check if the user has the desired permission
  async function checkPermission(position, permission) {
    // Find a link which has the text of the position name of the specified user.
    const element = page
      .locator("a")
      .filter({
        hasText: position
      })
      .first()
    // Click on the position link.
    await element.click()
    // Grab the position information type from the position page.
    const infoText = page
      .locator(
        "div.scroll-anchor-container div#fg-type div.form-control-plaintext"
      )
      .first()
    // Wait until the information is displayed.
    await expect(infoText).toBeVisible()
    // Assert if the position type is converted to "Regular position".
    await expect(infoText).toHaveText(permission)
  }

  // Login as arthur (admin).
  await login.login("/", "arthur")
  // Wait until page is loaded

  // ***********************************************
  // Removing a Superuser from a position and check if the position is converted to Regular position.
  // ***********************************************

  await navigateOrganization("EF 5")
  await navigateSubOrganization("EF 5.1")

  // Click to the given position name from the "Supported positions" div.
  await organization.openPerson(
    testUsers[testUserMapper.superuser_2].personName,
    // Dwight
    testUsers[testUserMapper.superuser_2].positionName // EF 5.1 Superuser Sales 2
  )
  // Wait for transition.

  // Grab the "Change position" button.
  const changeAssignedPositionButton = page
    .locator("button.change-assigned-position")
    .first()
  // Wait for the button to be displayed.
  await expect(changeAssignedPositionButton).toBeVisible()
  // Move element into view

  await changeAssignedPositionButton.scrollIntoViewIfNeeded()
  // Click on the "Change position" button.
  await changeAssignedPositionButton.click()
  // Wait for dialog to appear.

  // Grab the "Remove Person" button.
  let removePersonButton = page
    .locator("button.remove-person-from-position")
    .first()
  // Wait for button to be displayed.
  await expect(removePersonButton).toBeVisible()
  // Click on the "Remove Person" button.
  await removePersonButton.click()
  // Wait for button to be removed from the DOM.
  await expect(removePersonButton).toBeHidden()
  // Wait for transition.

  // Grab the button which has the text "Save".
  let saveButton = page
    .getByRole("button", { name: "Save", exact: true })
    .first()
  // Wait for button to be displayed.
  await expect(saveButton).toBeVisible()
  // Click on the "Save" button.
  await saveButton.click()
  // Wait until "Save" button is removed from the DOM.
  await expect(saveButton).toBeHidden()
  // Wait (a bit longer) for dialog to disappear

  // Go back to organization page.
  await page.goBack()
  // Wait for transition

  await checkPermission(
    testUsers[testUserMapper.superuser_2].positionName,
    "Regular position"
  )

  // ***********************************************
  // Removing a Regular position from a position and check if the position remains as Regular position.
  // ***********************************************

  await navigateOrganization("EF 5")
  await navigateSubOrganization("EF 5.1")

  // Click to the given position name from the "Supported positions" div.
  await organization.openPerson(
    testUsers[testUserMapper.regular_2].personName,
    // Kevin
    testUsers[testUserMapper.regular_2].positionName // EF 5.1 Advisor Accounting
  )
  // Wait for transition.

  // Grab the "Change position" button.
  const changeAssignedPositionButton2 = page
    .locator("button.change-assigned-position")
    .first()
  // Wait for the button to be displayed.
  await expect(changeAssignedPositionButton2).toBeVisible()
  // Move element into view

  await changeAssignedPositionButton2.scrollIntoViewIfNeeded()
  // Click on the "Change position" button.
  await changeAssignedPositionButton2.click()
  // Wait for dialog to appear.

  // Grab the "Remove Person" button.
  removePersonButton = page
    .locator("button.remove-person-from-position")
    .first()
  // Wait for button to be displayed.
  await expect(removePersonButton).toBeVisible()
  // Click on the "Remove Person" button.
  await removePersonButton.click()
  // Wait for button to be removed from the DOM.
  await expect(removePersonButton).toBeHidden()
  // Wait for transition.

  // Go back to organization page.
  await page.goBack()
  // Wait for transition

  await checkPermission(
    testUsers[testUserMapper.regular_2].positionName,
    "Regular position"
  )

  // ***********************************************
  // Moving an ANET Superuser to another position and check if new position permission is
  // converted to ANET Superuser and old position permission is converted to Regular position.
  // ***********************************************

  await navigateOrganization("EF 5")
  await navigateSubOrganization("EF 5.1")

  // Grab the specified position from the DOM.
  const positionButton = page
    .locator("a")
    .filter({
      hasText: testUsers[testUserMapper.regular_1].positionName
    })
    .first()
  // Click on the position link.
  await positionButton.click()
  // Wait for the transition.

  const changeCurrentPersonButton = page
    .locator("button.change-current-person")
    .first()
  await changeCurrentPersonButton.click()
  // Wait for transition

  await new AdvancedSelect(page, "#person").choose(
    testUsers[testUserMapper.superuser_1].person
  )
  // Verify the option to Assign as additional position exists
  const saveButtonAdditional = page
    .getByRole("button", { name: "Assign as additional position", exact: true })
    .first()
  await expect(saveButtonAdditional).toBeVisible()
  // Click on the Assign as primary position button
  saveButton = page
    .getByRole("button", { name: "Assign as primary position", exact: true })
    .first()
  await saveButton.click()
  // Wait for the transition

  // Grab the position information type from the position page.
  const infoText = page
    .locator(
      "div.scroll-anchor-container div#fg-type div.form-control-plaintext"
    )
    .first()
  // Wait until the information is displayed.
  await expect(infoText).toBeVisible()
  // Assert if the position type is converted to "ANET Superuser".
  await expect(infoText).toHaveText("ANET Superuser")
  // Go back to organization page.
  await page.goBack()
  // Wait for transition.

  await checkPermission(
    testUsers[testUserMapper.superuser_1].positionName,
    "Regular position"
  )
  await login.logout()
})
