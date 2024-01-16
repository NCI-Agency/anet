import Page from "./page"

const PAGE_URL = "/reports/mine"

export const REPORT_STATES = {
  DRAFT: {
    id: "draft-reports"
  },
  PLANNED_ENGAGEMENTS: {
    id: "planned-engagements"
  },
  PENDING_APPROVAL: {
    id: "pending-approval"
  },
  APPROVED: {
    id: "approved"
  },
  PUBLISHED: {
    id: "published-reports"
  },
  CANCELLED: {
    id: "cancelled-reports"
  }
}

class MyReports extends Page {
  async open(credentials) {
    await super.open(PAGE_URL, credentials)
  }

  async selectReport(linkText, reportState) {
    const sectionId = reportState.id
    const tableTab = await browser.$(
      `#${sectionId} .report-collection div header div button[value='table']`
    )
    await tableTab.waitForExist()
    await tableTab.waitForDisplayed()
    await tableTab.click()
    const reportLink = await browser.$(`*=${linkText}`)
    await reportLink.waitForExist()
    await reportLink.waitForDisplayed()
    await reportLink.click()
    await super.waitUntilLoaded()
  }

  async selectReportsTable(reportState) {
    const sectionId = reportState.id
    const tableTab = await browser.$(
      `#${sectionId} .report-collection div header div button[value='table']`
    )
    await tableTab.waitForExist()
    await tableTab.waitForDisplayed()
    await tableTab.click()
    await super.waitUntilLoaded()
  }

  async getReportsTableRow(reportRow) {
    return browser.$(
      `#published-reports .report-collection table tbody tr:nth-child(${reportRow})`
    )
  }

  async getReportsTableCell(reportRow, reportCell) {
    return (await this.getReportsTableRow(reportRow)).$(
      `td:nth-child(${reportCell})`
    )
  }

  async getReportsTableSpan(reportRow, reportCell, spanClass = "") {
    return (await this.getReportsTableCell(reportRow, reportCell)).$(
      `span${spanClass}`
    )
  }

  async selectReportsSummary(reportState) {
    const sectionId = reportState.id
    const summaryTab = await browser.$(
      `#${sectionId} .report-collection div header div button[value='summary']`
    )
    await summaryTab.waitForExist()
    await summaryTab.waitForDisplayed()
    await summaryTab.click()
    await super.waitUntilLoaded()
  }

  async getReportsSummaryItem(summaryItem) {
    return browser.$(
      `#published-reports .report-collection .report-summary:nth-child(${summaryItem})`
    )
  }

  async getReportsSummaryLine(summaryItem, summaryLine, infoSpan) {
    return (await this.getReportsSummaryItem(summaryItem)).$(
      `div:nth-child(${summaryLine})`
    )
  }

  async getReportsSummarySpan(summaryItem, summaryLine, infoSpan) {
    return (await this.getReportsSummaryLine(summaryItem, summaryLine)).$(
      `span:nth-child(${infoSpan})`
    )
  }
}

export default new MyReports()
