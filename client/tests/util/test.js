const path = require("path")
const { URL } = require("url")
const test = require("ava")
const webdriver = require("selenium-webdriver")
const { By, until, Key, error } = webdriver
const moment = require("moment")
const _includes = require("lodash/includes")
const _isRegExp = require("lodash/isRegExp")

let capabilities
const testEnv =
  (process.env.GIT_TAG_NAME && "remote") || process.env.TEST_ENV || "local"
if (testEnv === "local") {
  // Set capabilities for local Chrome
  capabilities = webdriver.Capabilities.chrome()
} else {
  // Set capabilities for BrowserStack
  require("./keep-alive")
  capabilities = require("../../config/browserstack.config")
}

// Webdriver's promise manager only made sense before Node had async/await support.
// Now it's a deprecated legacy feature, so we should use the simpler native Node support instead.
webdriver.promise.USE_PROMISE_MANAGER = false

console.log(
  `These tests assume that you have recently run ${path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "insertBaseData-psql.sql"
  )} on your database instance`
)

function debugLog(...args) {
  if (process.env.DEBUG_LOG === "true") {
    console.debug("[DEBUG]", ...args)
  }
}

let bsLocal

test.before(async t => {
  if (testEnv !== "local") {
    const browserstack = require("browserstack-local")
    bsLocal = new browserstack.Local()
    const bsOptions = capabilities["bstack:options"]
    const bsLocalArgs = {
      force: true,
      forceLocal: true,
      onlyAutomate: true,
      key: bsOptions.accessKey,
      localIdentifier: bsOptions.localIdentifier
    }
    console.log("Starting BrowserStackLocal")
    await new Promise((resolve, reject) => {
      bsLocal.start(bsLocalArgs, error => {
        if (error) {
          console.error("Failed to start BrowserStackLocal:", error)
          reject(error)
        } else {
          console.log("Started BrowserStackLocal")
          resolve(bsLocal)
        }
      })
    })
  }
})

test.after.always(async t => {
  if (bsLocal) {
    console.log("Stopping BrowserStackLocal")
    await new Promise((resolve, reject) => {
      bsLocal.stop(error => {
        if (error) {
          console.error("Failed to stop BrowserStackLocal:", error)
          reject(error)
        } else {
          console.log("Stopped BrowserStackLocal")
          resolve(bsLocal)
        }
      })
    })
  }
})

// We use the before hook to put helpers on t.context and set up test scaffolding.
test.beforeEach(t => {
  let builder = new webdriver.Builder()
  if (testEnv === "local") {
    const chrome = require("selenium-webdriver/chrome")
    const options = new chrome.Options(capabilities)
      .setBrowserVersion("131") // or "stable"
      .addArguments([
        "--incognito",
        "--headless=old",
        "--disable-gpu",
        "--disable-search-engine-choice-screen",
        "--disable-dev-shm-usage",
        "--disable-browser-side-navigation",
        "--no-sandbox",
        "--window-size=1600,1200"
      ])
    builder = builder
      .forBrowser(webdriver.Browser.CHROME)
      .setChromeOptions(options)
      /*
       * If we don't explicitly define ServiceBuilder for ChromeDriver it uses a default ServiceBuilder
       * which is a singleton, shared amongst different driver instances. As a result, the same
       * ChromeDriver server process is used by different drivers. When driver.quit() is called by
       * one of the drivers, that process is terminated. As a result even though all assertions pass,
       * the afterEach.always hook reports intermittent errors. By explicitly defining a new ServiceBuilder
       * here we enforce the creation of a separate ChromeDriver server child process for each driver instance.
       */
      .setChromeService(new chrome.ServiceBuilder())
  } else {
    builder = builder
      .usingServer("http://hub.browserstack.com/wd/hub")
      .withCapabilities(capabilities)
  }
  t.context.driver = builder.build()

  const shortWaitMs = moment.duration(1, "seconds").asMilliseconds()
  const mediumWaitMs = moment.duration(3, "seconds").asMilliseconds()
  const longWaitMs = moment.duration(9, "seconds").asMilliseconds()

  t.context.By = By
  t.context.until = until
  t.context.shortWaitMs = shortWaitMs
  t.context.mediumWaitMs = mediumWaitMs
  t.context.longWaitMs = longWaitMs
  t.context.Key = Key

  // Work-around for bug in chromedriver; basically a copy of Selenium's until.stalenessOf(elem),
  // but with an extra check for NoSuchElementError
  t.context.untilStalenessOf = element => {
    return new webdriver.Condition("element to become stale", function () {
      return element.getTagName().then(
        function () {
          return false
        },
        function (e) {
          if (e instanceof error.StaleElementReferenceError) {
            return true
          }
          if (e instanceof error.NoSuchElementError) {
            // https://bugs.chromium.org/p/chromedriver/issues/detail?id=4440
            console.warn(
              "Got NoSuchElementError, treating it like StaleElementReferenceError"
            )
            return true
          }
          throw e
        }
      )
    })
  }

  // This method is a helper so we don't have to keep repeating the hostname.
  t.context.get = async (pathname, userPw) => {
    const credentials = userPw || "erin"
    const urlToGet = `${process.env.SERVER_URL}${pathname}`
    debugLog("Getting URL", urlToGet, "as", credentials)
    await t.context.driver.get(urlToGet)
    await t.context.$("#kc-form-login", shortWaitMs)
    await t.context.pageHelpers.writeInForm("#username", credentials)
    await t.context.pageHelpers.writeInForm("#password", credentials)
    const $loginFormSubmitButton = await t.context.$("#kc-login")
    await $loginFormSubmitButton.click()
    await t.context.waitForLoadingFinished()

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

  t.context.waitForLoadingFinished = async () => {
    await t.context.assertElementNotPresent(
      t,
      "div.loader",
      "Loading indicator should disappear",
      mediumWaitMs
    )
  }

  t.context.logout = async () => {
    const urlToGet = `${process.env.SERVER_URL}/api/logout`
    debugLog("Logging out via URL", urlToGet)
    await t.context.driver.get(urlToGet)
    await t.context.driver.sleep(t.context.shortWaitMs)
    const $logoutFormSubmitButton = await t.context.$("#kc-logout")
    await $logoutFormSubmitButton.click()
  }

  // For debugging purposes.
  t.context.waitForever = async () => {
    console.log("Waiting forever so you can debug…")
    await t.context.driver.wait(() => {})
  }

  t.context.$ = async (cssSelector, timeoutMs) => {
    debugLog(`Find element: $('${cssSelector}')`)
    const waitTimeoutMs = timeoutMs || longWaitMs
    const locator = By.css(cssSelector)
    await t.context.driver.wait(
      until.elementLocated(locator),
      waitTimeoutMs,
      `Could not find element by css selector ${cssSelector} within ${waitTimeoutMs} milliseconds`
    )
    return t.context.driver.findElement(locator)
  }
  t.context.$$ = async (cssSelector, timeoutMs) => {
    debugLog(`Find elements: $$('${cssSelector}')`)
    const waitTimeoutMs = timeoutMs || longWaitMs
    const locator = By.css(cssSelector)
    await t.context.driver.wait(
      until.elementsLocated(locator),
      waitTimeoutMs,
      `Could not find elements by css selector ${cssSelector} within ${waitTimeoutMs} milliseconds`
    )
    return t.context.driver.findElements(locator)
  }

  // A helper method to combine waiting for an element to have rendered and then asserting on its contents.
  t.context.assertElementText = async (t, $elem, expectedText, message) => {
    try {
      const untilCondition = _isRegExp(expectedText)
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
    const actualText = (await $elem.getText()).trim()
    if (_isRegExp(expectedText)) {
      t.regex(actualText, expectedText, actualText, message)
    } else {
      t.is(actualText, expectedText, message)
    }
  }

  t.context.assertElementTextIsInt = (t, $elem, message) =>
    t.context.assertElementText(t, $elem, /^\d+$/)

  t.context.assertElementNotPresent = async (
    t,
    cssSelector,
    message,
    timeoutMs
  ) => {
    const waitTimeoutMs = timeoutMs || longWaitMs
    try {
      await t.context.driver.wait(
        async () => {
          const loopDelay = 250
          try {
            return !(await t.context.$(cssSelector, loopDelay))
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
  t.context.assertElementEnabled = async (
    t,
    cssSelector,
    message,
    timeoutMs
  ) => {
    const waitTimeoutMs = timeoutMs || longWaitMs
    let elem
    try {
      elem = await t.context.$(cssSelector, waitTimeoutMs)
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
  t.context.assertElementDisabled = async (
    t,
    cssSelector,
    message,
    timeoutMs
  ) => {
    const waitTimeoutMs = timeoutMs || longWaitMs
    let elem
    try {
      elem = await t.context.$(cssSelector, waitTimeoutMs)
    } catch (e) {
      // If we got a TimeoutError because the element did not load, just swallow it here
      // and let the assertion on blow up instead. That will produce a clearer error message.
      if (e.name !== "TimeoutError") {
        throw e
      }
    }
    t.is(await elem.isEnabled(), false, message)
  }

  t.context.getCurrentPathname = async () => {
    const currentUrl = await t.context.driver.getCurrentUrl()
    return new URL(currentUrl).pathname
  }

  t.context.pageHelpers = {
    async goHomeAndThenToReportsPage() {
      await t.context.get("/")

      const $createButton = await t.context.$("#createButton")
      await $createButton.click()
    },
    async clickTodayButton() {
      const $todayButton = await t.context.driver.findElement(
        By.xpath('//button/span[text()="Today"]')
      )
      await $todayButton.click()
    },
    async clickNextMonthDate() {
      const $nextMonthButton = await t.context.driver.findElement(
        By.xpath('//button/span[icon="chevron-right"]')
      )
      await $nextMonthButton.click()
      const $nextMonthDate = await t.context.driver.findElement(
        By.xpath('//div[class="DayPicker-Day--selected"]')
      )
      await $nextMonthDate.click()
    },
    async chooseAdvancedSelectOption(inputSelector, text, rowNumber = 1) {
      const popoverSelector = `${inputSelector}-popover`
      const $advancedSelectInput = await t.context.$(inputSelector)
      await $advancedSelectInput.click()
      await $advancedSelectInput.sendKeys(text)
      await t.context.driver.sleep(shortWaitMs) // give the advanced select some time to send the request (debounce!)
      t.context.waitForLoadingFinished()
      const $advancedSelectSuggestion = await t.context.$(
        `${popoverSelector} tbody tr:nth-child(${rowNumber}) td:first-child input`
      )
      // Move element into view
      const actions = t.context.driver.actions({ async: true })
      await actions.move({ origin: $advancedSelectSuggestion }).perform()
      await $advancedSelectSuggestion.click()
      return $advancedSelectInput
    },
    async writeInForm(inputSelector, text, delay) {
      const $meetingGoalInput = await t.context.$(inputSelector)
      await $meetingGoalInput.sendKeys(text)
      if (delay) {
        await t.context.driver.sleep(delay) // wait e.g. for Slate to save the editor contents
      }
    },
    async assertReportShowStatusText(t, text) {
      await t.context.assertElementText(
        t,
        await t.context.$(".report-show h4"),
        text
      )
    },
    async clickMenuLinksButton() {
      const $menuLinksButton = await t.context.$(
        "#leftNav div:nth-child(3) > a"
      )
      await t.context.driver.wait(
        t.context.until.elementIsVisible($menuLinksButton)
      )
      await $menuLinksButton.click()
    },
    async clickMyOrgLink() {
      const $myOrgLink = await t.context.$('a[href*="/organizations/"]')
      await t.context.driver.wait(t.context.until.elementIsVisible($myOrgLink))
      await $myOrgLink.click()
      await t.context.waitForLoadingFinished()
    },
    async clickFormBottomSubmit() {
      const $formBottomSubmit = await t.context.$("#formBottomSubmit")
      await t.context.driver.wait(
        t.context.until.elementIsVisible($formBottomSubmit)
      )
      await $formBottomSubmit.click()
    },
    async clickPersonNameFromSupportedPositionsFieldset(personName) {
      const $supportedPositionsRows = await t.context.$$(
        "#supportedPositions table tbody tr"
      )
      for (const $row of $supportedPositionsRows) {
        const [$billetCell, $posRoleCell, $advisorCell] =
          await $row.findElements(By.css("td"))
        await t.context.driver.wait(
          until.elementIsVisible($billetCell),
          mediumWaitMs
        )
        await $billetCell.getText()
        await t.context.driver.wait(
          until.elementIsVisible($posRoleCell),
          mediumWaitMs
        )
        await $posRoleCell.getText()
        await t.context.driver.wait(
          until.elementIsVisible($advisorCell),
          mediumWaitMs
        )
        const advisorText = await $advisorCell.getText()
        if (advisorText === personName) {
          const $advisorLink = await $advisorCell.findElement(By.css("a"))
          await t.context.driver.wait(
            until.elementIsVisible($advisorLink),
            mediumWaitMs
          )
          await $advisorLink.click()
          await t.context.driver.wait(
            t.context.untilStalenessOf($advisorLink),
            mediumWaitMs
          )
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

test.beforeEach(async t => {
  if (t.context.driver) {
    if (testEnv !== "local") {
      // Set test title on BrowserStack
      const body = JSON.stringify({
        action: "setSessionName",
        arguments: { name: t.title.replace(/^beforeEach hook for /, "") }
      })
      await t.context.driver.executeScript(`browserstack_executor: ${body}`)
    }
  }
})

// Shut down the browser when we are done.
test.afterEach.always(async t => {
  if (t.context.driver) {
    if (testEnv !== "local") {
      // Send back test result to BrowserStack
      const body = JSON.stringify({
        action: "setSessionStatus",
        arguments: { status: t.passed ? "passed" : "failed" }
      })
      await t.context.driver.executeScript(`browserstack_executor: ${body}`)
    }

    await t.context.driver.quit()
  }
})

/**
 * Technically speaking, everything should be wrapped in a wait() block to give
 * the browser time to run JS to update the page. In practice, this does not
 * always seem to be necessary, since the JS can run very fast. If the tests are flaky,
 * this would be a good thing to investigate.
 *
 * Also, I suspect that we may see a bunch of stale element errors as React replaces
 * DOM nodes. To fix this, we should use a model of passing around CSS selectors instead
 * of element references, and always query for the element at the last possible moment.
 */

module.exports = test
module.exports.debugLog = debugLog
