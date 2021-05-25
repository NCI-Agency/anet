import Page from "./page"

// Copied from src/pages/insights/Show.js
const NOT_APPROVED_REPORTS = "not-approved-reports"
const CANCELLED_REPORTS = "cancelled-reports"
const REPORTS_BY_TASK = "reports-by-task"
const REPORTS_BY_DAY_OF_WEEK = "reports-by-day-of-week"
const FUTURE_ENGAGEMENTS_BY_LOCATION = "future-engagements-by-location"
const PENDING_ASSESSMENTS_BY_POSITION = "pending-assessments-by-position"
const ADVISOR_REPORTS = "advisor-reports"
export const INSIGHTS = [
  NOT_APPROVED_REPORTS,
  CANCELLED_REPORTS,
  REPORTS_BY_TASK,
  FUTURE_ENGAGEMENTS_BY_LOCATION,
  REPORTS_BY_DAY_OF_WEEK,
  PENDING_ASSESSMENTS_BY_POSITION,
  ADVISOR_REPORTS
]

class Insights extends Page {
  get insightsMenu() {
    return browser.$("#insights")
  }

  getInsightLink(insight) {
    return browser.$(`a[href="/insights/${insight}"]`)
  }

  get alert() {
    return browser.$(".alert")
  }

  getInsightDiv(insight) {
    return browser.$(`div[id="${insight}"]`)
  }
}

export default new Insights()
