import Page from "./page"

class AssessmentsSection extends Page {
  async getAssessmentsSection(recurrence) {
    return browser.$(`#entity-assessments-results-${recurrence}`)
  }

  async getNewAssessmentButton(recurrence) {
    return (await this.getAssessmentsSection(recurrence)).$(
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
