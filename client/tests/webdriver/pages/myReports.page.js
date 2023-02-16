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
}

export default new MyReports()
