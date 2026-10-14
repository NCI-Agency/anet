import { expect as pwExpect } from "@playwright/test"
import Insights, {
  INSIGHTS,
  PENDING_ASSESSMENTS_BY_POSITION
} from "../pages/insights.page.js"
import { test, waitFor } from "../support.js"

test.describe("Insights pages", () => {
  test("Should open each insights page for admin user", async () => {
    await Insights.openAsAdminUser()
    for (const insight of INSIGHTS) {
      await waitFor(await Insights.getInsightsMenu(), "attached")
      await waitFor(await Insights.getInsightsMenu(), "visible")
      await (await Insights.getInsightsMenu()).click()
      await (await Insights.getInsightLink(insight)).click()
      await waitFor(await Insights.getAlert(), "visible", {
        timeout: 1000,
        reverse: true
      })

      await pwExpect(await Insights.getInsightDiv(insight)).not.toHaveCount(0)
    }
    await Insights.logout()
  })
  test("Should open each insights page for super user", async () => {
    await Insights.openAsSuperuser()
    for (const insight of INSIGHTS) {
      await waitFor(await Insights.getInsightsMenu(), "attached")
      await waitFor(await Insights.getInsightsMenu(), "visible")
      await (await Insights.getInsightsMenu()).click()
      await (await Insights.getInsightLink(insight)).click()
      await waitFor(await Insights.getAlert(), "visible", {
        timeout: 1000,
        reverse: true
      })

      await pwExpect(await Insights.getInsightDiv(insight)).not.toHaveCount(0)
    }
    await Insights.logout()
  })
  test("Should open each insights page except pending assessments for regular user", async () => {
    await Insights.openAsPositionlessUser()
    for (const insight of INSIGHTS.filter(
      ins => ins !== PENDING_ASSESSMENTS_BY_POSITION
    )) {
      await waitFor(await Insights.getInsightsMenu(), "attached")
      await waitFor(await Insights.getInsightsMenu(), "visible")
      await (await Insights.getInsightsMenu()).click()
      await (await Insights.getInsightLink(insight)).click()
      await waitFor(await Insights.getAlert(), "visible", {
        timeout: 1000,
        reverse: true
      })

      await pwExpect(await Insights.getInsightDiv(insight)).not.toHaveCount(0)
    }
    await waitFor(await Insights.getInsightsMenu(), "attached")
    await waitFor(await Insights.getInsightsMenu(), "visible")
    await (await Insights.getInsightsMenu()).click()

    await pwExpect(
      await Insights.getInsightLink(PENDING_ASSESSMENTS_BY_POSITION)
    ).toHaveCount(0)
    await Insights.logout()
  })
})
