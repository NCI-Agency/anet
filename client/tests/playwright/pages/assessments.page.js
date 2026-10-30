import Page from "./page.js"

class AssessmentsSection extends Page {
  async getAssessmentsSection(assessmentKey, recurrence) {
    return this.page
      .locator(`#entity-assessments-results-${assessmentKey}-${recurrence}`)
      .first()
  }

  async getNewAssessmentButton(assessmentKey, recurrence) {
    return (await this.getAssessmentsSection(assessmentKey, recurrence))
      .locator("table.assessments-table tr button")
      .first()
  }

  async getModalContent() {
    return this.page.locator("div.modal-content").first()
  }

  async getModalTitle() {
    return (await this.getModalContent()).locator("div.modal-title").first()
  }

  async getModalCloseButton() {
    return (await this.getModalContent()).locator(".btn-close").first()
  }

  async getModalAssessmentQuestion(key) {
    return (await this.getModalContent())
      .locator(`[id="fg-entityAssessment.${key}"]`)
      .first()
  }
}
export default AssessmentsSection
