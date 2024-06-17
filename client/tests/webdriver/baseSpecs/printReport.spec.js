import { expect } from "chai"
import Home from "../pages/home.page"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"

const INTERLOCUTORS = [
  "OF-3 CHRISVILLE, Chris",
  "CIV KYLESON, Kyle",
  "CIV SHARTON, Shardul"
]

const ADVISORS = ["CIV DMIN, Arthur", "CIV GUIST, Lin"]

const TASKS = ["EF 1 » EF 1.2 » 1.2.A", "EF 1 » EF 1.2 » 1.2.B"]

const DEFAULT_REPORT_CLASSIFICATION = "DEMO USE ONLY"

describe("Show print report page", () => {
  beforeEach("Open the show report page", async() => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A test report from Arthur",
      REPORT_STATES.PUBLISHED
    )
    await (await ShowReport.getCompactViewButton()).click()
    await (await ShowReport.getCompactView()).waitForExist()
    await (await ShowReport.getCompactView()).waitForDisplayed()
  })
  describe("When on the print report page", () => {
    it("Detailed View button should remove compact view to detailed view", async() => {
      const detailedViewButton = await ShowReport.getDetailedViewButton()
      await detailedViewButton.click()
      await (await ShowReport.getDefaultReportView()).waitForExist()
      await (await ShowReport.getDefaultReportView()).waitForDisplayed()
      expect(await (await ShowReport.getCompactView()).isDisplayed()).to.equal(
        false
      )
      expect(
        await (await ShowReport.getCompactViewButton()).isDisplayed()
      ).to.equal(true)
    })
    it("We should see the correct report fields", async() => {
      const mustHaveFieldTexts = [
        "Engagement purpose",
        "Key outcomes",
        "Atmospherics",
        "Atmospherics details",
        "Next steps",
        "Interlocutors",
        "Advisors",
        "Efforts"
      ]
      const fields = await ShowReport.getCompactReportFields()
      const fieldTexts = await fields.map(async field => await field.getText())
      for (const mustHave of mustHaveFieldTexts) {
        expect(fieldTexts).to.contain(mustHave)
      }
    })
    it("We should see a title with the correct text", async() => {
      const title = await (await ShowReport.getCompactTitle()).getText()
      expect(title).to.equal("Summary / Print")
    })
    it("We should see buttons with the correct text", async() => {
      const printButtonText = await (
        await ShowReport.getPrintButton()
      ).getText()
      const detailedViewButtonText = await (
        await ShowReport.getDetailedViewButton()
      ).getText()
      expect(printButtonText).to.equal("Print")
      expect(detailedViewButtonText).to.equal("Detailed View")
    })
    it("Printable report banner should be the same as security banner", async() => {
      const compactBannerText = await (
        await ShowReport.getCompactBanner()
      ).getText()
      await Home.openAsAdminUser()
      const bannerSecurityText = await (
        await Home.getBannerSecurityText()
      ).getText()
      expect(compactBannerText).to.equal(bannerSecurityText)
    })
    it("Should display all attendees", async() => {
      const displayedInterlocutors =
        await ShowReport.getCompactViewElements("interlocutors")
      const displayedAdvisors =
        await ShowReport.getCompactViewElements("advisors")
      for (const interlocutor of INTERLOCUTORS) {
        expect(displayedInterlocutors).to.contain(interlocutor)
      }
      for (const advisor of ADVISORS) {
        expect(displayedAdvisors).to.contain(advisor)
      }
    })
    it("Should display all attendees when assessments are shown", async() => {
      await ShowReport.selectOptionalField("assessments")
      const displayedInterlocutors = await ShowReport.getCompactViewElements(
        "interlocutors",
        true
      )
      for (const interlocutor of INTERLOCUTORS) {
        expect(displayedInterlocutors).to.contain(interlocutor)
      }
      const displayedAdvisors = await ShowReport.getCompactViewElements(
        "advisors",
        true
      )
      for (const advisor of ADVISORS) {
        expect(displayedAdvisors).to.contain(advisor)
      }
    })
    it("Should display all tasks", async() => {
      const displayedTasks = await ShowReport.getCompactViewElements("tasks")
      for (const task of TASKS) {
        expect(displayedTasks).to.contain(task)
      }
    })
    it("Should display all tasks when assessments are shown", async() => {
      await ShowReport.selectOptionalField("assessments")
      const displayedTasks = await ShowReport.getCompactViewElements(
        "tasks",
        true
      )
      for (const task of TASKS) {
        expect(displayedTasks).to.contain(task)
      }
    })
  })
  describe("When on the print page of a report without classification", () => {
    it("We should see the default text for classification in the header and footer banners", async() => {
      await (await ShowReport.getClassificationHeader()).waitForExist()
      await (await ShowReport.getClassificationHeader()).waitForDisplayed()
      expect(
        await (await ShowReport.getClassificationHeader()).getText()
      ).to.equal(DEFAULT_REPORT_CLASSIFICATION)
      await (await ShowReport.getClassificationFooter()).waitForExist()
      await (await ShowReport.getClassificationFooter()).waitForDisplayed()
      expect(
        await (await ShowReport.getClassificationFooter()).getText()
      ).to.equal(DEFAULT_REPORT_CLASSIFICATION)
    })
  })
})

const REPORT_CLASSIFICATION = "NATO UNCLASSIFIED"
describe("Show print report page with classification", () => {
  beforeEach("Open the show report page", async() => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A classified report from Arthur",
      REPORT_STATES.DRAFT
    )
    await (await ShowReport.getCompactViewButton()).click()
    await (await ShowReport.getCompactView()).waitForExist()
    await (await ShowReport.getCompactView()).waitForDisplayed()
  })
  describe("When on the print page of a report with classification", () => {
    it("We should see the classification in the header and footer banners", async() => {
      await (await ShowReport.getClassificationHeader()).waitForExist()
      await (await ShowReport.getClassificationHeader()).waitForDisplayed()
      expect(
        await (await ShowReport.getClassificationHeader()).getText()
      ).to.equal(REPORT_CLASSIFICATION)
      await (await ShowReport.getClassificationFooter()).waitForExist()
      await (await ShowReport.getClassificationFooter()).waitForDisplayed()
      expect(
        await (await ShowReport.getClassificationFooter()).getText()
      ).to.equal(REPORT_CLASSIFICATION)
    })
  })
})
