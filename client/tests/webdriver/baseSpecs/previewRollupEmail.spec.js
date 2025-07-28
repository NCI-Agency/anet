import Rollup from "../pages/rollup.page"

describe("Preview rollup page", () => {
  beforeEach("Open the rollup page", async () => {
    await Rollup.open()
    await (await Rollup.getRollup()).waitForExist()
    await (await Rollup.getRollup()).waitForDisplayed()
  })

  afterEach("On the rollup page…", async () => {
    await Rollup.logout()
  })

  describe("When clicking the email preview button, the daily rollup should be generated", () => {
    it("Should show the correct header for the rollup", async () => {
      await (await Rollup.getEmailButton()).waitForDisplayed()
      await (await Rollup.getEmailButton()).click()

      const currentHandle = await browser.getWindowHandle()
      await (await Rollup.getEmailPreviewButton()).waitForExist()
      await (await Rollup.getEmailPreviewButton()).waitForDisplayed()
      await browser.pause(500)
      await (await Rollup.getEmailPreviewButton()).click()

      await browser.pause(500)
      const handles = await browser.getWindowHandles()

      // Find new window handle; NOTE: https://w3c.github.io/webdriver/#dfn-get-window-handles
      // "The order in which the window handles are returned is arbitrary."
      let switchHandle
      while ((switchHandle = handles.pop()) === currentHandle) {
        // eslint-disable-line no-empty
      }
      await browser.switchToWindow(switchHandle)

      await browser.waitUntil(
        async () => {
          return (
            (await $("p:nth-of-type(1) i").getText()) ===
            "Classification: DEMO USE ONLY Releasable to DEMO MISSION"
          )
        },
        { timeout: 3000, timeoutMsg: "Expected classification" }
      )
      await browser.closeWindow()
      // Switch back and close dialog
      await browser.switchToWindow(currentHandle)
      await (await browser.$("button.btn-close")).click()
    })
  })
})
