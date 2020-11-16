import Page from "./page"

class MyOrg extends Page {
  get engagementDateStatistics() {
    return browser.$("[id^=engagementDate-statistics]").$(".fc")
  }

  get locationStatistics() {
    return browser.$("[id^=map-location-statistics]")
  }

  get engagementStatus() {
    return browser.$("[id^=engagementStatus-statistics]")
  }

  get tasks() {
    return browser.$("[id^=tasks-statistics]")
  }

  get trainingEvent() {
    return browser.$("[id*=trainingEvent-statistics]")
  }

  get numberTrained() {
    return browser.$("[id*=numberTrained-statistics]")
  }
}

export default new MyOrg()
