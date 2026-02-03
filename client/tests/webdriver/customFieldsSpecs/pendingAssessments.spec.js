import { expect } from "chai"
import moment from "moment"
import AssessmentsSection from "../pages/assessments.page"
import MyCounterparts from "../pages/myCounterparts.page"
import MyTasks from "../pages/myTasks.page"
import CreateReport from "../pages/report/createReport.page"

const SHORT_WAIT_MS = 1000

// Note: number of assessments are based on the base data, if that changes, change this test as well
describe("In my counterparts page", () => {
  describe("When Erin is checking the contents of the page", () => {
    it("Should see 1 counterpart in the table of pending my counterparts that has pending assessments", async () => {
      await MyCounterparts.open()
      await (await MyCounterparts.getMyPendingCounterparts()).waitForDisplayed()
      const myPendingCounterpartsItems = await (
        await MyCounterparts.getMyPendingCounterpartsBody()
      ).$$("tr")
      expect(myPendingCounterpartsItems).to.have.length(1)
    })
    it("Should be able to add a quarterly assessment with 4 questions for the counterpart", async () => {
      await (
        await MyCounterparts.getMyPendingCounterpart(
          "CIV TOPFERNESS, Christopf"
        )
      ).click()
      await (
        await AssessmentsSection.getAssessmentsSection(
          "interlocutorQuarterly",
          "quarterly"
        )
      ).waitForDisplayed()
      const newAssessmentButton =
        await AssessmentsSection.getNewAssessmentButton(
          "interlocutorQuarterly",
          "quarterly"
        )
      await newAssessmentButton.waitForDisplayed()
      await newAssessmentButton.click()
      await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      const modalContent = await AssessmentsSection.getModalContent()
      await modalContent.waitForDisplayed()
      await (await AssessmentsSection.getModalTitle()).waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion("test1")
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion("text")
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion(
            "questionSets.topLevelQs.questions.test2"
          )
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion(
            "questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3"
          )
        ).isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
      const closeButton = await AssessmentsSection.getModalCloseButton()
      await closeButton.waitForDisplayed()
      await closeButton.click()
      await modalContent.waitForDisplayed({
        reverse: true,
        timeout: SHORT_WAIT_MS
      })
      await MyCounterparts.logout()
    })
  })

  describe("When Jack is checking the contents of the page", () => {
    it("Should see an empty table of my counterparts that have pending assessments", async () => {
      await MyCounterparts.openAs("jack")
      await (await MyCounterparts.getMyPendingCounterparts()).waitForDisplayed()
      expect(
        await (await MyCounterparts.getMyPendingCounterpartsContent()).getText()
      ).to.equal("No positions found")
    })
    it("Should be able to add a quarterly assessment with 1 question for the counterpart", async () => {
      await (
        await MyCounterparts.getMyCounterpart("OF-3 ROGWELL, Roger")
      ).click()
      await (
        await AssessmentsSection.getAssessmentsSection(
          "interlocutorQuarterly",
          "quarterly"
        )
      ).waitForDisplayed()
      const newAssessmentButton =
        await AssessmentsSection.getNewAssessmentButton(
          "interlocutorQuarterly",
          "quarterly"
        )
      await newAssessmentButton.waitForDisplayed()
      await newAssessmentButton.click()
      await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      const modalContent = await AssessmentsSection.getModalContent()
      await modalContent.waitForDisplayed()
      await (await AssessmentsSection.getModalTitle()).waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion("test1")
        ).isExisting()
      ).to.be.false
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion("text")
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion(
            "questionSets.topLevelQs.questions.test2"
          )
        ).isExisting()
      ).to.be.false
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion(
            "questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3"
          )
        ).isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */
      const closeButton = await AssessmentsSection.getModalCloseButton()
      await closeButton.waitForDisplayed()
      await closeButton.click()
      await modalContent.waitForDisplayed({
        reverse: true,
        timeout: SHORT_WAIT_MS
      })
      await MyCounterparts.logout()
    })
  })
})

describe("In my tasks page", () => {
  describe("When Erin is checking the contents of the page", () => {
    it("Should see an empty table of my tasks that have pending assessments", async () => {
      await MyTasks.open()
      await (await MyTasks.getMyPendingTasks()).waitForDisplayed()
      expect(
        await (await MyTasks.getMyPendingTasksContent()).getText()
      ).to.equal("No Objectives found")
      await MyTasks.logout()
    })
  })

  describe("When Henry is checking the contents of the page", () => {
    it("Should see 2 tasks in the table of my tasks that have pending assessments", async () => {
      await MyTasks.openAs("henry")
      await (await MyTasks.getMyPendingTasks()).waitForDisplayed()
      const myPendingTasks = await (
        await MyTasks.getMyPendingTasksBody()
      ).$$("tr")
      expect(myPendingTasks).to.have.length(2)
    })
    it("Should be able to add a monthly assessment with 2 questions for the task", async () => {
      await (await MyTasks.getMyPendingTask("2.B")).click()
      await (
        await AssessmentsSection.getAssessmentsSection("taskMonthly", "monthly")
      ).waitForDisplayed()
      const newAssessmentButton =
        await AssessmentsSection.getNewAssessmentButton(
          "taskMonthly",
          "monthly"
        )
      await newAssessmentButton.waitForDisplayed()
      await newAssessmentButton.click()
      await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      const modalContent = await AssessmentsSection.getModalContent()
      await modalContent.waitForDisplayed()
      await (await AssessmentsSection.getModalTitle()).waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion("issues")
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion("status")
        ).isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
      const closeButton = await AssessmentsSection.getModalCloseButton()
      await closeButton.waitForDisplayed()
      await closeButton.click()
      await modalContent.waitForDisplayed({
        reverse: true,
        timeout: SHORT_WAIT_MS
      })
    })
    it("Should be able to add a weekly assessment with 1 question for the task", async () => {
      await (
        await AssessmentsSection.getAssessmentsSection("taskWeekly", "weekly")
      ).waitForDisplayed()
      const newAssessmentButton =
        await AssessmentsSection.getNewAssessmentButton("taskWeekly", "weekly")
      await newAssessmentButton.waitForDisplayed()
      await newAssessmentButton.click()
      await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      const modalContent = await AssessmentsSection.getModalContent()
      await modalContent.waitForDisplayed()
      await (await AssessmentsSection.getModalTitle()).waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion("issues")
        ).isExisting()
      ).to.be.true
      expect(
        await (
          await AssessmentsSection.getModalAssessmentQuestion("status")
        ).isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */
      const closeButton = await AssessmentsSection.getModalCloseButton()
      await closeButton.waitForDisplayed()
      await closeButton.click()
      await modalContent.waitForDisplayed({
        reverse: true,
        timeout: SHORT_WAIT_MS
      })
      await MyTasks.logout()
    })
  })
})

describe("In new report page", () => {
  describe("When Selena is creating a new report", () => {
    it("Should not show assessments without an engagement date", async () => {
      const report = {
        intent: "instant assessment test",
        engagementDate: moment().startOf("day")
      }
      await CreateReport.openAs("selena")
      /* eslint-disable no-unused-expressions */
      expect(await (await CreateReport.getAttendeesAssessments()).isExisting())
        .to.be.false
      expect(await (await CreateReport.getTasksAssessments()).isExisting()).to
        .be.false
      await CreateReport.fillForm(report)
      expect(await (await CreateReport.getAttendeesAssessments()).isExisting())
        .to.be.true
      expect(await (await CreateReport.getTasksAssessments()).isExisting()).to
        .be.true
      /* eslint-enable no-unused-expressions */
    })
    it("Should be able to add instant assessments for tasks", async () => {
      const report = {
        tasks: [{ name: "1.2.A first milestone", rowNumber: 3 }]
      }
      await CreateReport.fillForm(report)
      await browser.pause(SHORT_WAIT_MS) // wait for assessment questions to be updated
      await (await CreateReport.getTasksAssessments()).scrollIntoView()
      const taskAssessmentRows = await CreateReport.getTaskAssessmentRows()
      expect(taskAssessmentRows).to.have.length(5) // a heading and two assessments
      const task = taskAssessmentRows[0]
      for (let i = 1; i < 5; i += 2) {
        const label = taskAssessmentRows[i]
        const assessment = taskAssessmentRows[i + 1]
        const questions = await assessment.$$("td > div")
        expect(await label.getText()).to.equal(
          i === 1
            ? "Restricted engagement assessment of objective"
            : "Engagement assessment of objective"
        )
        const taskText = await task.getText()
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
    it("Should be able to add instant assessments for attendees", async () => {
      const report = {
        interlocutors: [
          "OF-3 ROGWELL, Roger",
          "OF-4 STEVESON, Steve",
          "CIV HUNTMAN, Hunter"
        ]
      }
      await CreateReport.fillForm(report)
      await browser.pause(SHORT_WAIT_MS) // wait for assessment questions to be updated
      await (await CreateReport.getAttendeesAssessments()).scrollIntoView()
      const attendeeAssessmentRows =
        await CreateReport.getAttendeeAssessmentRows()
      expect(attendeeAssessmentRows).to.have.length(9)
      for (let i = 0; i < 9; i += 3) {
        const attendee = attendeeAssessmentRows[i]
        const label = attendeeAssessmentRows[i + 1]
        const assessment = attendeeAssessmentRows[i + 2]
        expect(await label.getText()).to.equal(
          "Engagement assessment of interlocutor"
        )
        const questions = await assessment.$$("td > div")
        switch (await attendee.getText()) {
          case "OF-3 ROGWELL, Roger":
            expect(questions).to.have.length(2)
            expect(await questions[1].getAttribute("id")).to.match(
              /\.question2$/
            )
            break
          case "OF-4 STEVESON, Steve":
            expect(questions).to.have.length(2)
            expect(await questions[1].getAttribute("id")).to.match(
              /\.question3$/
            )
            break
          case "CIV HUNTMAN, Hunter":
            expect(questions).to.have.length(1)
            break
          default:
            expect.fail("unexpected attendee")
            break
        }
        expect(await questions[0].getAttribute("id")).to.match(/\.question1$/)
      }
    })
    it("Should have an additional question for positive atmosphere", async () => {
      await (await CreateReport.getPositiveAtmosphere()).click()
      await browser.pause(SHORT_WAIT_MS) // wait for assessment questions to be updated
      await (await CreateReport.getAttendeesAssessments()).scrollIntoView()
      const attendeeAssessmentRows =
        await CreateReport.getAttendeeAssessmentRows()
      expect(attendeeAssessmentRows).to.have.length(9)
      for (let i = 0; i < 9; i += 3) {
        const attendee = attendeeAssessmentRows[i]
        const label = attendeeAssessmentRows[i + 1]
        const assessment = attendeeAssessmentRows[i + 2]
        expect(await label.getText()).to.equal(
          "Engagement assessment of interlocutor"
        )
        const questions = await assessment.$$("td > div")
        switch (await attendee.getText()) {
          case "OF-3 ROGWELL, Roger":
            expect(questions).to.have.length(3)
            break
          case "OF-4 STEVESON, Steve":
            expect(questions).to.have.length(3)
            break
          case "CIV HUNTMAN, Hunter":
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
    it("Should be able to cancel/delete the report", async () => {
      if (!(await (await CreateReport.getDeleteButton()).isExisting())) {
        // Cancel the report
        await (await CreateReport.getCancelButton()).click()
      } else {
        // Delete it
        await (await CreateReport.getDeleteButton()).waitForExist()
        await (await CreateReport.getDeleteButton()).waitForDisplayed()
        await (await CreateReport.getDeleteButton()).click()
        // Confirm delete
        await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
        await (await CreateReport.getConfirmButton()).waitForExist()
        await (await CreateReport.getConfirmButton()).waitForDisplayed()
        await (await CreateReport.getConfirmButton()).click()
        await browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
        // Report should be deleted
        await CreateReport.waitForAlertToLoad()
        expect(
          await (await CreateReport.getAlertSuccess()).getText()
        ).to.include("Report deleted")
      }
    })
  })
})
