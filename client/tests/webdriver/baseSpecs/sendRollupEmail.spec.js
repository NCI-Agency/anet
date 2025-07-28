import { expect } from "chai"
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

  describe("When attempting to send the rollup email", () => {
    it("to an email with the correct domain it should send them successfully", async () => {
      await (await Rollup.getEmailButton()).waitForDisplayed()
      await (await Rollup.getEmailButton()).click()

      await (await Rollup.getEmailTo()).waitForExist()
      await (await Rollup.getEmailTo()).waitForDisplayed()
      await (await Rollup.getEmailTo()).setValue("mail@example.com")

      await browser.pause(500)
      await (await Rollup.getSendEmailButton()).click()

      await browser.pause(500)
      expect(await Rollup.getInvalidFeedbackLabelEmailList()).to.have.lengthOf(
        0
      )
      expect(await (await Rollup.getSuccessMessage()).getText()).to.equal(
        "Email successfully sent"
      )
    })

    it("to an email with an incorrect domain it should not send", async () => {
      await (await Rollup.getEmailButton()).waitForDisplayed()
      await (await Rollup.getEmailButton()).click()

      await (await Rollup.getEmailTo()).waitForExist()
      await (await Rollup.getEmailTo()).waitForDisplayed()
      await (await Rollup.getEmailTo()).setValue("mail@badexample.com")

      await browser.pause(500)
      await (await Rollup.getSendEmailButton()).click()

      await browser.pause(500)
      expect(
        await Rollup.getInvalidFeedbackLabelEmailList()
      ).to.have.lengthOf.above(0)
    })
  })
})
