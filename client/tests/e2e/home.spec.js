import { test } from "./support.js"

test("Home Page", async ({ app }) => {
  const {
    assertElementText,
    assertElementNotPresent,
    assertElementTextIsInt,
    $,
    $$,
    shortWaitMs
  } = app
  await app.login("/")

  // Use a CSS selector to find an element that we care about on the page.
  const [
    $draftReports,
    $reportsPending,
    $orgReports,
    $plannedEngagements,
    $sensitiveInfo
  ] = await $$(".home-tile h1")
  await assertElementTextIsInt($reportsPending)
  await assertElementTextIsInt($draftReports)
  await assertElementTextIsInt($orgReports)
  await assertElementTextIsInt($plannedEngagements)
  await assertElementTextIsInt($sensitiveInfo)
  const $tourLauncher = await $(".persistent-tour-launcher")
  await $tourLauncher.click()
  const $guidedTourTitle = await $("div.react-joyride__tooltip h4")
  await assertElementText(
    $guidedTourTitle,
    "Welcome",
    "Clicking the launch button starts the Guided Tour"
  )
  const $guidedTourNext = await $("div.react-joyride__tooltip > div > button")
  await $guidedTourNext.click()
  const $guidedTourClose = await $('button[data-testid="button-close"]')
  await $guidedTourClose.click()
  await assertElementNotPresent(
    "div.react-joyride__tooltip",
    "Closing the dialog clears the Guided Tour",
    shortWaitMs
  )
  await app.logout()
})
