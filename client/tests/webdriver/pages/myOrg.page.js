import Page from "./page"

class MyOrg extends Page {
  getEngagementDateStatistics() {
    return browser.$("[id^=engagementDate-statistics]").$(".fc")
  }

  getLocationStatistics() {
    return browser.$("[id^=map-location-statistics]")
  }

  getEngagementStatus() {
    return browser.$("[id^=engagementStatus-statistics]")
  }

  getTasks() {
    return browser.$("[id^=tasks-statistics]")
  }

  getTrainingEvent() {
    return browser.$("[id*=trainingEvent-statistics]")
  }

  getNumberTrained() {
    return browser.$("[id*=numberTrained-statistics]")
  }
}

export default new MyOrg()
