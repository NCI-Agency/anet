const test = require("../util/test")

test("Move someone in and out of a position", async t => {
  t.plan(11)

  const {
    $,
    $$,
    assertElementText,
    By,
    until,
    shortWaitMs,
    mediumWaitMs
  } = t.context

  await t.context.get("/", "rebecca")

  await t.context.pageHelpers.clickMenuLinksButton()
  await t.context.pageHelpers.clickMyOrgLink()

  const positionName = "EF 2.2 Advisor C"
  const person = "REINTON, Reina"
  const rank = "CIV"
  const personName = rank + " " + person

  await t.context.pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    personName,
    positionName
  )
  await t.context.driver.sleep(mediumWaitMs) // wait for transition

  const $changeAssignedPositionButton = await $(
    "button.change-assigned-position"
  )
  await t.context.driver.wait(
    until.elementIsVisible($changeAssignedPositionButton)
  )
  await $changeAssignedPositionButton.click()
  await t.context.driver.sleep(shortWaitMs) // wait for dialog to appear

  const $removePersonButton = await $("button.remove-person-from-position")
  await t.context.driver.wait(
    until.elementIsVisible($removePersonButton),
    mediumWaitMs
  )
  await $removePersonButton.click()
  await t.context.driver.wait(
    until.stalenessOf($removePersonButton),
    mediumWaitMs
  )
  await t.context.driver.sleep(mediumWaitMs) // wait (a bit longer) for dialog to disappear

  const $notAssignedMsg = await $("div#current-position")
  await t.context.driver.wait(
    until.elementIsVisible($notAssignedMsg),
    mediumWaitMs
  )
  await assertElementText(t, $notAssignedMsg, "<none>")

  await t.context.pageHelpers.clickMyOrgLink()

  const $vacantPositionRows = await $$("#vacantPositions table tbody tr")
  let $positionToFillCell
  for (const $row of $vacantPositionRows) {
    const [$billetCell, $advisorCell] = await $row.findElements(By.css("td"))
    const billetText = await $billetCell.getText()
    const advisorText = await $advisorCell.getText()

    if (billetText === positionName && advisorText === "Unfilled") {
      $positionToFillCell = $billetCell
      break
    }
  }

  if (!$positionToFillCell) {
    t.fail(`Could not find ${positionName} in the vacant positions table.`)
  }

  await t.context.driver.wait(
    until.elementIsVisible($positionToFillCell),
    mediumWaitMs
  )
  const $positionToFillLink = await $positionToFillCell.findElement(By.css("a"))
  await $positionToFillLink.click()
  let currentPathname = await t.context.getCurrentPathname()
  t.regex(
    currentPathname,
    /positions\/[0-9a-f-]+/,
    "URL is updated to positions/show page"
  )

  await assertElementText(
    t,
    await $(".legend .title-text"),
    `Position ${positionName}`
  )
  await assertElementText(
    t,
    await $(".position-empty-message"),
    `${positionName} is currently empty.`
  )

  const $changeAssignedPersonButton = await $("button.change-assigned-person")
  await $changeAssignedPersonButton.click()
  await t.context.driver.sleep(shortWaitMs) // wait for dialog to appear

  const $assignedPerson = await t.context.pageHelpers.chooseAdvancedSelectOption(
    "#person",
    person
  )
  t.is(
    await $assignedPerson.getAttribute("value"),
    person,
    "Clicking a person advanced single select widget suggestion populates the input field."
  )
  const $saveButton = await $("button.save-button")
  await $saveButton.click()
  await t.context.driver.wait(until.stalenessOf($saveButton), mediumWaitMs)
  await t.context.driver.sleep(shortWaitMs) // wait for dialog to disappear

  await assertElementText(t, await $("h4.assigned-person-name"), personName)

  const $personLink = await $("h4.assigned-person-name a")
  await $personLink.click()
  await t.context.driver.sleep(mediumWaitMs) // wait for transition
  currentPathname = await t.context.getCurrentPathname()
  t.regex(
    currentPathname,
    /people\/[0-9a-f-]+/,
    "URL is updated to people/show page"
  )

  await assertElementText(t, await $(".position-name"), positionName)

  // The change in position is also visible in the Previous positions
  const $previousPositionsRows = await $$("#previous-positions tbody tr")
  const $lastRow = $previousPositionsRows.pop()
  const [
    /* eslint-disable no-unused-vars */ $positionCell1 /* eslint-enable no-unused-vars */,
    $datesCell1
  ] = await $lastRow.findElements(By.css("td"))
  const datesCell1Text = await $datesCell1.getText()
  t.regex(datesCell1Text, /[0-9a-f\s]+-[\s]?/i, "Last cell has no end date")
  const $beforeLastRow = $previousPositionsRows.pop()
  const [
    /* eslint-disable no-unused-vars */ $positionCell2 /* eslint-enable no-unused-vars */,
    $datesCell2
  ] = await $beforeLastRow.findElements(By.css("td"))
  const datesCell2Text = await $datesCell2.getText()
  t.regex(
    datesCell2Text,
    /[0-9a-f\s]+-[0-9a-f\s]+/i,
    "One before last cell has an end date"
  )

  await t.context.pageHelpers.clickMyOrgLink()

  const $supportedPositionsRows = await $$("#supportedPositions table tbody tr")
  let foundCorrectRow = false
  for (const $row of $supportedPositionsRows) {
    const [$billetCell, $advisorCell] = await $row.findElements(By.css("td"))
    const billetText = await $billetCell.getText()
    const advisorText = await $advisorCell.getText()

    if (billetText === positionName && advisorText === personName) {
      foundCorrectRow = true
      break
    }
  }
  t.true(
    foundCorrectRow,
    `Could not find ${positionName} and ${personName} in the supported positions table`
  )
})

test("Update permissions while changing positions", async t => {
  t.plan(4)

  const {
    $,
    assertElementText,
    By,
    until,
    shortWaitMs,
    mediumWaitMs
  } = t.context

  const testUserMapper = {
    admin: 0,
    advisor_1: 1,
    advisor_2: 2,
    super_user_1: 3,
    super_user_2: 4
  }

  /* In order to grab the user and a specific attribute,
    follow the following format: testUsers[testUserMapper.reina].personName */
  const testUsers = [
    {
      positionName: "EF 5 Admin",
      person: "SCOTT, Michael",
      rank: "CIV",
      personName: "CIV SCOTT, Michael"
    },
    {
      positionName: "EF 5.1 Advisor Quality Assurance",
      person: "BRATTON, Creed",
      rank: "CIV",
      personName: "CIV BRATTON, Creed"
    },
    {
      positionName: "EF 5.1 Advisor Accounting",
      person: "MALONE, Kevin",
      rank: "CIV",
      personName: "CIV MALONE, Kevin"
    },
    {
      positionName: "EF 5.1 Super User Sales 1",
      person: "HALPERT, Jim",
      rank: "CIV",
      personName: "CIV HALPERT, Jim"
    },
    {
      positionName: "EF 5.1 Super User Sales 2",
      person: "SCHRUTE, Dwight",
      rank: "CIV",
      personName: "CIV SCHRUTE, Dwight"
    }
  ]

  // Helper function to navigate to the organization home page.
  async function navigateOrganization(orgName) {
    // Click on "Advisor Locations" dropdown menu.
    const advisorOrganizations = await t.context.driver.findElement(
      By.linkText("Advisor Organizations")
    )
    // Click on the dropdown menu button.
    await advisorOrganizations.click()
    // From the menu, select the desired organization.
    const organization = await t.context.driver.findElements(By.css("a"))
    for (const org of organization) {
      if ((await org.getText()) === orgName) {
        await org.click()
        await t.context.driver.sleep(mediumWaitMs)
        break
      }
    }
  }

  // Helper function to navigate to the sub-organization page.
  async function navigateSubOrganization(subOrgName) {
    // Navigate to sub organization
    const subOrganizationLink = await t.context.driver.findElement(
      By.linkText(subOrgName)
    )
    // Click on the link of desired sub organization.
    await subOrganizationLink.click()
    // Wait for page to translate.
    await t.context.driver.sleep(mediumWaitMs)
  }

  // Helper function to check if the user has the desired permission
  async function checkPermission(position, permission) {
    // Find a link which has the text of the position name of the specified user.
    const element = await t.context.driver.findElement(By.linkText(position))
    // Click on the position link.
    await element.click()
    // Grab the position information type from the position page.
    const $infoText = await $(
      "div.scroll-anchor-container div#fg-type div.form-control-plaintext"
    )
    // Wait until the information is displayed.
    await t.context.driver.wait(until.elementIsVisible($infoText), mediumWaitMs)
    // Assert if the position type is converted to "ANET User".
    await assertElementText(t, $infoText, permission)
  }

  // Login as rebecca (super_user).
  await t.context.get("/", "arthur")

  // ***********************************************
  // Removing a Super User from a position and check if the position is converted to ANET User.
  // ***********************************************

  await navigateOrganization("EF 5")
  await navigateSubOrganization("EF 5.1")

  // Click to the given advisor name from the "Supported positions" div.
  await t.context.pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    testUsers[testUserMapper.super_user_2].personName, // Dwight
    testUsers[testUserMapper.super_user_2].positionName // EF 5.1 Super User Sales 2
  )
  // Wait for transition.
  await t.context.driver.sleep(mediumWaitMs)
  // Grab the "Change position" button.
  let $changeAssignedPositionButton = await $("button.change-assigned-position")
  // Wait for the button to be displayed.
  await t.context.driver.wait(
    until.elementIsVisible($changeAssignedPositionButton)
  )
  // Click on the "Change position" button.
  await $changeAssignedPositionButton.click()
  // Wait for dialog to appear.
  await t.context.driver.sleep(shortWaitMs)
  // Grab the "Remove Person" button.
  let $removePersonButton = await $("button.remove-person-from-position")
  // Wait for button to be displayed.
  await t.context.driver.wait(
    until.elementIsVisible($removePersonButton),
    mediumWaitMs
  )
  // Click on the "Remove Person" button.
  await $removePersonButton.click()
  // Wait for button to be removed from the DOM.
  await t.context.driver.wait(
    until.stalenessOf($removePersonButton),
    mediumWaitMs
  )
  // Wait for transition.
  await t.context.driver.sleep(mediumWaitMs)
  // Grab the button which has the text "Save".
  let $saveButton = await t.context.driver.findElement(
    By.xpath('//button[text()="Save"]')
  )
  // Wait for button to be displayed.
  await t.context.driver.wait(until.elementIsVisible($saveButton), mediumWaitMs)
  // Click on the "Save" button.
  await $saveButton.click()
  // Wait until "Save" button is removed from the DOM.
  await t.context.driver.wait(until.stalenessOf($saveButton), mediumWaitMs)
  // Wait (a bit longer) for dialog to disappear
  await t.context.driver.sleep(mediumWaitMs)
  // Go back to organization page.
  await t.context.driver.navigate().back()
  // Wait for transition
  await t.context.driver.sleep(mediumWaitMs)

  await checkPermission(
    testUsers[testUserMapper.super_user_2].positionName,
    "ANET User"
  )

  // ***********************************************
  // Removing a ANET User from a position and check if the position remains as ANET User.
  // ***********************************************

  await navigateOrganization("EF 5")
  await navigateSubOrganization("EF 5.1")

  // Click to the given advisor name from the "Supported positions" div.
  await t.context.pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    testUsers[testUserMapper.advisor_2].personName, // Kevin
    testUsers[testUserMapper.advisor_2].positionName // EF 5.1 Advisor Accounting
  )
  // Wait for transition.
  await t.context.driver.sleep(mediumWaitMs)
  // Grab the "Change position" button.
  $changeAssignedPositionButton = await $("button.change-assigned-position")
  // Wait for the button to be displayed.
  await t.context.driver.wait(
    until.elementIsVisible($changeAssignedPositionButton)
  )
  // Click on the "Change position" button.
  await $changeAssignedPositionButton.click()
  // Wait for dialog to appear.
  await t.context.driver.sleep(shortWaitMs)
  // Grab the "Remove Person" button.
  $removePersonButton = await $("button.remove-person-from-position")
  // Wait for button to be displayed.
  await t.context.driver.wait(
    until.elementIsVisible($removePersonButton),
    mediumWaitMs
  )
  // Click on the "Remove Person" button.
  await $removePersonButton.click()
  // Wait for button to be removed from the DOM.
  await t.context.driver.wait(
    until.stalenessOf($removePersonButton),
    mediumWaitMs
  )
  // Wait for transition.
  await t.context.driver.sleep(mediumWaitMs)
  // Go back to organization page.
  await t.context.driver.navigate().back()
  // Wait for transition
  await t.context.driver.sleep(mediumWaitMs)

  await checkPermission(
    testUsers[testUserMapper.advisor_2].positionName,
    "ANET User"
  )

  // ***********************************************
  // Moving an ANET Super User to another position and check if new position permission is
  // converted to ANET Super User and old position permission is converted to ANET User.
  // ***********************************************

  await navigateOrganization("EF 5")
  await navigateSubOrganization("EF 5.1")

  // Grab the specified position from the DOM.
  const positionButton = await t.context.driver.findElement(
    By.linkText(testUsers[testUserMapper.advisor_1].positionName) // EF 5.1 Advisor Quality Assurance (Creed)
  )
  // Click on the position link.
  await positionButton.click()
  // Wait for the transition.
  await t.context.driver.sleep(mediumWaitMs)
  // Grab the change assigned person button.
  const changeAssignedPersonButton = await t.context.driver.findElement(
    By.xpath('//button[text()="Change assigned person"]')
  )
  // Click on the "Change assigned person" button.
  await changeAssignedPersonButton.click()
  // Wait for transition
  await t.context.driver.sleep(mediumWaitMs)
  // Grab the person input field
  const personInputField = await t.context.driver.findElement(
    By.css("input#person")
  )
  // Click on the input field
  await personInputField.click()
  // Wait for transition
  await t.context.driver.sleep(mediumWaitMs)
  // Find desired advisor from the list and click on the name.
  for (let i = 0; i < 4; i++) {
    const listItems = await t.context.driver.findElements(By.css("td"))
    for (const item of listItems) {
      if (
        (await item.getText()) ===
        testUsers[testUserMapper.super_user_1].personName // Jim
      ) {
        await item.click()
        await t.context.driver.sleep(mediumWaitMs)
        break
      }
    }
    // Grab pagination buttons
    const pagination = await t.context.driver.findElements(By.css("span"))
    for (const item of pagination) {
      if ((await item.getText()) === "›") {
        await item.click()
        await t.context.driver.sleep(mediumWaitMs)
        break
      }
    }
  }
  $saveButton = await t.context.driver.findElement(
    By.xpath('//button[text()="Save"]')
  )
  // Click on the save button
  await $saveButton.click()
  // Wait for the transition
  await t.context.driver.sleep(mediumWaitMs)
  // Grab the position information type from the position page.
  const $infoText = await $(
    "div.scroll-anchor-container div#fg-type div.form-control-plaintext"
  )
  // Wait until the information is displayed.
  await t.context.driver.wait(until.elementIsVisible($infoText), mediumWaitMs)
  // Assert if the position type is converted to "ANET Super User".
  await assertElementText(t, $infoText, "ANET Super User")
  // Go back to organization page.
  await t.context.driver.navigate().back()
  // Wait for transition.
  await t.context.driver.sleep(mediumWaitMs)

  await checkPermission(
    testUsers[testUserMapper.super_user_1].positionName,
    "ANET User"
  )
})
