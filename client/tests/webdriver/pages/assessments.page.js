import Page from "./page"

class AssessmentsSection extends Page {
  getAssessmentsSection(recurrence) {
    return browser.$(`#entity-assessments-results-${recurrence}`)
  }

  getNewAssessmentButton(recurrence) {
    return this.getAssessmentsSection(recurrence).$(
      "table.assessments-table tr button"
    )
  }

  getModalContent() {
    return browser.$("div.modal-content")
  }

  getModalTitle() {
    return this.getModalContent().$("div.modal-title")
  }

  getModalCloseButton() {
    return this.getModalContent().$(".btn-close")
  }

  getModalAssessmentQuestion(key) {
    return this.getModalContent().$(`[id="fg-entityAssessment.${key}"]`)
  }
}

export default new AssessmentsSection()
