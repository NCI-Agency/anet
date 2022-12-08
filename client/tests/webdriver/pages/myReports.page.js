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
  open(credentials) {
    super.open(PAGE_URL, credentials)
  }

  selectReport(linkText, reportState) {
    const sectionId = reportState.id
    const tableTab = browser.$(
      `#${sectionId} .report-collection div header div button[value='table']`
    )
    tableTab.waitForExist()
    tableTab.waitForDisplayed()
    tableTab.click()
    const reportLink = browser.$(`*=${linkText}`)
    reportLink.waitForExist()
    reportLink.waitForDisplayed()
    reportLink.click()
    super.waitUntilLoaded()
  }
}

export default new MyReports()
