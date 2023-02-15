import Page from "../page"

const PAGE_URL = "/reports/mine"

class MyReports extends Page {
  async open() {
    await super.open(PAGE_URL)
  }

  async selectSummaryTab() {
    await (await browser.$("#draft-reports button[value='summary']")).click()
  }

  async selectTableTab() {
    await (await browser.$("#draft-reports button[value='table']")).click()
  }

  // TODO Calendar and Map tabs

  async getReportConflictTooltipTitle() {
    await browser.pause(200)
    return (await browser.$(".reportConflictTooltipContainer > div")).getText()
  }

  async getDraftReportByEngagementDateString(dateStr, type = "summary") {
    let selector = `//div[@id='draft-reports']//div[contains(@class, 'report-summary') and .//span[contains(@class, 'engagement-date') and text()='${dateStr}']]`
    if (type === "table") {
      selector = `//div[@id='draft-reports']//div[@class= 'report-collection']//table//tbody//tr//td[.//div[1]//span[1][text()='${dateStr}']]`
    }

    const report = await browser.$(selector)

    if (!(await report.isExisting())) {
      return null
    }

    // wait for conflict loader to disappear
    await (
      await report.$("span.reportConflictLoadingIcon")
    ).waitForExist({ reverse: true })

    return {
      reportConflictIcon: await report.$(".reportConflictIcon")
    }
  }

  async waitForMyDraftReportsSummaryTabToLoad() {
    const selector =
      "#draft-reports .report-collection > div:first-child > div:nth-child(2)"
    if (!(await (await browser.$(selector)).isDisplayed())) {
      await (await browser.$(selector)).waitForExist()
      await (await browser.$(selector)).waitForDisplayed()
    }
    await browser.waitUntil(
      async() =>
        (await (await browser.$(selector)).isExisting()) &&
        (await (await browser.$(selector)).getText()).startsWith("Draft")
    )
  }

  async waitForMyDraftReportsTableTabToLoad() {
    const selector =
      "#draft-reports .report-collection > div:first-child > div:nth-child(2) table"
    if (!(await (await browser.$(selector)).isDisplayed())) {
      await (await browser.$(selector)).waitForExist()
      await (await browser.$(selector)).waitForDisplayed()
    }
  }
}

export default new MyReports()
