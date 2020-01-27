const test = require("../util/test")

// Ava provides a nice ability to run tests in parallel, but we need to run these tests
// synchronously because too much parallel activity causes webdriver to throw EPIPE errors.

test("Home Page", async t => {
  // We can use t.plan() to indicate how many assertions we plan to make.
  // This provides safety in case there's a silent failure and the test
  // looks like it exited successfully, when in fact it just died. I've
  // seen people get bit by that a done with frameworks like Mocha which
  // do not offer test planning.
  t.plan(7)

  const {
    assertElementText,
    assertElementNotPresent,
    assertElementTextIsInt,
    $,
    $$,
    shortWaitMs
  } = t.context

  await t.context.get("/")

  // Use a CSS selector to find an element that we care about on the page.
  const [
    $draftReports,
    $reportsPending,
    $orgReports,
    $plannedEngagements,
    $sensitiveInfo
  ] = await $$(".home-tile h1")

  await assertElementTextIsInt(t, $reportsPending)
  await assertElementTextIsInt(t, $draftReports)
  await assertElementTextIsInt(t, $orgReports)
  await assertElementTextIsInt(t, $plannedEngagements)
  await assertElementTextIsInt(t, $sensitiveInfo)

  const $tourLauncher = await $(".persistent-tour-launcher")
  await $tourLauncher.click()
  const $hopscotchTitle = await $(".hopscotch-title")
  await assertElementText(
    t,
    $hopscotchTitle,
    "Welcome",
    "Clicking the hopscotch launch button starts the hopscotch tour"
  )

  const $hopscotchNext = await $(".hopscotch-next")
  await $hopscotchNext.click()

  const $myReportsLink = await $("#leftNav > li:nth-child(3) > a")
  await $myReportsLink.click()
  await t.context.driver.sleep(shortWaitMs) // wait for transition
  await assertElementNotPresent(
    t,
    ".hopscotch-title",
    "Navigating to a new page clears the hopscotch tour",
    shortWaitMs
  )
})
