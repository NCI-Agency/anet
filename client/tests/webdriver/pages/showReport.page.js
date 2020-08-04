import Page from "./page"

class ShowReport extends Page {
  get tasksEngagementAssessments() {
    return browser.$("#tasks-engagement-assessments")
  }

  get task12BUrl() {
    return browser.$("*=1.2.B").getAttribute("href")
  }
}

export default new ShowReport()
