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
    it("Should see 1 counterpart in the table of pending my counterparts that has pending assessments", () => {
      MyCounterparts.open()
      MyCounterparts.myPendingCounterparts.waitForDisplayed()
      const myPendingCounterpartsItems = MyCounterparts.myPendingCounterpartsContent.$$(
        "tr"
      )
      expect(myPendingCounterpartsItems).to.have.length(1)
      MyCounterparts.getMyPendingCounterpart(
        "CIV TOPFERNESS, Christopf"
      ).click()
    })
    it("Should be able to add a quarterly assessment with 4 questions for the counterpart", () => {
      AssessmentsSection.getAssessmentsSection("quarterly").waitForDisplayed()
      const newAssessmentButton = AssessmentsSection.getNewAssessmentButton(
        "quarterly"
      )
      newAssessmentButton.waitForDisplayed()
      newAssessmentButton.click()
      const modalContent = AssessmentsSection.modalContent
      modalContent.waitForDisplayed()
      AssessmentsSection.modalTitle.waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        AssessmentsSection.getModalAssessmentQuestion("test1").isExisting()
      ).to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion("test2").isExisting()
      ).to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion("test3").isExisting()
      ).to.be.true
      expect(AssessmentsSection.getModalAssessmentQuestion("text").isExisting())
        .to.be.true
      /* eslint-enable no-unused-expressions */
      const cancelButton = AssessmentsSection.modalCancelButton
      cancelButton.waitForDisplayed()
      cancelButton.click()
      modalContent.waitForDisplayed({ reverse: true, timeout: SHORT_WAIT_MS })
    })
  })

  describe("When Jack is checking the contents of the page", () => {
    it("Should see no counterparts in the table of pending my counterparts that has pending assessments", () => {
      MyCounterparts.openAs("jack")
      MyCounterparts.myPendingCounterparts.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(MyCounterparts.myPendingCounterpartsContent.isExisting()).to.be
        .false
      MyCounterparts.getMyCounterpart("Maj ROGWELL, Roger").click()
    })
    it("Should be able to add a quarterly assessment with 1 question for the counterpart", () => {
      AssessmentsSection.getAssessmentsSection("quarterly").waitForDisplayed()
      const newAssessmentButton = AssessmentsSection.getNewAssessmentButton(
        "quarterly"
      )
      newAssessmentButton.waitForDisplayed()
      newAssessmentButton.click()
      const modalContent = AssessmentsSection.modalContent
      modalContent.waitForDisplayed()
      AssessmentsSection.modalTitle.waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        AssessmentsSection.getModalAssessmentQuestion("test1").isExisting()
      ).to.be.false
      expect(
        AssessmentsSection.getModalAssessmentQuestion("test2").isExisting()
      ).to.be.false
      expect(
        AssessmentsSection.getModalAssessmentQuestion("test3").isExisting()
      ).to.be.false
      expect(AssessmentsSection.getModalAssessmentQuestion("text").isExisting())
        .to.be.true
      /* eslint-enable no-unused-expressions */
      const cancelButton = AssessmentsSection.modalCancelButton
      cancelButton.waitForDisplayed()
      cancelButton.click()
      modalContent.waitForDisplayed({ reverse: true, timeout: SHORT_WAIT_MS })
    })
  })
})

describe("In my tasks page", () => {
  describe("When Erin is checking the contents of the page", () => {
    it("Should see an empty table of my tasks that have pending assessments", () => {
      MyTasks.open()
      MyTasks.myPendingTasks.waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(MyTasks.myPendingTasksContent.isExisting()).to.be.false
    })
  })

  describe("When Jack is checking the contents of the page", () => {
    it("Should see 1 task in the table of my tasks that has pending assessments", () => {
      MyTasks.openAs("jack")
      MyTasks.myPendingTasks.waitForDisplayed()
      const myPendingTasks = MyTasks.myPendingTasksContent.$$("tr")
      expect(myPendingTasks).to.have.length(1)
      MyTasks.getMyPendingTask("2.B").click()
    })
    it("Should be able to add a monthly assessment with 2 questions for the task", () => {
      AssessmentsSection.getAssessmentsSection("monthly").waitForDisplayed()
      const newAssessmentButton = AssessmentsSection.getNewAssessmentButton(
        "monthly"
      )
      newAssessmentButton.waitForDisplayed()
      newAssessmentButton.click()
      const modalContent = AssessmentsSection.modalContent
      modalContent.waitForDisplayed()
      AssessmentsSection.modalTitle.waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        AssessmentsSection.getModalAssessmentQuestion("issues").isExisting()
      ).to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion("status").isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
      const cancelButton = AssessmentsSection.modalCancelButton
      cancelButton.waitForDisplayed()
      cancelButton.click()
      modalContent.waitForDisplayed({ reverse: true, timeout: SHORT_WAIT_MS })
    })
    it("Should be able to add a weekly assessment with 1 question for the task", () => {
      AssessmentsSection.getAssessmentsSection("weekly").waitForDisplayed()
      const newAssessmentButton = AssessmentsSection.getNewAssessmentButton(
        "weekly"
      )
      newAssessmentButton.waitForDisplayed()
      newAssessmentButton.click()
      const modalContent = AssessmentsSection.modalContent
      modalContent.waitForDisplayed()
      AssessmentsSection.modalTitle.waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        AssessmentsSection.getModalAssessmentQuestion("issues").isExisting()
      ).to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion("status").isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */
      const cancelButton = AssessmentsSection.modalCancelButton
      cancelButton.waitForDisplayed()
      cancelButton.click()
      modalContent.waitForDisplayed({ reverse: true, timeout: SHORT_WAIT_MS })
    })
  })
})

describe("In new report page", () => {
  describe("When Selena is creating a new report", () => {
    it("Should not show assessments without an engagement date", () => {
      const report = {
        intent: "instant assessment test",
        engagementDate: moment().startOf("day")
      }
      CreateReport.openAs("selena")
      /* eslint-disable no-unused-expressions */
      expect(CreateReport.attendeesAssessments.isExisting()).to.be.false
      expect(CreateReport.tasksAssessments.isExisting()).to.be.false
      CreateReport.fillForm(report)
      expect(CreateReport.attendeesAssessments.isExisting()).to.be.true
      expect(CreateReport.tasksAssessments.isExisting()).to.be.true
      /* eslint-enable no-unused-expressions */
    })
    it("Should be able to add instant assessments for tasks", () => {
      const report = {
        tasks: ["1.2.A"]
      }
      CreateReport.fillForm(report)
      const taskAssessmentRows = CreateReport.taskAssessmentRows
      expect(taskAssessmentRows).to.have.length(2)
      for (let i = 0; i < 2; i += 2) {
        const task = taskAssessmentRows[i]
        const assessment = taskAssessmentRows[i + 1]
        const questions = assessment.$$("td > div")
        switch (task.getText()) {
          case "1.2.A":
            expect(questions).to.have.length(3)
            expect(questions[0].getAttribute("id")).to.match(/\.question1$/)
            expect(questions[1].getAttribute("id")).to.match(/\.question2$/)
            expect(questions[2].getAttribute("id")).to.match(/\.question3$/)
            break
          default:
            expect.fail("unexpected task")
            break
        }
      }
    })
    it("Should be able to add instant assessments for attendees", () => {
      const report = {
        principals: [
          "Maj ROGWELL, Roger",
          "LtCol STEVESON, Steve",
          "CIV HUNTMAN, Hunter"
        ]
      }
      CreateReport.fillForm(report)
      const attendeeAssessmentRows = CreateReport.attendeeAssessmentRows
      expect(attendeeAssessmentRows).to.have.length(6)
      for (let i = 0; i < 6; i += 2) {
        const attendee = attendeeAssessmentRows[i]
        const assessment = attendeeAssessmentRows[i + 1]
        const questions = assessment.$$("td > div")
        switch (attendee.getText()) {
          case "Maj ROGWELL, Roger":
            expect(questions).to.have.length(2)
            expect(questions[1].getAttribute("id")).to.match(/\.question2$/)
            break
          case "LtCol STEVESON, Steve":
            expect(questions).to.have.length(2)
            expect(questions[1].getAttribute("id")).to.match(/\.question3$/)
            break
          case "CIV HUNTMAN, Hunter":
            expect(questions).to.have.length(1)
            break
          default:
            expect.fail("unexpected attendee")
            break
        }
        expect(questions[0].getAttribute("id")).to.match(/\.question1$/)
      }
    })
    it("Should have an additional question for positive atmosphere", () => {
      CreateReport.positiveAtmosphere.click()
      const attendeeAssessmentRows = CreateReport.attendeeAssessmentRows
      expect(attendeeAssessmentRows).to.have.length(6)
      for (let i = 0; i < 6; i += 2) {
        const attendee = attendeeAssessmentRows[i]
        const assessment = attendeeAssessmentRows[i + 1]
        const questions = assessment.$$("td > div")
        switch (attendee.getText()) {
          case "Maj ROGWELL, Roger":
            expect(questions).to.have.length(3)
            break
          case "LtCol STEVESON, Steve":
            expect(questions).to.have.length(3)
            break
          case "CIV HUNTMAN, Hunter":
            expect(questions).to.have.length(2)
            break
          default:
            expect.fail("unexpected attendee")
            break
        }
        expect(questions[questions.length - 1].getAttribute("id")).to.match(
          /\.question4$/
        )
      }
    })
    it("Should be able to cancel/delete the report", () => {
      if (!CreateReport.deleteButton.isExisting()) {
        // Cancel the report
        CreateReport.cancelButton.click()
      } else {
        // Delete it
        CreateReport.deleteButton.waitForExist()
        CreateReport.deleteButton.waitForDisplayed()
        CreateReport.deleteButton.click()
        // Confirm delete
        browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
        CreateReport.confirmButton.waitForExist()
        CreateReport.confirmButton.waitForDisplayed()
        CreateReport.confirmButton.click()
        browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
        // Report should be deleted
        CreateReport.waitForAlertToLoad()
        expect(CreateReport.alert.getText()).to.include("Report deleted")
      }
    })
  })
})
