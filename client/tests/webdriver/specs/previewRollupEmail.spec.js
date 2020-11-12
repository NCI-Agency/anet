import Rollup from "../pages/rollup.page"

describe("Preview rollup page", () => {
  beforeEach("Open the rollup page", () => {
    Rollup.open()
    Rollup.rollup.waitForExist()
    Rollup.rollup.waitForDisplayed()
  })

  afterEach("On the rollup page...", () => {
    Rollup.logout()
  })

  describe("When clicking the email preview button, the daily rollup should be generated", () => {
    it("Should show the correct header for the rollup", () => {
      Rollup.emailButton.waitForDisplayed()
      Rollup.emailButton.click()

      const currentHandle = browser.getWindowHandle()
      Rollup.emailPreviewButton.waitForExist()
      Rollup.emailPreviewButton.waitForDisplayed()
      browser.pause(500)
      Rollup.emailPreviewButton.click()

      browser.pause(500)
      const handles = browser.getWindowHandles()

      // Find new window handle; NOTE: https://w3c.github.io/webdriver/#dfn-get-window-handles
      // "The order in which the window handles are returned is arbitrary."
      let switchHandle
      while ((switchHandle = handles.pop()) === currentHandle) {}
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
      browser.$("button.close").click()
    })
  })
})
