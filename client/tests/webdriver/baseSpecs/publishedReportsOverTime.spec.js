import { expect } from "chai"
import moment from "moment"
import AdvancedSearch from "../pages/advancedSearch.page"
import Insights, { PUBLISHED_REPORTS_OVER_TIME } from "../pages/insights.page"

const RELEASE_DATE_LABEL = "Release Date"
const NO_RANGE_MESSAGE =
  "Select a Release Date range in search filters to view results."
const RANGE_LABEL_SELECTOR = `#${PUBLISHED_REPORTS_OVER_TIME} .d-flex.align-items-center.gap-2 .fw-semibold`
const GRANULARITY_SELECTOR = `#${PUBLISHED_REPORTS_OVER_TIME} .btn-group`
const TOTAL_REPORTS_SELECTOR = `//div[@id="${PUBLISHED_REPORTS_OVER_TIME}"]//div[contains(text(),"Total reports:")]`
const CHART_ID = "reports_published_over_time"
const BAR_SELECTOR = `#${CHART_ID} g.bars-group`
const EXPECTED_PUBLISHED_RANGE = { min: 27, max: 29 }

describe("Published reports over time insight", () => {
  it("Should show the default release date range in the search summary", async () => {
    await openPublishedReportsInsight()

    const rangeLabel = await browser.$(RANGE_LABEL_SELECTOR)
    expect(await rangeLabel.getText()).to.equal(
      `Year ${new Date().getFullYear()}`
    )

    const totalReportsLabel = await browser.$(TOTAL_REPORTS_SELECTOR)
    await totalReportsLabel.waitForExist()

    const searchSummary = await AdvancedSearch.getAdvancedSearchPopoverTrigger()
    expect(await searchSummary.getText()).to.include(RELEASE_DATE_LABEL)
    await expectTotalReportsWithinRange(
      totalReportsLabel,
      EXPECTED_PUBLISHED_RANGE
    )

    await Insights.logout()
  })

  it("Should toggle between monthly and weekly granularity", async () => {
    await openPublishedReportsInsight()

    const granularityToggle = await browser.$(GRANULARITY_SELECTOR)
    await granularityToggle.waitForExist()

    const monthlyButton = await granularityToggle.$("button=Monthly")
    const weeklyButton = await granularityToggle.$("button=Weekly")
    await monthlyButton.waitForExist()
    await weeklyButton.waitForExist()

    const totalReportsLabel = await browser.$(TOTAL_REPORTS_SELECTOR)
    await totalReportsLabel.waitForExist()
    await expectTotalReportsWithinRange(
      totalReportsLabel,
      EXPECTED_PUBLISHED_RANGE
    )

    expect(await monthlyButton.getAttribute("class")).to.include("active")
    await expectBarCountToEqual(getExpectedPeriodCount("month"))
    await expectLastTableCountWithinRange(EXPECTED_PUBLISHED_RANGE)

    await weeklyButton.click()
    expect(await weeklyButton.getAttribute("class")).to.include("active")
    expect(await monthlyButton.getAttribute("class")).to.not.include("active")
    await expectBarCountToEqual(getExpectedPeriodCount("week"))
    await expectLastTableCountWithinRange(EXPECTED_PUBLISHED_RANGE)
    await expectTotalReportsWithinRange(
      totalReportsLabel,
      EXPECTED_PUBLISHED_RANGE
    )

    await monthlyButton.click()
    expect(await monthlyButton.getAttribute("class")).to.include("active")
    await expectBarCountToEqual(getExpectedPeriodCount("month"))

    await expectTotalReportsWithinRange(
      totalReportsLabel,
      EXPECTED_PUBLISHED_RANGE
    )

    await Insights.logout()
  })

  it("Should clear the insight when the release date filter is removed", async () => {
    await openPublishedReportsInsight()

    await (
      await AdvancedSearch.getAdvancedSearchPopoverTrigger()
    ).waitForExist()
    await (await AdvancedSearch.getAdvancedSearchPopoverTrigger()).click()
    await (await AdvancedSearch.getAdvancedSearchPopover()).waitForDisplayed()

    await AdvancedSearch.selectObjectType("REPORTS")

    let releaseDateRow =
      await AdvancedSearch.getFilterRowByLabel(RELEASE_DATE_LABEL)
    if (!(await releaseDateRow.isExisting())) {
      await (await AdvancedSearch.getAddFilterButton()).click()
      await (await AdvancedSearch.getAddFilterPopover()).waitForDisplayed()
      await (await AdvancedSearch.getSearchFilter(RELEASE_DATE_LABEL)).click()
      releaseDateRow =
        await AdvancedSearch.getFilterRowByLabel(RELEASE_DATE_LABEL)
    }

    await releaseDateRow.waitForExist()
    const removeButton =
      await AdvancedSearch.getRemoveButtonForFilter(RELEASE_DATE_LABEL)
    await removeButton.waitForClickable()
    await removeButton.click()
    expect(
      await (
        await AdvancedSearch.getFilterRowByLabel(RELEASE_DATE_LABEL)
      ).isExisting()
    ).to.equal(false)

    const searchButton = await AdvancedSearch.getSearchButton()
    await searchButton.waitForClickable()
    await searchButton.click()

    const searchSummary = await AdvancedSearch.getAdvancedSearchPopoverTrigger()
    expect(await searchSummary.getText()).to.not.include(RELEASE_DATE_LABEL)

    const rangeLabel = await browser.$(RANGE_LABEL_SELECTOR)
    expect(await rangeLabel.getText()).to.equal("Release Date range")

    const noRangeMessage = await browser.$(`#${PUBLISHED_REPORTS_OVER_TIME} em`)
    expect(await noRangeMessage.getText()).to.equal(NO_RANGE_MESSAGE)

    await Insights.logout()
  })
})

async function openPublishedReportsInsight() {
  await Insights.open(`/insights/${PUBLISHED_REPORTS_OVER_TIME}`)
  await (
    await Insights.getInsightDiv(PUBLISHED_REPORTS_OVER_TIME)
  ).waitForExist()
  await (await AdvancedSearch.getAdvancedSearchForm()).waitForExist()
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
  const startOfRange = startOfYear.clone().startOf("day")
  const endOfRange = today.clone().startOf("day")
  return endOfRange.diff(startOfRange, "weeks") + 1
}

async function expectBarCountToEqual(expectedCount) {
  await (await browser.$(`#${CHART_ID}`)).waitForExist()
  const bars = await browser.$$(BAR_SELECTOR)
  expect(bars.length).to.equal(expectedCount)
}

async function expectLastTableCountWithinRange(range) {
  const rows = await browser.$$(
    `#${PUBLISHED_REPORTS_OVER_TIME} table tbody tr`
  )
  if (!rows.length) {
    throw new Error("Expected report table to have rows")
  }
  const lastRow = rows[rows.length - 1]
  const cells = await lastRow.$$("td")
  if (cells.length < 2) {
    throw new Error("Expected report table row to include count cell")
  }
  const countText = await cells[1].getText()
  const count = Number(countText.replace(/,/g, ""))
  expect(Number.isNaN(count)).to.equal(false)
  expect(count).to.be.within(range.min, range.max)
}

async function expectTotalReportsWithinRange(totalReportsLabel, range) {
  const count = parseTotalReportsCount(await totalReportsLabel.getText())
  expect(count).to.be.within(range.min, range.max)
}

function parseTotalReportsCount(labelText) {
  // Label format: "Total reports: <number>"
  const match = labelText.match(/Total reports:\s*(\d+)/)
  if (!match) {
    throw new Error(`Unable to parse total reports from "${labelText}"`)
  }
  return Number(match[1])
}
