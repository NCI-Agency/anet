import Page from "./page.js"

class MyOrg extends Page {
  async getReportStatisticsButton() {
    return this.page.locator("#reports button[value='statistics']").first()
  }

  async getEngagementDateStatistics() {
    return (await this.page.locator("[id^=engagementDate-statistics]").first())
      .locator(".fc")
      .first()
  }

  async getLocationStatistics() {
    return this.page.locator("[id^=map-location-statistics]").first()
  }

  async getEngagementStatus() {
    return this.page.locator("[id^=engagementStatus-statistics]").first()
  }

  async getTasks() {
    return this.page.locator("[id^=tasks-statistics]").first()
  }

  async getTrainingEvent() {
    return this.page.locator("[id*=trainingEvent-statistics]").first()
  }

  async getNumberTrained() {
    return this.page.locator("[id*=numberTrained-statistics]").first()
  }
}
export default MyOrg
