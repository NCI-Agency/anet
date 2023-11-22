import Page from "./page"

class MyOrg extends Page {
  async getReportStatisticsButton() {
    return browser.$("#reports button[value='statistics']")
  }

  async getEngagementDateStatistics() {
    return (await browser.$("[id^=engagementDate-statistics]")).$(".fc")
  }

  async getLocationStatistics() {
    return browser.$("[id^=map-location-statistics]")
  }

  async getEngagementStatus() {
    return browser.$("[id^=engagementStatus-statistics]")
  }

  async getTasks() {
    return browser.$("[id^=tasks-statistics]")
  }

  async getTrainingEvent() {
    return browser.$("[id*=trainingEvent-statistics]")
  }

  async getNumberTrained() {
    return browser.$("[id*=numberTrained-statistics]")
  }
}

export default new MyOrg()
