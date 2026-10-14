import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import { currentPage, test, waitFor } from "../support.js"

test.describe("Show report page", () => {
  test.beforeEach("Open the show report page", async () => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A test report from Arthur",
      REPORT_STATES.PUBLISHED
    )
  })
  test.describe("When on the show page of a report with assessments", () => {
    test("We should see a table of tasks instant assessments related to the current report", async () => {
      await waitFor(
        await ShowReport.getTasksEngagementAssessments(
          "tasks-engagement-assessments"
        ),
        "visible"
      )

      // Should show the assessment labels
      const TASK1 = "1.2.A"
      await pwExpect(
        await ShowReport.getTaskEngagementAssessment(
          "tasks-engagement-assessments",
          TASK1
        )
      ).not.toHaveCount(0)
      const task1Assessment1Label =
        await ShowReport.getTaskEngagementAssessmentLabel(
          "tasks-engagement-assessments",
          TASK1,
          1
        )
      await pwExpect(task1Assessment1Label).not.toHaveCount(0)
      await pwExpect(task1Assessment1Label).toHaveText(
        "Restricted engagement assessment of objective",
        {
          useInnerText: true
        }
      )
      const task1Assessment2Label =
        await ShowReport.getTaskEngagementAssessmentLabel(
          "tasks-engagement-assessments",
          TASK1,
          3
        )
      await pwExpect(task1Assessment2Label).not.toHaveCount(0)
      await pwExpect(task1Assessment2Label).toHaveText(
        "Engagement assessment of objective",
        {
          useInnerText: true
        }
      )
      const TASK2 = "1.2.B"
      await pwExpect(
        await ShowReport.getTaskEngagementAssessment(
          "tasks-engagement-assessments",
          TASK2
        )
      ).not.toHaveCount(0)
      const task2Assessment1Label =
        await ShowReport.getTaskEngagementAssessmentLabel(
          "tasks-engagement-assessments",
          TASK2,
          1
        )
      await pwExpect(task2Assessment1Label).not.toHaveCount(0)
      await pwExpect(task2Assessment1Label).toHaveText(
        "Restricted engagement assessment of objective",
        {
          useInnerText: true
        }
      )
      const task2Assessment2Label =
        await ShowReport.getTaskEngagementAssessmentLabel(
          "tasks-engagement-assessments",
          TASK2,
          3
        )
      await pwExpect(task2Assessment2Label).not.toHaveCount(0)
      await pwExpect(task2Assessment2Label).toHaveText(
        "Engagement assessment of objective",
        {
          useInnerText: true
        }
      )

      // The tasks on the page have an svg type of assessment (LikertScale widgets)
      // and two other questions
      const svgAssessments = await (
        await ShowReport.getTasksEngagementAssessments(
          "tasks-engagement-assessments"
        )
      )
        .locator("svg")
        .all()
      expect(svgAssessments).to.have.length(4)
      const question2Assessments = await (
        await ShowReport.getTasksEngagementAssessments(
          "tasks-engagement-assessments"
        )
      )
        .locator("[name*=question2]")
        .all()
      expect(question2Assessments).to.have.length(4)
      const question3Assessments = await (
        await ShowReport.getTasksEngagementAssessments(
          "tasks-engagement-assessments"
        )
      )
        .locator("[name*=question3]")
        .all()
      expect(question3Assessments).to.have.length(4)
    })
  })
  test.describe("When on the show page of a report with attachment(s)", () => {
    test("We should see a container for Attachment List", async () => {
      // Attachment container
      await waitFor(await ShowReport.getAttachments(), "attached")
      await waitFor(await ShowReport.getAttachments(), "visible")
    })
    test("We should see a card of Attachment", async () => {
      // Attachment card list
      await waitFor(await ShowReport.getCard(), "attached")
      await waitFor(await ShowReport.getCard(), "visible")
      await pwExpect
        .poll(async () => await ShowReport.getClassificationLine())
        .toEqual("[NATO UNCLASSIFIED]")
      await pwExpect
        .poll(async () => await ShowReport.getCaptionLine())
        .toEqual("Arthur's test report")
    })
    test("We should be able to edit the attachments", async () => {
      const editAttachmentsButton = await ShowReport.getEditAttachmentsButton()
      await pwExpect(editAttachmentsButton).toHaveText("Edit attachments", {
        useInnerText: true
      })
      await editAttachmentsButton.click()
      await pwExpect(editAttachmentsButton).toHaveText("View attachments", {
        useInnerText: true
      })
      const editButton = await currentPage()
        .locator(".attachment-card .button-line a")
        .first()
      await pwExpect
        .poll(async () => await editButton.getAttribute("href"))
        .toContain("/attachments/f076406f-1a9b-4fc9-8ab2-cd2a138ec26d/edit")
      await editAttachmentsButton.click()
    })
    test("We can go to the show page of Attachment", async () => {
      await (await ShowReport.getImageClick()).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/attachments/f076406f-1a9b-4fc9-8ab2-cd2a138ec26d")
    })
  })
  test.describe("When on the show page of a report with many key outcomes and next steps", () => {
    test("We should see the key outcomes as a list", async () => {
      const keyOutcomes = await ShowReport.getKeyOutcomesList()
      expect(keyOutcomes).to.have.length(3)
      await pwExpect
        .poll(
          async () =>
            await Promise.all(keyOutcomes.map(async el => el.innerText()))
        )
        .toEqual([
          "have reports in organizations",
          "and test key outcomes",
          "and the next steps"
        ])
    })
    test("We should see the next steps as a list", async () => {
      const nextSteps = await ShowReport.getNextStepsList()
      expect(nextSteps).to.have.length(3)
      await pwExpect
        .poll(
          async () =>
            await Promise.all(nextSteps.map(async el => el.innerText()))
        )
        .toEqual(["keep on testing!", "and testing", "and testing"])
    })
  })
  test.describe("When on the show page of a report with reportCommunities", () => {
    test("We should see the reportCommunities", async () => {
      await pwExpect(
        currentPage().locator("div[name='reportCommunities']")
      ).toHaveText(
        "Name Description\nEF 1.1\nThe complete EF 1.1 organisation\nEF 5\nThe complete EF 5 organization",
        { useInnerText: true }
      )
    })
  })
})
const REPORT_CLASSIFICATION = "NATO UNCLASSIFIED"
test.describe("Show report page with classification", () => {
  test.beforeEach("Open the show report page", async () => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "A classified report from Arthur",
      REPORT_STATES.DRAFT
    )
  })
  test.describe("When on the show page of a report with classification", () => {
    test("We should see the classification related to the current report", async () => {
      await waitFor(await ShowReport.getClassification(), "attached")
      await waitFor(await ShowReport.getClassification(), "visible")
      await pwExpect(await ShowReport.getClassification()).toHaveText(
        REPORT_CLASSIFICATION,
        {
          useInnerText: true
        }
      )
    })
  })
})
