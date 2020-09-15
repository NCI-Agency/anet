import Page from "../page"

const PAGE_URL = "/reports/mine"

class MyReports extends Page {
  open() {
    super.open(PAGE_URL)
  }

  selectSummaryTab() {
    browser.$("#draft-reports button[value='summary']").click()
  }

  selectTableTab() {
    browser.$("#draft-reports button[value='table']").click()
  }

  // TODO Calendar and Map tabs

  get reportConflictTooltipTitle() {
    browser.pause(200)
    return browser.$(".reportConflictTooltipContainer > div").getText()
  }

  getDraftReportByEngagementDateString(dateStr, type = "summary") {
    let selector = `//div[@id='draft-reports']//div[contains(@class, 'report-summary') and .//span[contains(@class, 'engagement-date') and text()='${dateStr}']]`
    if (type === "table") {
      selector = `//div[@id='draft-reports']//div[@class= 'report-collection']//table//tbody//tr//td[.//div[1]//span[1][text()='${dateStr}']]`
    }

    const report = browser.$(selector)

    if (!report.isExisting()) {
      return null
    }

    // wait for conflict loader to disappear
    report.$("span.reportConflictLoadingIcon").waitForExist({ reverse: true })

    return {
      reportConflictIcon: report.$(".reportConflictIcon")
    }
  }

  waitForMyDraftReportsSummaryTabToLoad() {
    const selector =
      "#draft-reports .report-collection > div:first-child > div:nth-child(2)"
    if (!browser.$(selector).isDisplayed()) {
      browser.$(selector).waitForExist()
      browser.$(selector).waitForDisplayed()
    }
    browser.waitUntil(
      () =>
        browser.$(selector).isExisting() &&
        browser.$(selector).getText().startsWith("Draft")
    )
  }

  waitForMyDraftReportsTableTabToLoad() {
    const selector =
      "#draft-reports .report-collection > div:first-child > div:nth-child(2) table"
    if (!browser.$(selector).isDisplayed()) {
      browser.$(selector).waitForExist()
      browser.$(selector).waitForDisplayed()
    }
  }
}

export default new MyReports()
