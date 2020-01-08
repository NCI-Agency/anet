import Rollup from "../pages/rollup.page"

describe("Preview rollup page", () => {
  beforeEach("Open the rollup page", () => {
    Rollup.open()
    Rollup.rollup.waitForExist()
    Rollup.rollup.waitForDisplayed()
  })

  describe("When clicking the email preview button, the daily rollup should be generated", () => {
    it("Should show the correct header for the rollup", () => {
      Rollup.emailButton.waitForDisplayed()
      Rollup.emailButton.click()

      Rollup.emailPreviewButton.waitForDisplayed()
      Rollup.emailPreviewButton.click()

      const currentHandle = browser.getWindowHandle()
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
        3000,
        "Expected classification"
      )
      browser.closeWindow()
    })
  })
})
