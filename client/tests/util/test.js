let path = require("path")
let { URL } = require("url")
let test = require("ava")
let webdriver = require("selenium-webdriver")
let { By, until, Key } = webdriver
let moment = require("moment")
let _includes = require("lodash/includes")
let _isRegExp = require("lodash/isRegExp")
let chalk = require("chalk")

let capabilities = {}
let testEnv = (process.env.CI && "remote") || process.env.TEST_ENV || "local"
if (testEnv === "local") {
  // This gives us access to send Chrome commands.
  require("chromedriver")
} else {
  // Set capabilities for BrowserStack
  require("./keep-alive.js")
  capabilities = require("../../config/browserstack.config.js")
}

// Webdriver's promise manager only made sense before Node had async/await support.
// Now it's a deprecated legacy feature, so we should use the simpler native Node support instead.
webdriver.promise.USE_PROMISE_MANAGER = false

console.log(
  chalk.bold.cyan(
    `These tests assume that you have recently run ${path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "insertSqlBaseData.sql"
    )} on your SQLServer instance`
  )
)

function debugLog(...args) {
  if (process.env.DEBUG_LOG === "true") {
    console.log(chalk.grey("[DEBUG]"), ...args)
  }
}

// We use the before hook to put helpers on t.context and set up test scaffolding.
test.beforeEach(t => {
  let builder = new webdriver.Builder()
  if (testEnv === "local") {
    let chrome = require("selenium-webdriver/chrome")
    builder = builder
      .forBrowser("chrome")
      .setChromeOptions(new chrome.Options().headless())
  } else {
    capabilities.name = t.title.replace(/^beforeEach hook for /, "")
    builder = builder
      .usingServer("http://hub-cloud.browserstack.com/wd/hub")
      .withCapabilities(capabilities)
  }
  t.context.driver = builder.build()

  let shortWaitMs = moment.duration(1, "seconds").asMilliseconds()
  let mediumWaitMs = moment.duration(3, "seconds").asMilliseconds()
  let longWaitMs = moment.duration(9, "seconds").asMilliseconds()

  t.context.By = By
  t.context.until = until
  t.context.shortWaitMs = shortWaitMs
  t.context.mediumWaitMs = mediumWaitMs
  t.context.longWaitMs = longWaitMs
  t.context.Key = Key

  // This method is a helper so we don't have to keep repeating the hostname.
  // Passing the authentication through the querystring is a hack so we can
  // pass the information along via window.fetch.
  t.context.get = async(pathname, userPw) => {
    let credentials = userPw || "erin"
    let urlToGet = `${
      process.env.SERVER_URL
    }${pathname}?user=${credentials}&pass=${credentials}`
    debugLog("Getting URL", urlToGet)
    await t.context.driver.get(urlToGet)

    // If we have a page-wide error message, we would like to cleanly fail the test on that.
    try {
      await t.context.driver.wait(
        until.elementTextIs(
          await t.context.$(".not-found-text", shortWaitMs),
          "There was an error processing this request. Please contact an administrator."
        ),
        shortWaitMs
      )
      throw new Error(
        "The API returned a 500. Do you need to restart the server?"
      )
    } catch (e) {
      // NoSuchElementError: If we didn't find the "not found text" element, then we are not seeing a page-wide failure.
      // StaleElementReferenceError: If we found the "not found text" element but it's no longer on the page,
      //      then we are not seeing a page-wide failure.
      // TimeoutError: If we found the "not found text" element, but the text was never the backend error message,
      //      then we are not seeing a page-wide failure.
      if (
        !_includes(
          ["NoSuchElementError", "StaleElementReferenceError", "TimeoutError"],
          e.name
        )
      ) {
        throw e
      }
    }
  }

  // For debugging purposes.
  t.context.waitForever = async() => {
    console.log(chalk.red("Waiting forever so you can debug..."))
    await t.context.driver.wait(() => {})
  }

  t.context.$ = async(cssSelector, timeoutMs) => {
    debugLog(`Find element: $('${cssSelector}')`)
    let waitTimeoutMs = timeoutMs || longWaitMs
    let locator = By.css(cssSelector)
    await t.context.driver.wait(
      until.elementLocated(locator),
      waitTimeoutMs,
      `Could not find element by css selector ${cssSelector} within ${waitTimeoutMs} milliseconds`
    )
    return t.context.driver.findElement(locator)
  }
  t.context.$$ = async(cssSelector, timeoutMs) => {
    debugLog(`Find elements: $$('${cssSelector}')`)
    let waitTimeoutMs = timeoutMs || longWaitMs
    let locator = By.css(cssSelector)
    await t.context.driver.wait(
      until.elementsLocated(locator),
      waitTimeoutMs,
      `Could not find elements by css selector ${cssSelector} within ${waitTimeoutMs} milliseconds`
    )
    return t.context.driver.findElements(locator)
  }

  // A helper method to combine waiting for an element to have rendered and then asserting on its contents.
  t.context.assertElementText = async(t, $elem, expectedText, message) => {
    try {
      let untilCondition = _isRegExp(expectedText)
        ? until.elementTextMatches($elem, expectedText)
        : until.elementTextIs($elem, expectedText)

      await t.context.driver.wait(untilCondition, longWaitMs)
    } catch (e) {
      // If we got a TimeoutError because the element did not have the text we expected, just swallow it here
      // and let the assertion on blow up instead. That will produce a clearer error message.
      if (e.name !== "TimeoutError") {
        throw e
      }
    }
    let actualText = (await $elem.getText()).trim()
    if (_isRegExp(expectedText)) {
      t.regex(actualText, expectedText, actualText, message)
    } else {
      t.is(actualText, expectedText, message)
    }
  }

  t.context.assertElementTextIsInt = (t, $elem, message) =>
    t.context.assertElementText(t, $elem, /^\d+$/)

  t.context.assertElementNotPresent = async(
    t,
    cssSelector,
    message,
    timeoutMs
  ) => {
    let waitTimeoutMs = timeoutMs || longWaitMs
    try {
      await t.context.driver.wait(
        async() => {
          try {
            return !(await t.context.$(cssSelector, waitTimeoutMs))
          } catch (e) {
            // Hilariously, when Selenium can't find an element, sometimes it throws TimeoutError,
            // and sometimes it throws NoSuchElementError.
            if (e.name === "TimeoutError" || e.name === "NoSuchElementError") {
              return true
            }
            throw e
          }
        },
        waitTimeoutMs,
        `Element was still present after ${waitTimeoutMs} milliseconds`
      )
    } catch (e) {
      if (e.name === "TimeoutError") {
        t.fail(
          `Element with css selector '${cssSelector}' was still present after ${waitTimeoutMs} milliseconds: ${message}`
        )
      } else {
        throw e
      }
    }
    t.pass(message || "Element was not present")
  }

  // A helper method to combine waiting for an element to have rendered and then asserting on its enabled status
  t.context.assertElementEnabled = async(
    t,
    cssSelector,
    message,
    timeoutMs
  ) => {
    let waitTimeoutMs = timeoutMs || longWaitMs
    try {
      var elem = await t.context.$(cssSelector, waitTimeoutMs)
    } catch (e) {
      // If we got a TimeoutError because the element did not load, just swallow it here
      // and let the assertion on blow up instead. That will produce a clearer error message.
      if (e.name !== "TimeoutError") {
        throw e
      }
    }
    t.is(await elem.isEnabled(), true, message)
  }

  // A helper method to combine waiting for an element to have rendered and then asserting it's disabled status
  t.context.assertElementDisabled = async(
    t,
    cssSelector,
    message,
    timeoutMs
  ) => {
    let waitTimeoutMs = timeoutMs || longWaitMs
    try {
      var elem = await t.context.$(cssSelector, waitTimeoutMs)
    } catch (e) {
      // If we got a TimeoutError because the element did not load, just swallow it here
      // and let the assertion on blow up instead. That will produce a clearer error message.
      if (e.name !== "TimeoutError") {
        throw e
      }
    }
    t.is(await elem.isEnabled(), false, message)
  }

  t.context.getCurrentPathname = async() => {
    let currentUrl = await t.context.driver.getCurrentUrl()
    return new URL(currentUrl).pathname
  }

  t.context.pageHelpers = {
    async goHomeAndThenToReportsPage() {
      await t.context.get("/")

      let $createButton = await t.context.$("#createButton")
      await $createButton.click()
    },
    async clickTodayButton() {
      let $todayButton = await t.context.driver.findElement(
        By.xpath('//button/span[text()="Today"]')
      )
      await $todayButton.click()
    },
    async chooseAdvancedSelectOption(inputSelector, text) {
      const popoverSelector = `${inputSelector}-popover`
      let $advancedSelectInput = await t.context.$(inputSelector)
      await $advancedSelectInput.sendKeys(text)
      await t.context.driver.sleep(shortWaitMs) // give the advanced select some time to send the request (debounce!)
      let $advancedSelectSuggestion = await t.context.$(
        `${popoverSelector} tbody tr:first-child td input`
      )
      await $advancedSelectSuggestion.click()
      return $advancedSelectInput
    },
    async writeInForm(inputSelector, text) {
      let $meetingGoalInput = await t.context.$(inputSelector)
      await $meetingGoalInput.sendKeys(text)
    },
    async assertReportShowStatusText(t, text) {
      await t.context.assertElementText(
        t,
        await t.context.$(".report-show h4"),
        text
      )
    },
    async clickMyOrgLink() {
      let $myOrgLink = await t.context.$("#my-organization")
      await t.context.driver.wait(t.context.until.elementIsVisible($myOrgLink))
      await $myOrgLink.click()
    },
    async clickFormBottomSubmit() {
      let $formBottomSubmit = await t.context.$("#formBottomSubmit")
      await t.context.driver.wait(
        t.context.until.elementIsVisible($formBottomSubmit)
      )
      await $formBottomSubmit.click()
    },
    async clickPersonNameFromSupportedPositionsFieldset(personName) {
      let $supportedPositionsRows = await t.context.$$(
        "#supportedPositions table tbody tr"
      )
      for (let $row of $supportedPositionsRows) {
        let [$billetCell, $advisorCell] = await $row.findElements(By.css("td"))
        await $billetCell.getText()
        let advisorText = await $advisorCell.getText()

        if (advisorText === personName) {
          await t.context.driver.wait(until.elementIsVisible($advisorCell))
          let $advisorLink = await $advisorCell.findElement(By.css("a"))
          await $advisorLink.click()
          await t.context.driver.wait(until.stalenessOf($advisorLink))
          return
        }
      }
      t.fail(
        `Could not find a row with person name = '${personName}'` +
          "in the supported positions table. " +
          "Please fix the database to be the way this test expects."
      )
    }
  }
})

// Shut down the browser when we are done.
test.afterEach.always(async t => {
  if (t.context.driver) {
    await t.context.driver.quit()
  }
})

/**
 * Technically speaking, everything should be wrapped in a wait() block to give
 * the the browser time to run JS to update the page. In practice, this does not
 * always seem to be necessary, since the JS can run very fast. If the tests are flaky,
 * this would be a good thing to investigate.
 *
 * Also, I suspect that we may see a bunch of stale element errors as React replaces
 * DOM nodes. To fix this, we should use a model of passing around CSS selectors instead
 * of element references, and always query for the element at the last possible moment.
 */

module.exports = test
module.exports.debugLog = debugLog
