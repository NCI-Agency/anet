import Rollup from "../pages/rollup.page"

describe("Preview rollup page", () => {
  beforeEach("Open the rollup page", () => {
    Rollup.open()
    Rollup.getRollup().waitForExist()
    Rollup.getRollup().waitForDisplayed()
  })

  afterEach("On the rollup page...", () => {
    Rollup.logout()
  })

  describe("When clicking the email preview button, the daily rollup should be generated", () => {
    it("Should show the correct header for the rollup", () => {
      Rollup.getEmailButton().waitForDisplayed()
      Rollup.getEmailButton().click()

      const currentHandle = browser.getWindowHandle()
      Rollup.getEmailPreviewButton().waitForExist()
      Rollup.getEmailPreviewButton().waitForDisplayed()
      browser.pause(500)
      Rollup.getEmailPreviewButton().click()

      browser.pause(500)
      const handles = browser.getWindowHandles()

      // Find new window handle; NOTE: https://w3c.github.io/webdriver/#dfn-get-window-handles
      // "The order in which the window handles are returned is arbitrary."
      let switchHandle
      while ((switchHandle = handles.pop()) === currentHandle) {
        // eslint-disable-line no-empty
      }
      browser.switchToWindow(switchHandle)

      browser.waitUntil(
        () => {
          return (
            $("p:nth-of-type(1) i").getText() ===
            "Classification: DEMO USE ONLY"
          )
        },
        { timeout: 3000, timeoutMsg: "Expected classification" }
      )
      browser.closeWindow()
      // Switch back and close dialog
      browser.switchToWindow(currentHandle)
      browser.$("button.btn-close").click()
    })
  })
})
