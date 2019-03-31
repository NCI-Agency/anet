let test = require("../util/test")

test("Move someone in and out of a position", async t => {
  t.plan(9)

  let {
    $,
    $$,
    assertElementText,
    By,
    until,
    shortWaitMs,
    mediumWaitMs
  } = t.context

  await t.context.get("/", "rebecca")

  await t.context.pageHelpers.clickMyOrgLink()

  let positionName = "EF 2.2 Advisor D"
  let person = "ERINSON, Erin"
  let rank = "CIV"
  let personName = rank + " " + person

  await t.context.pageHelpers.clickPersonNameFromSupportedPositionsFieldset(
    personName,
    positionName
  )
  await t.context.driver.sleep(mediumWaitMs) // wait for transition

  let $changeAssignedPositionButton = await $("button.change-assigned-position")
  await t.context.driver.wait(
    until.elementIsVisible($changeAssignedPositionButton)
  )
  await $changeAssignedPositionButton.click()
  await t.context.driver.sleep(shortWaitMs) // wait for dialog to appear

  let $removePersonButton = await $("button.remove-person-from-position")
  await t.context.driver.wait(until.elementIsVisible($removePersonButton))
  await $removePersonButton.click()
  await t.context.driver.wait(until.stalenessOf($removePersonButton))
  await t.context.driver.sleep(mediumWaitMs) // wait (a bit longer) for dialog to disappear

  let $notAssignedMsg = await $("p.not-assigned-to-position-message")
  await t.context.driver.wait(until.elementIsVisible($notAssignedMsg))
  await assertElementText(
    t,
    $notAssignedMsg,
    "ERINSON, Erin is not assigned to a position."
  )

  await t.context.pageHelpers.clickMyOrgLink()

  let $vacantPositionRows = await $$("#vacantPositions table tbody tr")
  let $positionToFillCell
  for (let $row of $vacantPositionRows) {
    let [$billetCell, $advisorCell] = await $row.findElements(By.css("td"))
    let billetText = await $billetCell.getText()
    let advisorText = await $advisorCell.getText()

    if (billetText === positionName && advisorText === "Unfilled") {
      $positionToFillCell = $billetCell
      break
    }
  }

  if (!$positionToFillCell) {
    t.fail(`Could not find ${positionName} in the vacant positions table.`)
  }

  await t.context.driver.wait(until.elementIsVisible($positionToFillCell))
  let $positionToFillLink = await $positionToFillCell.findElement(By.css("a"))
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

  let $changeAssignedPersonButton = await $("button.change-assigned-person")
  await $changeAssignedPersonButton.click()
  await t.context.driver.sleep(shortWaitMs) // wait for dialog to appear

  let $assignedPerson = await t.context.pageHelpers.chooseAutocompleteOption(
    ".select-person-autocomplete",
    personName
  )
  t.is(
    await $assignedPerson.getAttribute("value"),
    person,
    "Clicking a person autocomplete suggestion populates the autocomplete field."
  )
  let $saveButton = await $("button.save-button")
  await $saveButton.click()
  await t.context.driver.wait(until.stalenessOf($saveButton))
  await t.context.driver.sleep(shortWaitMs) // wait for dialog to disappear

  await assertElementText(t, await $("h4.assigned-person-name"), personName)

  let $personLink = await $("h4.assigned-person-name a")
  await $personLink.click()
  await t.context.driver.sleep(mediumWaitMs) // wait for transition
  currentPathname = await t.context.getCurrentPathname()
  t.regex(
    currentPathname,
    /people\/[0-9a-f-]+/,
    "URL is updated to people/show page"
  )

  await assertElementText(t, await $(".position-name"), positionName)

  await t.context.pageHelpers.clickMyOrgLink()

  let $supportedPositionsRows = await $$("#supportedPositions table tbody tr")
  let foundCorrectRow = false
  for (let $row of $supportedPositionsRows) {
    let [$billetCell, $advisorCell] = await $row.findElements(By.css("td"))
    let billetText = await $billetCell.getText()
    let advisorText = await $advisorCell.getText()

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
