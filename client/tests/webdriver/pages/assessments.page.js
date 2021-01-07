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

  get modalContent() {
    return browser.$("div.modal-content")
  }

  get modalTitle() {
    return this.modalContent.$("h4.modal-title")
  }

  get modalCancelButton() {
    return this.modalContent.$('//button[text()="Cancel"]')
  }

  getModalAssessmentQuestion(key) {
    return this.modalContent.$(`[id="fg-entityAssessment.${key}"]`)
  }
}

export default new AssessmentsSection()
