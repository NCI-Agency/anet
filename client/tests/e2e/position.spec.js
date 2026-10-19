import { expect, fail, test } from "./support.js"

// Position updates must stay in the same worker.
test.describe.configure({
  mode: "serial"
})
test("Move someone in and out of a position", async ({ app }) => {
  const { $, $$, assertElementText, mediumWaitMs } = app

  // Login as rebecca (superuser).
  await app.login("/", "rebecca")
  await app.pageHelpers.clickMenuLinksButton()
  await app.pageHelpers.clickMyOrgLink()
  const positionName = "EF 2.2 Advisor C"
  const positionRole = "Member"
  const person = "Reina Reinton"
  const personName = "CIV Reina Reinton"
  await app.pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    personName,
    positionName
  )

  const $changeAssignedPositionButton = await $(
    "button.change-assigned-position"
  )
  await expect($changeAssignedPositionButton).toBeVisible()
  // Move element into view

  await $changeAssignedPositionButton.scrollIntoViewIfNeeded()
  await $changeAssignedPositionButton.click()

  const $removePersonButton = await $("button.remove-person-from-position")
  await expect($removePersonButton).toBeVisible({
    timeout: mediumWaitMs
  })
  await $removePersonButton.click()
  await expect($removePersonButton).toBeHidden({
    timeout: mediumWaitMs
  })

  const $notAssignedMsg = await $("div#position")
  await expect($notAssignedMsg).toBeVisible({
    timeout: mediumWaitMs
  })
  await assertElementText($notAssignedMsg, "<none>")
  await app.pageHelpers.clickMyOrgLink()
  const $vacantPositionRows = await $$("#vacantPositions table tbody tr")
  let $positionToFillCell
  for (const $row of $vacantPositionRows) {
    const [$billetCell, $posRoleCell, $personCell] = await $row
      .locator("td")
      .all()
    const billetText = await $billetCell.innerText()
    const roleText = await $posRoleCell.innerText()
    const personText = await $personCell.innerText()
    if (
      billetText === positionName &&
      personText === "Unfilled" &&
      roleText === positionRole
    ) {
      $positionToFillCell = $billetCell
      break
    }
  }
  if (!$positionToFillCell) {
    fail(`Could not find ${positionName} in the vacant positions table.`)
  }
  await expect($positionToFillCell).toBeVisible({
    timeout: mediumWaitMs
  })
  const $positionToFillLink = await $positionToFillCell.locator("a").first()
  await $positionToFillLink.click()
  await expect(app.page, "URL is updated to positions/show page").toHaveURL(
    /\/positions\/[0-9a-f-]+/
  )
  await assertElementText(
    await $(".legend .title-text"),
    `Position ${positionName}`
  )
  await assertElementText(
    await $(".position-empty-message"),
    `${positionName} is currently empty.`
  )
  const $assignCurrentPersonButton = await $("button.assign-current-person")
  await $assignCurrentPersonButton.click()

  const $assignedPerson = await app.pageHelpers.chooseAdvancedSelectOption(
    "#person",
    person
  )
  await expect(
    $assignedPerson,
    "Clicking a person advanced single select widget suggestion populates the input field."
  ).toHaveValue(person)
  const $saveButton = await $("button.save-button")
  await $saveButton.click()
  await expect($saveButton).toBeHidden({
    timeout: mediumWaitMs
  })

  await assertElementText(await $("h4.assigned-person-name"), personName)
  const $personLink = await $("h4.assigned-person-name a")
  await $personLink.click()

  await expect(app.page, "URL is updated to people/show page").toHaveURL(
    /\/people\/[0-9a-f-]+/
  )
  await assertElementText(await $(".position-name"), positionName)

  // The change in position is also visible in the Previous positions
  const $previousPositionsRows = await $$("#previous-positions tbody tr")
  const $lastRow = $previousPositionsRows.pop()
  const [
    /* eslint-disable no-unused-vars */ $positionCell1 /* eslint-enable no-unused-vars */,
    $datesCell1
  ] = await $lastRow.locator("td").all()
  const datesCell1Text = await $datesCell1.innerText()
  expect(datesCell1Text, "Last cell has no end date").toMatch(
    /[0-9a-f\s]+-[\s]?/i
  )
  const $beforeLastRow = $previousPositionsRows.pop()
  const [
    /* eslint-disable no-unused-vars */ $positionCell2 /* eslint-enable no-unused-vars */,
    $datesCell2
  ] = await $beforeLastRow.locator("td").all()
  const datesCell2Text = await $datesCell2.innerText()
  expect(datesCell2Text, "One before last cell has an end date").toMatch(
    /[0-9a-f\s]+-[0-9a-f\s]+/i
  )
  await app.pageHelpers.clickMyOrgLink()
  const $supportedPositionsRows = await $$("#supportedPositions table tbody tr")
  let foundCorrectRow = false
  for (const $row of $supportedPositionsRows) {
    const [$billetCell, $posRoleCell, $personCell] = await $row
      .locator("td")
      .all()
    const billetText = await $billetCell.innerText()
    const roleText = await $posRoleCell.innerText()
    const personText = await $personCell.innerText()
    if (
      billetText === positionName &&
      personText === personName &&
      roleText === positionRole
    ) {
      foundCorrectRow = true
      break
    }
  }
  expect(
    foundCorrectRow,
    `Could not find ${positionName} and ${personName} in the supported positions table`
  ).toBe(true)
  await app.logout()
})
test("Update permissions while changing positions", async ({ app }) => {
  const { $, assertElementText, mediumWaitMs } = app
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
    const topLevelOrganizations = await app.page
      .getByRole("button", {
        name: "Top-level Organizations",
        exact: true
      })
      .first()
    // Click on the dropdown menu button.
    await topLevelOrganizations.click()
    // From the menu, select the desired organization.
    const organization = await app.page.locator("a").all()
    for (const org of organization) {
      if ((await org.innerText()) === orgName) {
        await org.click()
        break
      }
    }
  }

  // Helper function to navigate to the sub-organization page.
  async function navigateSubOrganization(subOrgName) {
    // Navigate to sub organization
    const subOrganizationLink = await app.page
      .locator("a")
      .filter({ hasText: subOrgName })
      .first()
    // Click on the link of desired sub organization.
    await subOrganizationLink.click()
    // Wait for page to translate.
  }

  // Helper function to check if the user has the desired permission
  async function checkPermission(position, permission) {
    // Find a link which has the text of the position name of the specified user.
    const element = await app.page
      .locator("a")
      .filter({ hasText: position })
      .first()
    // Click on the position link.
    await element.click()
    // Grab the position information type from the position page.
    const $infoText = await $(
      "div.scroll-anchor-container div#fg-type div.form-control-plaintext"
    )
    // Wait until the information is displayed.
    await expect($infoText).toBeVisible({
      timeout: mediumWaitMs
    })
    // Assert if the position type is converted to "Regular position".
    await assertElementText($infoText, permission)
  }

  // Login as arthur (admin).
  await app.login("/", "arthur")
  // Wait until page is loaded

  // ***********************************************
  // Removing a Superuser from a position and check if the position is converted to Regular position.
  // ***********************************************

  await navigateOrganization("EF 5")
  await navigateSubOrganization("EF 5.1")

  // Click to the given position name from the "Supported positions" div.
  await app.pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    testUsers[testUserMapper.superuser_2].personName,
    // Dwight
    testUsers[testUserMapper.superuser_2].positionName // EF 5.1 Superuser Sales 2
  )
  // Wait for transition.

  // Grab the "Change position" button.
  const $changeAssignedPositionButton = await $(
    "button.change-assigned-position"
  )
  // Wait for the button to be displayed.
  await expect($changeAssignedPositionButton).toBeVisible()
  // Move element into view

  await $changeAssignedPositionButton.scrollIntoViewIfNeeded()
  // Click on the "Change position" button.
  await $changeAssignedPositionButton.click()
  // Wait for dialog to appear.

  // Grab the "Remove Person" button.
  let $removePersonButton = await $("button.remove-person-from-position")
  // Wait for button to be displayed.
  await expect($removePersonButton).toBeVisible({
    timeout: mediumWaitMs
  })
  // Click on the "Remove Person" button.
  await $removePersonButton.click()
  // Wait for button to be removed from the DOM.
  await expect($removePersonButton).toBeHidden({
    timeout: mediumWaitMs
  })
  // Wait for transition.

  // Grab the button which has the text "Save".
  let $saveButton = await app.page
    .locator("xpath=" + '//button[text()="Save"]')
    .first()
  // Wait for button to be displayed.
  await expect($saveButton).toBeVisible({
    timeout: mediumWaitMs
  })
  // Click on the "Save" button.
  await $saveButton.click()
  // Wait until "Save" button is removed from the DOM.
  await expect($saveButton).toBeHidden({
    timeout: mediumWaitMs
  })
  // Wait (a bit longer) for dialog to disappear

  // Go back to organization page.
  await app.page.goBack()
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
  await app.pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    testUsers[testUserMapper.regular_2].personName,
    // Kevin
    testUsers[testUserMapper.regular_2].positionName // EF 5.1 Advisor Accounting
  )
  // Wait for transition.

  // Grab the "Change position" button.
  const $changeAssignedPositionButton2 = await $(
    "button.change-assigned-position"
  )
  // Wait for the button to be displayed.
  await expect($changeAssignedPositionButton2).toBeVisible()
  // Move element into view

  await $changeAssignedPositionButton2.scrollIntoViewIfNeeded()
  // Click on the "Change position" button.
  await $changeAssignedPositionButton2.click()
  // Wait for dialog to appear.

  // Grab the "Remove Person" button.
  $removePersonButton = await $("button.remove-person-from-position")
  // Wait for button to be displayed.
  await expect($removePersonButton).toBeVisible({
    timeout: mediumWaitMs
  })
  // Click on the "Remove Person" button.
  await $removePersonButton.click()
  // Wait for button to be removed from the DOM.
  await expect($removePersonButton).toBeHidden({
    timeout: mediumWaitMs
  })
  // Wait for transition.

  // Go back to organization page.
  await app.page.goBack()
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
  const positionButton = await app.page
    .locator("a")
    .filter({ hasText: testUsers[testUserMapper.regular_1].positionName })
    .first()
  // Click on the position link.
  await positionButton.click()
  // Wait for the transition.

  const $changeCurrentPersonButton = await $("button.change-current-person")
  await $changeCurrentPersonButton.click()
  // Wait for transition

  await app.pageHelpers.chooseAdvancedSelectOption(
    "#person",
    testUsers[testUserMapper.superuser_1].person
  )
  // Verify the option to Assign as additional position exists
  const $saveButtonAdditional = await app.page
    .locator("xpath=" + '//button[text()="Assign as additional position"]')
    .first()
  await expect($saveButtonAdditional).toBeVisible({
    timeout: mediumWaitMs
  })
  // Click on the Assign as primary position button
  $saveButton = await app.page
    .locator("xpath=" + '//button[text()="Assign as primary position"]')
    .first()
  await $saveButton.click()
  // Wait for the transition

  // Grab the position information type from the position page.
  const $infoText = await $(
    "div.scroll-anchor-container div#fg-type div.form-control-plaintext"
  )
  // Wait until the information is displayed.
  await expect($infoText).toBeVisible({
    timeout: mediumWaitMs
  })
  // Assert if the position type is converted to "ANET Superuser".
  await assertElementText($infoText, "ANET Superuser")
  // Go back to organization page.
  await app.page.goBack()
  // Wait for transition.

  await checkPermission(
    testUsers[testUserMapper.superuser_1].positionName,
    "Regular position"
  )
  await app.logout()
})
