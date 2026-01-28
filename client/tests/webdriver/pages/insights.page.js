import Page from "./page"

// Copied from src/pages/insights/Show.js
const NOT_APPROVED_REPORTS = "not-approved-reports"
const CANCELLED_REPORTS = "cancelled-engagement-reports"
const REPORTS_BY_TASK = "reports-by-task"
const REPORTS_BY_DAY_OF_WEEK = "reports-by-day-of-week"
const FUTURE_ENGAGEMENTS_BY_LOCATION = "future-engagements-by-location"
export const PENDING_ASSESSMENTS_BY_POSITION = "pending-assessments-by-position"
const ADVISOR_REPORTS = "advisor-reports"
const CADENCE_DASHBOARD = "cadence-dashboard"
export const INSIGHTS = [
  NOT_APPROVED_REPORTS,
  CANCELLED_REPORTS,
  REPORTS_BY_TASK,
  FUTURE_ENGAGEMENTS_BY_LOCATION,
  REPORTS_BY_DAY_OF_WEEK,
  PENDING_ASSESSMENTS_BY_POSITION,
  ADVISOR_REPORTS,
  CADENCE_DASHBOARD
]

class Insights extends Page {
  async getInsightsMenu() {
    return browser.$("#insights")
  }

  async getInsightLink(insight) {
    return browser.$(`a[href="/insights/${insight}"]`)
  }

  async getAlert() {
    return browser.$(".alert")
  }

  async getInsightDiv(insight) {
    return browser.$(`div[id="${insight}"]`)
  }
}

export default new Insights()
