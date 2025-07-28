import { expect } from "chai"
import Insights, {
  INSIGHTS,
  PENDING_ASSESSMENTS_BY_POSITION
} from "../pages/insights.page"

describe("Insights pages", () => {
  it("Should open each insights page for admin user", async () => {
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
    await Insights.logout()
  })

  it("Should open each insights page for super user", async () => {
    await Insights.openAsSuperuser()
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
    await Insights.logout()
  })

  it("Should open each insights page except pending assessments for regular user", async () => {
    await Insights.openAsPositionlessUser()
    for (const insight of INSIGHTS.filter(
      ins => ins !== PENDING_ASSESSMENTS_BY_POSITION
    )) {
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

    await (await Insights.getInsightsMenu()).waitForExist()
    await (await Insights.getInsightsMenu()).waitForDisplayed()
    await (await Insights.getInsightsMenu()).click()
    // eslint-disable-next-line no-unused-expressions
    expect(
      await (
        await Insights.getInsightLink(PENDING_ASSESSMENTS_BY_POSITION)
      ).isExisting()
    ).to.be.false

    await Insights.logout()
  })
})
