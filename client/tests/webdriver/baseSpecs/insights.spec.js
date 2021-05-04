import { expect } from "chai"
import Insights, { INSIGHTS } from "../pages/insights.page"

describe("Insights pages", () => {
  it("Should open each insights page", () => {
    Insights.openAsAdminUser()
    INSIGHTS.forEach(insight => {
      Insights.insightsMenu.waitForExist()
      Insights.insightsMenu.waitForDisplayed()
      Insights.insightsMenu.click()
      Insights.getInsightLink(insight).click()
      Insights.alert.waitForDisplayed({ timeout: 1000, reverse: true })
      // eslint-disable-next-line no-unused-expressions
      expect(Insights.getInsightDiv(insight).isExisting()).to.be.true
    })
  })
})
