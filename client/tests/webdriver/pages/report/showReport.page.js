import Page from "../page"

const PAGE_URL = "/reports/:uuid"

class ShowReport extends Page {
  get reportStatus() {
    return browser.$("h4.text-danger")
  }

  get reportStatusText() {
    return this.reportStatus.getText()
  }

  get uuid() {
    const title =
      browser
        .$("//span[@class='title-text'][starts-with(.,'Report #')]")
        .getText() || ""
    return title.slice(title.lastIndexOf("#") + 1)
  }

  get intent() {
    const text = browser.$("#intent > p:first-child").getText() || ""
    return text.slice(text.indexOf(": ") + 2)
  }

  get engagementDate() {
    return browser.$("div[name='engagementDate']").getText()
  }

  get reportConflictIcon() {
    // wait for conflict loader to disappear
    browser
      .$("div[name='engagementDate'] > span.reportConflictLoadingIcon")
      .waitForExist({ reverse: true })

    return browser.$("div[name='engagementDate'] > span.reportConflictIcon")
  }

  get reportConflictTooltipTitle() {
    browser.pause(200)
    return browser.$(".reportConflictTooltipContainer > div").getText()
  }

  get duration() {
    return browser.$("div[name='duration']").getText()
  }

  get location() {
    return browser.$("div[name='location']").getText()
  }

  get authors() {
    return browser.$("div[name='authors']").getText()
  }

  getAttendeeByName(name) {
    const row = browser
      .$$("#reportPeopleContainer tbody > tr")
      .find(
        r =>
          r.$("td.reportPeopleName").isExisting() &&
          r.$("td.reportPeopleName").getText() === name
      )

    if (!row) {
      return null
    }

    // wait for conflict loader to disappear
    row.$("td.conflictButton div.bp3-spinner").waitForExist({ reverse: true })

    return {
      name: row.$("td.reportPeopleName").getText(),
      conflictButton: row.$("td.conflictButton > span")
    }
  }

  open(uuid) {
    super.open(PAGE_URL.replace(":uuid", uuid))
  }

  waitForShowReportToLoad() {
    if (!this.reportStatus.isDisplayed()) {
      this.reportStatus.waitForExist()
      this.reportStatus.waitForDisplayed()
    }
  }
}

export default new ShowReport()
