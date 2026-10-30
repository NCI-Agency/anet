import { expect, test } from "@playwright/test"
import InsightsPageObject, {
  INSIGHTS,
  PENDING_ASSESSMENTS_BY_POSITION
} from "../pages/insights.page.js"

test.describe(() => {
  let page, Insights
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    Insights = new InsightsPageObject(page)
  })
  test.describe("Insights pages", () => {
    test("Should open each insights page for admin user", async () => {
      await Insights.openAsAdminUser()
      for (const insight of INSIGHTS) {
        await (await Insights.getInsightsMenu()).click()
        await (await Insights.getInsightLink(insight)).click()
        await (
          await Insights.getAlert()
        ).waitFor({
          state: "hidden",
          timeout: 1000
        })
        await expect(await Insights.getInsightDiv(insight)).not.toHaveCount(0)
      }
      await Insights.logout()
    })
    test("Should open each insights page for super user", async () => {
      await Insights.openAsSuperuser()
      for (const insight of INSIGHTS) {
        await (await Insights.getInsightsMenu()).click()
        await (await Insights.getInsightLink(insight)).click()
        await (
          await Insights.getAlert()
        ).waitFor({
          state: "hidden",
          timeout: 1000
        })
        await expect(await Insights.getInsightDiv(insight)).not.toHaveCount(0)
      }
      await Insights.logout()
    })
    test("Should open each insights page except pending assessments for regular user", async () => {
      await Insights.openAsPositionlessUser()
      for (const insight of INSIGHTS.filter(
        ins => ins !== PENDING_ASSESSMENTS_BY_POSITION
      )) {
        await (await Insights.getInsightsMenu()).click()
        await (await Insights.getInsightLink(insight)).click()
        await (
          await Insights.getAlert()
        ).waitFor({
          state: "hidden",
          timeout: 1000
        })
        await expect(await Insights.getInsightDiv(insight)).not.toHaveCount(0)
      }
      await (await Insights.getInsightsMenu()).click()
      await expect(
        await Insights.getInsightLink(PENDING_ASSESSMENTS_BY_POSITION)
      ).toHaveCount(0)
      await Insights.logout()
    })
  })
})
