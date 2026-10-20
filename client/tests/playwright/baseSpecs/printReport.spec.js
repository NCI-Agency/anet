import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import Home from "../pages/home.page.js"
import MyReports, { REPORT_STATES } from "../pages/myReports.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import { currentPage, test, waitFor } from "../support.js"

const INTERLOCUTORS = [
  "OF-3 Chris Chrisville",
  "CIV Kyle Kyleson",
  "CIV Shardul Sharton"
]
const INTERLOCUTORS_WITH_ASSESSMENTS = INTERLOCUTORS
const ADVISORS = ["CIV Arthur Dmin", "CIV Lin Guist"]
const ADVISORS_WITH_ASSESSMENTS = ["CIV Lin Guist"]
const TASKS = [
  ["EF 1", "EF 1.2", "1.2.A"],
  ["EF 1", "EF 1.2", "1.2.B"]
]
const TASKS_WITH_ASSESSMENTS = TASKS.map(task => task.join("\n»\n"))
const DEFAULT_REPORT_CLASSIFICATION = "DEMO USE ONLY"
test.describe("Show print report page", () => {
  test.beforeEach("Open the show report page", async () => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A test report from Arthur",
      REPORT_STATES.PUBLISHED
    )
    await (await ShowReport.getCompactViewButton()).click()
    await waitFor(await ShowReport.getCompactView(), "attached")
    await waitFor(await ShowReport.getCompactView(), "visible")
  })
  test.describe("When on the print report page", () => {
    test("Detailed View button should remove compact view to detailed view", async () => {
      const detailedViewButton = await ShowReport.getDetailedViewButton()
      await detailedViewButton.click()
      await waitFor(await ShowReport.getDefaultReportView(), "attached")
      await waitFor(await ShowReport.getDefaultReportView(), "visible")
      await pwExpect(await ShowReport.getCompactView()).not.toBeVisible()
      await pwExpect(await ShowReport.getCompactViewButton()).toBeVisible()
    })
    test("We should see the correct report fields", async () => {
      const mustHaveFieldTexts = [
        "Engagement purpose",
        "Key outcomes",
        "Atmospherics",
        "Next steps",
        "Interlocutors",
        "Advisors",
        "Objectives",
        "Communities of interest"
      ]
      const fields = await ShowReport.getCompactReportFields()
      const fieldTexts = await Promise.all(
        fields.map(async field => (await field.innerText()).trim())
      )
      for (const mustHave of mustHaveFieldTexts) {
        expect(fieldTexts).to.contain(mustHave)
      }
    })
    test("We should see a title with the correct text", async () => {
      const title = (
        await (await ShowReport.getCompactTitle()).innerText()
      ).trim()
      expect(title).to.equal("Summary / Print")
    })
    test("We should see buttons with the correct text", async () => {
      const printButtonText = (
        await (await ShowReport.getPrintButton()).innerText()
      ).trim()
      const detailedViewButtonText = (
        await (await ShowReport.getDetailedViewButton()).innerText()
      ).trim()
      expect(printButtonText).to.equal("Print")
      expect(detailedViewButtonText).to.equal("Detailed View")
    })
    test("Printable report banner should be the same as security banner", async () => {
      const compactBannerText = (
        await (await ShowReport.getCompactBanner()).innerText()
      ).trim()
      await Home.openAsAdminUser()
      const bannerSecurityText = (
        await (await Home.getBannerSecurityText()).innerText()
      ).trim()
      expect(compactBannerText.replace(/\n/g, "")).to.equal(bannerSecurityText)
    })
    test("Should display all attendees", async () => {
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
    test("Should display all attendees when assessments are shown", async () => {
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
        await pwExpect(attendeeAssessmentLabel).not.toHaveCount(0)
        await pwExpect(attendeeAssessmentLabel).toHaveText(
          "Engagement assessment of interlocutor",
          {
            useInnerText: true
          }
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
        await pwExpect(attendeeAssessment1Label).not.toHaveCount(0)
        await pwExpect(attendeeAssessment1Label).toHaveText(
          "Engagement assessment of linguist",
          {
            useInnerText: true
          }
        )
        const attendeeAssessment2Label =
          await ShowReport.getAttendeeAssessmentLabel(
            "advisors-assessments",
            advisor,
            3
          )
        await pwExpect(attendeeAssessment2Label).not.toHaveCount(0)
        await pwExpect(attendeeAssessment2Label).toHaveText(
          "Engagement assessment of linguist Guist, Lin",
          {
            useInnerText: true
          }
        )
      }
    })
    test("Should display all tasks", async () => {
      const items = await currentPage().locator("#tasks > td > ul > li").all()
      const displayedTasks = []
      for (const item of items) {
        const links = await item.locator("a").all()
        const linkTexts = []
        for (const link of links) {
          linkTexts.push((await link.innerText()).trim())
        }
        displayedTasks.push(linkTexts)
      }
      expect(displayedTasks.length).to.equal(TASKS.length)
      for (const task of TASKS) {
        expect(displayedTasks).to.deep.include(task)
      }
    })
    test("Should display all tasks when assessments are shown", async () => {
      await ShowReport.selectOptionalField("assessments")
      const displayedTasks = await ShowReport.getCompactViewElements(
        "tasks-assessments",
        true
      )
      for (const task of TASKS_WITH_ASSESSMENTS) {
        expect(displayedTasks).to.contain(task)
        const taskShortName = task.split("\n»\n")?.pop()
        const taskAssessment1Label =
          await ShowReport.getTaskEngagementAssessmentLabel(
            "tasks-assessments",
            taskShortName,
            1
          )
        await pwExpect(taskAssessment1Label).not.toHaveCount(0)
        await pwExpect(taskAssessment1Label).toHaveText(
          "Restricted engagement assessment of objective",
          {
            useInnerText: true
          }
        )
        const taskAssessment2Label =
          await ShowReport.getTaskEngagementAssessmentLabel(
            "tasks-assessments",
            taskShortName,
            3
          )
        await pwExpect(taskAssessment2Label).not.toHaveCount(0)
        await pwExpect(taskAssessment2Label).toHaveText(
          "Engagement assessment of objective",
          {
            useInnerText: true
          }
        )
      }
    })
    test("Should display all reportCommunities", async () => {
      await pwExpect(
        currentPage().locator("table#reportCommunities")
      ).toHaveText(
        "Name Description\nEF 1.1 The complete EF 1.1 organisation\nEF 5 The complete EF 5 organization",
        { useInnerText: true }
      )
    })

    test("Should display attachment images only when enabled", async () => {
      await pwExpect(await ShowReport.getAttachmentsSection()).toHaveCount(0)
      await ShowReport.selectOptionalField("imageAttachments")
      await waitFor(await ShowReport.getAttachmentsSection(), "visible")
      const attachmentFigures = await ShowReport.getAttachmentFigures()
      expect(attachmentFigures.length).to.be.equal(1)
      const attachment = await attachmentFigures[0]
      await pwExpect(
        await ShowReport.getAttachmentClassification(attachment)
      ).toHaveText("[NATO UNCLASSIFIED]", {
        useInnerText: true
      })
      await pwExpect(
        await ShowReport.getAttachmentCaption(attachment)
      ).toHaveText("Arthur's test report", {
        useInnerText: true
      })
    })
  })
  test.describe("When on the print page of a report without classification", () => {
    test("We should see the default text for classification in the header and footer banners", async () => {
      await waitFor(await ShowReport.getClassificationHeader(), "attached")
      await waitFor(await ShowReport.getClassificationHeader(), "visible")
      await pwExpect(await ShowReport.getClassificationHeader()).toHaveText(
        DEFAULT_REPORT_CLASSIFICATION,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowReport.getClassificationFooter(), "attached")
      await waitFor(await ShowReport.getClassificationFooter(), "visible")
      await pwExpect(await ShowReport.getClassificationFooter()).toHaveText(
        DEFAULT_REPORT_CLASSIFICATION,
        {
          useInnerText: true
        }
      )
    })
  })
})
const REPORT_CLASSIFICATION = "NATO UNCLASSIFIED"
test.describe("Show print report page with classification", () => {
  test.beforeEach("Open the show report page", async () => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A classified report from Arthur",
      REPORT_STATES.DRAFT
    )
    await (await ShowReport.getCompactViewButton()).click()
    await waitFor(await ShowReport.getCompactView(), "attached")
    await waitFor(await ShowReport.getCompactView(), "visible")
  })
  test.describe("When on the print page of a report with classification", () => {
    test("We should see the classification in the header and footer banners", async () => {
      await waitFor(await ShowReport.getClassificationHeader(), "attached")
      await waitFor(await ShowReport.getClassificationHeader(), "visible")
      await pwExpect(await ShowReport.getClassificationHeader()).toHaveText(
        REPORT_CLASSIFICATION,
        {
          useInnerText: true
        }
      )
      await waitFor(await ShowReport.getClassificationFooter(), "attached")
      await waitFor(await ShowReport.getClassificationFooter(), "visible")
      await pwExpect(await ShowReport.getClassificationFooter()).toHaveText(
        REPORT_CLASSIFICATION,
        {
          useInnerText: true
        }
      )
    })
  })
})
