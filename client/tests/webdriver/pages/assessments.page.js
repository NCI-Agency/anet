import Page from "./page"

class AssessmentsSection extends Page {
  async getAssessmentsSection(assessmentKey, recurrence) {
    return browser.$(
      `#entity-assessments-results-${assessmentKey}-${recurrence}`
    )
  }

  async getNewAssessmentButton(assessmentKey, recurrence) {
    return (await this.getAssessmentsSection(assessmentKey, recurrence)).$(
      "table.assessments-table tr button"
    )
  }

  async getModalContent() {
    return browser.$("div.modal-content")
  }

  async getModalTitle() {
    return (await this.getModalContent()).$("div.modal-title")
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).$(".btn-close")
  }

  async getModalAssessmentQuestion(key) {
    return (await this.getModalContent()).$(`[id="fg-entityAssessment.${key}"]`)
  }
}

export default new AssessmentsSection()
