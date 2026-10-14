import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import moment from "moment"
import AssessmentsSection from "../pages/assessments.page.js"
import MyCounterparts from "../pages/myCounterparts.page.js"
import MyTasks from "../pages/myTasks.page.js"
import CreateReport from "../pages/report/createReport.page.js"
import { test, waitFor } from "../support.js"

// Note: number of assessments are based on the base data, if that changes, change this test as well
test.describe("In my counterparts page", () => {
  test.describe("When Erin is checking the contents of the page", () => {
    test("Should see 1 counterpart in the table of pending my counterparts that has pending assessments", async () => {
      await MyCounterparts.open()
      await waitFor(await MyCounterparts.getMyPendingCounterparts(), "visible")
      const myPendingCounterpartsItems = await (
        await MyCounterparts.getMyPendingCounterpartsBody()
      )
        .locator("tr")
        .all()
      expect(myPendingCounterpartsItems).to.have.length(1)
    })
    test("Should be able to add a quarterly assessment with 4 questions for the counterpart", async () => {
      await (
        await MyCounterparts.getMyPendingCounterpart("CIV Christopf Topferness")
      ).click()
      await waitFor(
        await AssessmentsSection.getAssessmentsSection(
          "interlocutorQuarterly",
          "quarterly"
        ),
        "visible"
      )
      const newAssessmentButton =
        await AssessmentsSection.getNewAssessmentButton(
          "interlocutorQuarterly",
          "quarterly"
        )
      await waitFor(newAssessmentButton, "visible")
      await newAssessmentButton.click()
      // wait for the modal to slide in (transition is 300 ms)
      const modalContent = await AssessmentsSection.getModalContent()
      await waitFor(modalContent, "visible")
      await waitFor(await AssessmentsSection.getModalTitle(), "visible")
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion("test1")
      ).not.toHaveCount(0)
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion("text")
      ).not.toHaveCount(0)
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion(
          "questionSets.topLevelQs.questions.test2"
        )
      ).not.toHaveCount(0)
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion(
          "questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3"
        )
      ).not.toHaveCount(0)
      const closeButton = await AssessmentsSection.getModalCloseButton()
      await waitFor(closeButton, "visible")
      await closeButton.click()
      await waitFor(modalContent, "visible", {
        reverse: true,
        timeout: 10000
      })
      await MyCounterparts.logout()
    })
  })
  test.describe("When Jack is checking the contents of the page", () => {
    test("Should see an empty table of my counterparts that have pending assessments", async () => {
      await MyCounterparts.openAs("jack")
      await waitFor(await MyCounterparts.getMyPendingCounterparts(), "visible")
      await pwExpect(
        await MyCounterparts.getMyPendingCounterpartsContent()
      ).toHaveText("No positions found", {
        useInnerText: true
      })
    })
    test("Should be able to add a quarterly assessment with 1 question for the counterpart", async () => {
      await (
        await MyCounterparts.getMyCounterpart("OF-3 Roger Rogwell")
      ).click()
      await waitFor(
        await AssessmentsSection.getAssessmentsSection(
          "interlocutorQuarterly",
          "quarterly"
        ),
        "visible"
      )
      const newAssessmentButton =
        await AssessmentsSection.getNewAssessmentButton(
          "interlocutorQuarterly",
          "quarterly"
        )
      await waitFor(newAssessmentButton, "visible")
      await newAssessmentButton.click()
      // wait for the modal to slide in (transition is 300 ms)
      const modalContent = await AssessmentsSection.getModalContent()
      await waitFor(modalContent, "visible")
      await waitFor(await AssessmentsSection.getModalTitle(), "visible")
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion("test1")
      ).toHaveCount(0)
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion("text")
      ).not.toHaveCount(0)
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion(
          "questionSets.topLevelQs.questions.test2"
        )
      ).toHaveCount(0)
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion(
          "questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3"
        )
      ).toHaveCount(0)
      const closeButton = await AssessmentsSection.getModalCloseButton()
      await waitFor(closeButton, "visible")
      await closeButton.click()
      await waitFor(modalContent, "visible", {
        reverse: true,
        timeout: 10000
      })
      await MyCounterparts.logout()
    })
  })
})
test.describe("In my tasks page", () => {
  test.describe("When Erin is checking the contents of the page", () => {
    test("Should see an empty table of my tasks that have pending assessments", async () => {
      await MyTasks.open()
      await waitFor(await MyTasks.getMyPendingTasks(), "visible")
      await pwExpect(await MyTasks.getMyPendingTasksContent()).toHaveText(
        "No Objectives found",
        {
          useInnerText: true
        }
      )
      await MyTasks.logout()
    })
  })
  test.describe("When Henry is checking the contents of the page", () => {
    test("Should see 2 tasks in the table of my tasks that have pending assessments", async () => {
      await MyTasks.openAs("henry")
      await waitFor(await MyTasks.getMyPendingTasks(), "visible")
      const myPendingTasks = await (
        await MyTasks.getMyPendingTasksBody()
      )
        .locator("tr")
        .all()
      expect(myPendingTasks).to.have.length(2)
    })
    test("Should be able to add a monthly assessment with 2 questions for the task", async () => {
      await (await MyTasks.getMyPendingTask("2.B")).click()
      await waitFor(
        await AssessmentsSection.getAssessmentsSection(
          "taskMonthly",
          "monthly"
        ),
        "visible"
      )
      const newAssessmentButton =
        await AssessmentsSection.getNewAssessmentButton(
          "taskMonthly",
          "monthly"
        )
      await waitFor(newAssessmentButton, "visible")
      await newAssessmentButton.click()
      // wait for the modal to slide in (transition is 300 ms)
      const modalContent = await AssessmentsSection.getModalContent()
      await waitFor(modalContent, "visible")
      await waitFor(await AssessmentsSection.getModalTitle(), "visible")
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion("issues")
      ).not.toHaveCount(0)
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion("status")
      ).not.toHaveCount(0)
      const closeButton = await AssessmentsSection.getModalCloseButton()
      await waitFor(closeButton, "visible")
      await closeButton.click()
      await waitFor(modalContent, "visible", {
        reverse: true,
        timeout: 10000
      })
    })
    test("Should be able to add a weekly assessment with 1 question for the task", async () => {
      await waitFor(
        await AssessmentsSection.getAssessmentsSection("taskWeekly", "weekly"),
        "visible"
      )
      const newAssessmentButton =
        await AssessmentsSection.getNewAssessmentButton("taskWeekly", "weekly")
      await waitFor(newAssessmentButton, "visible")
      await newAssessmentButton.click()
      // wait for the modal to slide in (transition is 300 ms)
      const modalContent = await AssessmentsSection.getModalContent()
      await waitFor(modalContent, "visible")
      await waitFor(await AssessmentsSection.getModalTitle(), "visible")
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion("issues")
      ).not.toHaveCount(0)
      await pwExpect(
        await AssessmentsSection.getModalAssessmentQuestion("status")
      ).toHaveCount(0)
      const closeButton = await AssessmentsSection.getModalCloseButton()
      await waitFor(closeButton, "visible")
      await closeButton.click()
      await waitFor(modalContent, "visible", {
        reverse: true,
        timeout: 10000
      })
      await MyTasks.logout()
    })
  })
})
test.describe("In new report page", () => {
  test.describe("When Selena is creating a new report", () => {
    test("Should not show assessments without an engagement date", async () => {
      const report = {
        intent: "instant assessment test",
        engagementDate: moment().startOf("day")
      }
      await CreateReport.openAs("selena")
      await pwExpect(await CreateReport.getAttendeesAssessments()).toHaveCount(
        0
      )
      await pwExpect(await CreateReport.getTasksAssessments()).toHaveCount(0)
      await CreateReport.fillForm(report)
      await pwExpect(
        await CreateReport.getAttendeesAssessments()
      ).not.toHaveCount(0)
      await pwExpect(await CreateReport.getTasksAssessments()).not.toHaveCount(
        0
      )
    })
    test("Should be able to add instant assessments for tasks", async () => {
      const report = {
        tasks: [
          {
            name: "1.2.A first milestone",
            rowNumber: 3
          }
        ]
      }
      await CreateReport.fillForm(report)
      // wait for assessment questions to be updated
      await (await CreateReport.getTasksAssessments()).scrollIntoViewIfNeeded()
      const taskAssessmentRows = await CreateReport.getTaskAssessmentRows()
      expect(taskAssessmentRows).to.have.length(5) // a heading and two assessments
      const task = taskAssessmentRows[0]
      for (let i = 1; i < 5; i += 2) {
        const label = taskAssessmentRows[i]
        const assessment = taskAssessmentRows[i + 1]
        const questions = await assessment.locator("td > div").all()
        await pwExpect(label).toHaveText(
          i === 1
            ? "Restricted engagement assessment of objective"
            : "Engagement assessment of objective",
          {
            useInnerText: true
          }
        )
        const taskText = (await task.innerText()).trim()
        switch (taskText) {
          case "EF 1\n»\nEF 1.2\n»\n1.2.A":
            expect(questions).to.have.length(3)
            expect(await questions[0].getAttribute("id")).to.match(
              /\.question1$/
            )
            expect(await questions[1].getAttribute("id")).to.match(
              /\.question2$/
            )
            expect(await questions[2].getAttribute("id")).to.match(
              /\.question3$/
            )
            break
          default:
            expect.fail(`unexpected task: ${taskText}`)
            break
        }
      }
    })
    test("Should be able to add instant assessments for attendees", async () => {
      const report = {
        interlocutors: [
          "OF-3 Roger Rogwell",
          "OF-4 Steve Steveson",
          "CIV Hunter Huntman"
        ]
      }
      await CreateReport.fillForm(report)
      // wait for assessment questions to be updated
      await (
        await CreateReport.getAttendeesAssessments()
      ).scrollIntoViewIfNeeded()
      const attendeeAssessmentRows =
        await CreateReport.getAttendeeAssessmentRows()
      expect(attendeeAssessmentRows).to.have.length(9)
      for (let i = 0; i < 9; i += 3) {
        const attendee = attendeeAssessmentRows[i]
        const label = attendeeAssessmentRows[i + 1]
        const assessment = attendeeAssessmentRows[i + 2]
        await pwExpect(label).toHaveText(
          "Engagement assessment of interlocutor",
          {
            useInnerText: true
          }
        )
        const questions = await assessment.locator("td > div").all()
        switch ((await attendee.innerText()).trim()) {
          case "OF-3 Roger Rogwell":
            expect(questions).to.have.length(2)
            expect(await questions[1].getAttribute("id")).to.match(
              /\.question2$/
            )
            break
          case "OF-4 Steve Steveson":
            expect(questions).to.have.length(2)
            expect(await questions[1].getAttribute("id")).to.match(
              /\.question3$/
            )
            break
          case "CIV Hunter Huntman":
            expect(questions).to.have.length(1)
            break
          default:
            expect.fail("unexpected attendee")
            break
        }
        expect(await questions[0].getAttribute("id")).to.match(/\.question1$/)
      }
    })
    test("Should have an additional question for positive atmosphere", async () => {
      await (await CreateReport.getPositiveAtmosphere()).click()
      // wait for assessment questions to be updated
      await (
        await CreateReport.getAttendeesAssessments()
      ).scrollIntoViewIfNeeded()
      const attendeeAssessmentRows =
        await CreateReport.getAttendeeAssessmentRows()
      expect(attendeeAssessmentRows).to.have.length(9)
      for (let i = 0; i < 9; i += 3) {
        const attendee = attendeeAssessmentRows[i]
        const label = attendeeAssessmentRows[i + 1]
        const assessment = attendeeAssessmentRows[i + 2]
        await pwExpect(label).toHaveText(
          "Engagement assessment of interlocutor",
          {
            useInnerText: true
          }
        )
        const questions = await assessment.locator("td > div").all()
        switch ((await attendee.innerText()).trim()) {
          case "OF-3 Roger Rogwell":
            expect(questions).to.have.length(3)
            break
          case "OF-4 Steve Steveson":
            expect(questions).to.have.length(3)
            break
          case "CIV Hunter Huntman":
            expect(questions).to.have.length(2)
            break
          default:
            expect.fail("unexpected attendee")
            break
        }
        expect(
          await questions[questions.length - 1].getAttribute("id")
        ).to.match(/\.question4$/)
      }
    })
    test("Should be able to cancel/delete the report", async () => {
      if (!((await (await CreateReport.getDeleteButton()).count()) > 0)) {
        // Cancel the report
        await (await CreateReport.getCancelButton()).click()
      } else {
        // Delete it
        await waitFor(await CreateReport.getDeleteButton(), "attached")
        await waitFor(await CreateReport.getDeleteButton(), "visible")
        await (await CreateReport.getDeleteButton()).click()
        // Confirm delete

        // wait for the modal to slide in (transition is 300 ms)
        await waitFor(await CreateReport.getConfirmButton(), "attached")
        await waitFor(await CreateReport.getConfirmButton(), "visible")
        await (await CreateReport.getConfirmButton()).click()
        // wait for the modal to slide out (transition is 300 ms)
        // Report should be deleted
        await CreateReport.waitForAlertToLoad()
        await pwExpect(await CreateReport.getAlertSuccess()).toContainText(
          "Report deleted",
          {
            useInnerText: true
          }
        )
      }
    })
  })
})
