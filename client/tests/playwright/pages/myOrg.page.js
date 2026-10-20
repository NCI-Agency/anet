import { currentPage } from "../support.js"
import Page from "./page.js"

class MyOrg extends Page {
  async getReportStatisticsButton() {
    return currentPage().locator("#reports button[value='statistics']").first()
  }

  async getEngagementDateStatistics() {
    return (
      await currentPage().locator("[id^=engagementDate-statistics]").first()
    )
      .locator(".fc")
      .first()
  }

  async getLocationStatistics() {
    return currentPage().locator("[id^=map-location-statistics]").first()
  }

  async getEngagementStatus() {
    return currentPage().locator("[id^=engagementStatus-statistics]").first()
  }

  async getTasks() {
    return currentPage().locator("[id^=tasks-statistics]").first()
  }

  async getTrainingEvent() {
    return currentPage().locator("[id*=trainingEvent-statistics]").first()
  }

  async getNumberTrained() {
    return currentPage().locator("[id*=numberTrained-statistics]").first()
  }
}

export default new MyOrg()
