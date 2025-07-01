import { expect } from "chai"
import Home from "../pages/home.page"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import ShowReport from "../pages/report/showReport.page"

const INTERLOCUTORS = [
  "OF-3 CHRISVILLE, Chris",
  "CIV KYLESON, Kyle",
  "CIV SHARTON, Shardul"
]
const INTERLOCUTORS_WITH_ASSESSMENTS = INTERLOCUTORS

const ADVISORS = ["CIV DMIN, Arthur", "CIV GUIST, Lin"]
const ADVISORS_WITH_ASSESSMENTS = ["CIV GUIST, Lin"]

const TASKS = ["EF 1 » EF 1.2 » 1.2.A", "EF 1 » EF 1.2 » 1.2.B"]
const TASKS_WITH_ASSESSMENTS = TASKS

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
        "Next steps",
        "Interlocutors",
        "Advisors",
        "Objectives"
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
      expect(compactBannerText.replace(/\n/g, "")).to.equal(bannerSecurityText)
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
        "interlocutors-assessments",
        true
      )
      for (const interlocutor of INTERLOCUTORS_WITH_ASSESSMENTS) {
        expect(displayedInterlocutors).to.contain(interlocutor)

        const attendeeAssessmentLabel =
          await ShowReport.getAttendeeAssessmentLabel(
            "interlocutors-assessments",
            interlocutor,
            1
          )
        // eslint-disable-next-line no-unused-expressions
        expect(await attendeeAssessmentLabel.isExisting()).to.be.true
        expect(await attendeeAssessmentLabel.getText()).to.equal(
          "Engagement assessment of interlocutor"
        )
      }
      const displayedAdvisors = await ShowReport.getCompactViewElements(
        "advisors-assessments",
        true
      )
      for (const advisor of ADVISORS_WITH_ASSESSMENTS) {
        expect(displayedAdvisors).to.contain(advisor)

        const attendeeAssessment1Label =
          await ShowReport.getAttendeeAssessmentLabel(
            "advisors-assessments",
            advisor,
            1
          )
        // eslint-disable-next-line no-unused-expressions
        expect(await attendeeAssessment1Label.isExisting()).to.be.true
        expect(await attendeeAssessment1Label.getText()).to.equal(
          "Engagement assessment of linguist"
        )

        const attendeeAssessment2Label =
          await ShowReport.getAttendeeAssessmentLabel(
            "advisors-assessments",
            advisor,
            3
          )
        // eslint-disable-next-line no-unused-expressions
        expect(await attendeeAssessment2Label.isExisting()).to.be.true
        expect(await attendeeAssessment2Label.getText()).to.equal(
          "Engagement assessment of linguist Guist, Lin"
        )
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
        "tasks-assessments",
        true
      )
      for (const task of TASKS_WITH_ASSESSMENTS) {
        expect(displayedTasks).to.contain(task)

        const taskShortName = task.split(" » ")?.pop()
        const taskAssessment1Label =
          await ShowReport.getTaskEngagementAssessmentLabel(
            "tasks-assessments",
            taskShortName,
            1
          )
        // eslint-disable-next-line no-unused-expressions
        expect(await taskAssessment1Label.isExisting()).to.be.true
        expect(await taskAssessment1Label.getText()).to.equal(
          "Restricted engagement assessment of objective"
        )

        const taskAssessment2Label =
          await ShowReport.getTaskEngagementAssessmentLabel(
            "tasks-assessments",
            taskShortName,
            3
          )
        // eslint-disable-next-line no-unused-expressions
        expect(await taskAssessment2Label.isExisting()).to.be.true
        expect(await taskAssessment2Label.getText()).to.equal(
          "Engagement assessment of objective"
        )
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
