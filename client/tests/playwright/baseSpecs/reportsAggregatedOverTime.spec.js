import { expect } from "@playwright/test"
import moment from "moment"
import Settings from "../../../platform/node/settings.js"
import AdvancedSearch from "../pages/advancedSearch.page.js"
import Insights, {
  AGGREGATED_REPORTS_OVER_TIME
} from "../pages/insights.page.js"
import { currentPage, test, waitFor } from "../support.js"

const RELEASE_DATE_LABEL = "Release Date"
const NO_RANGE_MESSAGE =
  "Select a Release Date range in search filters to view results."
const RANGE_LABEL_SELECTOR = '[data-testid="range-label"]'
const GRANULARITY_SELECTOR = `#${AGGREGATED_REPORTS_OVER_TIME} .btn-group`
const TOTAL_REPORTS_SELECTOR = `//div[@id="${AGGREGATED_REPORTS_OVER_TIME}"]//div[contains(text(),"Total reports:")]`
const CHART_ID = "reports_published_over_time"
const BAR_SELECTOR = `#${CHART_ID} g.bars-group`
const EXPECTED_PUBLISHED_RANGE = {
  min: 27,
  max: 29
}
const WEEK_PERIOD_KEY = Settings.useISO8601 ? "isoWeek" : "week"
test.describe("Aggregated reports over time insight", () => {
  test("Should show the default release date range in the search summary", async () => {
    await openPublishedReportsInsight()
    const rangeLabel = await currentPage().locator(RANGE_LABEL_SELECTOR).first()
    const expectedRangeLabelText = `${moment().startOf("year").format("D MMMM YYYY")} — ${moment().format("D MMMM YYYY")}`
    await expect(rangeLabel).toHaveText(expectedRangeLabelText, {
      useInnerText: true
    })
    const totalReportsLabel = await currentPage()
      .locator(TOTAL_REPORTS_SELECTOR)
      .first()
    await waitFor(totalReportsLabel, "attached")
    const searchSummary = await AdvancedSearch.getAdvancedSearchPopoverTrigger()
    await expect(searchSummary).toContainText(RELEASE_DATE_LABEL, {
      useInnerText: true
    })
    await expectTotalReportsWithinRange(
      totalReportsLabel,
      EXPECTED_PUBLISHED_RANGE
    )
    await Insights.logout()
  })
  test("Should toggle between monthly and weekly granularity", async () => {
    await openPublishedReportsInsight()
    const granularityToggle = await currentPage()
      .locator(GRANULARITY_SELECTOR)
      .first()
    await waitFor(granularityToggle, "attached")
    const monthlyButton = await granularityToggle
      .getByRole("button", {
        name: "Monthly",
        exact: true
      })
      .first()
    const weeklyButton = await granularityToggle
      .getByRole("button", {
        name: "Weekly",
        exact: true
      })
      .first()
    await waitFor(monthlyButton, "attached")
    await waitFor(weeklyButton, "attached")
    const totalReportsLabel = await currentPage()
      .locator(TOTAL_REPORTS_SELECTOR)
      .first()
    await waitFor(totalReportsLabel, "attached")
    await expectTotalReportsWithinRange(
      totalReportsLabel,
      EXPECTED_PUBLISHED_RANGE
    )
    await expect(monthlyButton).toHaveAttribute("class", /active/)
    await expectBarCountToEqual(getExpectedPeriodCount("month"))
    await expectLastTableCountWithinRange(EXPECTED_PUBLISHED_RANGE)
    await weeklyButton.click()
    await expect(weeklyButton).toHaveAttribute("class", /active/)
    await expect(monthlyButton).not.toHaveAttribute("class", /active/)
    await expectBarCountToEqual(getExpectedPeriodCount("week"))
    await expectLastTableCountWithinRange(EXPECTED_PUBLISHED_RANGE)
    await expectTotalReportsWithinRange(
      totalReportsLabel,
      EXPECTED_PUBLISHED_RANGE
    )
    await monthlyButton.click()
    await expect(monthlyButton).toHaveAttribute("class", /active/)
    await expectBarCountToEqual(getExpectedPeriodCount("month"))
    await expectTotalReportsWithinRange(
      totalReportsLabel,
      EXPECTED_PUBLISHED_RANGE
    )
    await Insights.logout()
  })
  test("Should clear the insight when the release date filter is removed", async () => {
    await openPublishedReportsInsight()
    await (await AdvancedSearch.getAdvancedSearchPopoverTrigger()).click()
    await waitFor(await AdvancedSearch.getAdvancedSearchPopover(), "visible")
    await AdvancedSearch.selectObjectType("REPORTS")
    let releaseDateRow =
      await AdvancedSearch.getFilterRowByLabel(RELEASE_DATE_LABEL)
    if (!((await releaseDateRow.count()) > 0)) {
      await (await AdvancedSearch.getAddFilterButton()).click()
      await waitFor(await AdvancedSearch.getAddFilterPopover(), "visible")
      await (await AdvancedSearch.getSearchFilter(RELEASE_DATE_LABEL)).click()
      releaseDateRow =
        await AdvancedSearch.getFilterRowByLabel(RELEASE_DATE_LABEL)
    }
    await waitFor(releaseDateRow, "attached")
    const removeButton =
      await AdvancedSearch.getRemoveButtonForFilter(RELEASE_DATE_LABEL)
    await removeButton.click()
    await expect(
      await AdvancedSearch.getFilterRowByLabel(RELEASE_DATE_LABEL)
    ).toHaveCount(0)
    const searchButton = await AdvancedSearch.getSearchButton()
    await searchButton.click()
    const searchSummary = await AdvancedSearch.getAdvancedSearchPopoverTrigger()
    await expect(searchSummary).not.toContainText(RELEASE_DATE_LABEL, {
      useInnerText: true
    })
    const rangeLabel = await currentPage().locator(RANGE_LABEL_SELECTOR).first()
    await expect(rangeLabel).toHaveText(NO_RANGE_MESSAGE, {
      useInnerText: true
    })
    const noRangeMessage = await currentPage()
      .locator(`#${AGGREGATED_REPORTS_OVER_TIME} em`)
      .first()
    await expect(noRangeMessage).toHaveText(NO_RANGE_MESSAGE, {
      useInnerText: true
    })
    await Insights.logout()
  })
})
async function openPublishedReportsInsight() {
  await Insights.open(`/insights/${AGGREGATED_REPORTS_OVER_TIME}`)
  await waitFor(
    await Insights.getInsightDiv(AGGREGATED_REPORTS_OVER_TIME),
    "attached"
  )
  await waitFor(await AdvancedSearch.getAdvancedSearchForm(), "attached")
}
function getExpectedPeriodCount(granularity) {
  const today = moment()
  const startOfYear = today.clone().startOf("year")
  if (granularity === "month") {
    return (
      today
        .clone()
        .startOf("month")
        .diff(startOfYear.clone().startOf("month"), "months") + 1
    )
  }
  const startOfRange = startOfYear.clone().startOf(WEEK_PERIOD_KEY)
  const endOfRange = today.clone().startOf(WEEK_PERIOD_KEY)
  return endOfRange.diff(startOfRange, "weeks") + 1
}
async function expectBarCountToEqual(expectedCount) {
  await waitFor(await currentPage().locator(`#${CHART_ID}`).first(), "attached")
  const bars = await currentPage().locator(BAR_SELECTOR).all()
  expect(bars.length).toBe(expectedCount)
}
async function expectLastTableCountWithinRange(range) {
  const rows = await currentPage()
    .locator(`#${AGGREGATED_REPORTS_OVER_TIME} table tbody tr`)
    .all()
  if (!rows.length) {
    throw new Error("Expected report table to have rows")
  }
  const lastRow = rows[rows.length - 1]
  const cells = await lastRow.locator("td").all()
  if (cells.length < 2) {
    throw new Error("Expected report table row to include count cell")
  }
  const countText = (await cells[1].innerText()).trim()
  const count = Number(countText.replace(/,/g, ""))
  expect(Number.isNaN(count)).toBe(false)
  expect(count).toBeGreaterThanOrEqual(range.min)
  expect(count).toBeLessThanOrEqual(range.max)
}
async function expectTotalReportsWithinRange(totalReportsLabel, range) {
  const count = parseTotalReportsCount(
    (await totalReportsLabel.innerText()).trim()
  )
  expect(count).toBeGreaterThanOrEqual(range.min)
  expect(count).toBeLessThanOrEqual(range.max)
}
function parseTotalReportsCount(labelText) {
  // Label format: "Total reports: <number>"
  const match = labelText.match(/Total reports:\s*(\d+)/)
  if (!match) {
    throw new Error(`Unable to parse total reports from "${labelText}"`)
  }
  return Number(match[1])
}
