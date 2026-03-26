import Home from "./home.page"
import Page from "./page"

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
    await super.open("/", credentials)
    await (await Home.getLinksMenuButton()).click()
    await (await Home.getMyReportsLink()).waitForDisplayed()
    await (await Home.getMyReportsLink()).click()
  }

  async selectReport(linkText, reportState) {
    await this.selectReportsTable(reportState)
    const reportLink = browser.$(`*=${linkText}`)
    await (await reportLink).waitForExist()
    await (await reportLink).waitForDisplayed()
    await (await reportLink).click()
    await super.waitUntilLoaded()
  }

  async selectReportsTable(reportState) {
    const sectionId = reportState.id
    const tableTab = browser.$(
      `#${sectionId} .report-collection div header div button[value='table']`
    )
    await (await tableTab).waitForExist()
    await (await tableTab).waitForDisplayed()
    await (await tableTab).click()
    await super.waitUntilLoaded()
    await browser.pause(1000) // wait for table to load/render
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
    const summaryTab = browser.$(
      `#${sectionId} .report-collection div header div button[value='summary']`
    )
    await (await summaryTab).waitForExist()
    await (await summaryTab).waitForDisplayed()
    await (await summaryTab).click()
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
      `div.col-md-12 > span:nth-child(${infoSpan})`
    )
  }
}

export default new MyReports()
