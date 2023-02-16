import { expect } from "chai"
import Insights, { INSIGHTS } from "../pages/insights.page"

describe("Insights pages", () => {
  it("Should open each insights page", async() => {
    await Insights.openAsAdminUser()
    for (const insight of INSIGHTS) {
      await (await Insights.getInsightsMenu()).waitForExist()
      await (await Insights.getInsightsMenu()).waitForDisplayed()
      await (await Insights.getInsightsMenu()).click()
      await (await Insights.getInsightLink(insight)).click()
      await (
        await Insights.getAlert()
      ).waitForDisplayed({ timeout: 1000, reverse: true })
      // eslint-disable-next-line no-unused-expressions
      expect(await (await Insights.getInsightDiv(insight)).isExisting()).to.be
        .true
    }
  })
})
