import { currentPage, waitFor } from "../support.js"
import Home from "./home.page.js"
import Page from "./page.js"

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
    await waitFor(await Home.getLinksMenuButton(), "attached")
    await waitFor(await Home.getLinksMenuButton(), "visible")
    await (await Home.getLinksMenuButton()).click()
    await waitFor(await Home.getMyReportsLink(), "attached")
    await waitFor(await Home.getMyReportsLink(), "visible")
    await (await Home.getMyReportsLink()).click()
  }

  async selectReport(linkText, reportState) {
    await this.selectReportsTable(reportState)
    const reportLink = currentPage()
      .getByText(`${linkText}`, {
        exact: true
      })
      .first()
    await waitFor(await reportLink, "attached")
    await waitFor(await reportLink, "visible")
    await (await reportLink).click()
    await super.waitUntilLoaded()
  }

  async selectReportsTable(reportState) {
    const sectionId = reportState.id
    const tableTab = currentPage()
      .locator(
        `#${sectionId} .report-collection div header div button[value='table']`
      )
      .first()
    await waitFor(await tableTab, "attached")
    await waitFor(await tableTab, "visible")
    await (await tableTab).click()
    await super.waitUntilLoaded()
    // wait for table to load/render
  }

  async getReportsTableRow(reportRow) {
    return currentPage()
      .locator(
        `#published-reports .report-collection table tbody tr:nth-child(${reportRow})`
      )
      .first()
  }

  async getReportsTableCell(reportRow, reportCell) {
    return (await this.getReportsTableRow(reportRow))
      .locator(`td:nth-child(${reportCell})`)
      .first()
  }

  async getReportsTableSpan(reportRow, reportCell, spanClass = "") {
    return (await this.getReportsTableCell(reportRow, reportCell))
      .locator(`span${spanClass}`)
      .first()
  }

  async selectReportsSummary(reportState) {
    const sectionId = reportState.id
    const summaryTab = currentPage()
      .locator(
        `#${sectionId} .report-collection div header div button[value='summary']`
      )
      .first()
    await waitFor(await summaryTab, "attached")
    await waitFor(await summaryTab, "visible")
    await (await summaryTab).click()
    await super.waitUntilLoaded()
  }

  async getReportsSummaryItem(summaryItem) {
    return currentPage()
      .locator(
        `#published-reports .report-collection .report-summary:nth-child(${summaryItem})`
      )
      .first()
  }

  async getReportsSummaryLine(summaryItem, summaryLine, infoSpan) {
    return (await this.getReportsSummaryItem(summaryItem))
      .locator(`div:nth-child(${summaryLine})`)
      .first()
  }

  async getReportsSummarySpan(summaryItem, summaryLine, infoSpan) {
    return (await this.getReportsSummaryLine(summaryItem, summaryLine))
      .locator(`div.col-md-12 > span:nth-child(${infoSpan})`)
      .first()
  }
}

export default new MyReports()
