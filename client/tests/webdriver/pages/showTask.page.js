import Page from "./page"

class ShowTask extends Page {
  get assessmentResultsMonthly() {
    return browser.$("#entity-assessments-results-monthly")
  }

  get assessmentResultsWeekly() {
    return browser.$("#entity-assessments-results-weekly")
  }
}

export default new ShowTask()
