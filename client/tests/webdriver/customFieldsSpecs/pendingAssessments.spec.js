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
      MyCounterparts.getMyPendingCounterparts().waitForDisplayed()
      const myPendingCounterpartsItems =
        MyCounterparts.getMyPendingCounterpartsContent().$$("tr")
      expect(myPendingCounterpartsItems).to.have.length(1)
      MyCounterparts.getMyPendingCounterpart(
        "CIV TOPFERNESS, Christopf"
      ).click()
    })
    it("Should be able to add a quarterly assessment with 4 questions for the counterpart", () => {
      AssessmentsSection.getAssessmentsSection("quarterly").waitForDisplayed()
      const newAssessmentButton =
        AssessmentsSection.getNewAssessmentButton("quarterly")
      newAssessmentButton.waitForDisplayed()
      newAssessmentButton.click()
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      const modalContent = AssessmentsSection.getModalContent()
      modalContent.waitForDisplayed()
      AssessmentsSection.getModalTitle().waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        AssessmentsSection.getModalAssessmentQuestion("test1").isExisting()
      ).to.be.true
      expect(AssessmentsSection.getModalAssessmentQuestion("text").isExisting())
        .to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion(
          "questionSets.topLevelQs.questions.test2"
        ).isExisting()
      ).to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion(
          "questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3"
        ).isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
      const closeButton = AssessmentsSection.getModalCloseButton()
      closeButton.waitForDisplayed()
      closeButton.click()
      modalContent.waitForDisplayed({ reverse: true, timeout: SHORT_WAIT_MS })
      MyCounterparts.logout()
    })
  })

  describe("When Jack is checking the contents of the page", () => {
    it("Should see no counterparts in the table of pending my counterparts that has pending assessments", () => {
      MyCounterparts.openAs("jack")
      MyCounterparts.getMyPendingCounterparts().waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(MyCounterparts.getMyPendingCounterpartsContent().isExisting()).to
        .be.false
      MyCounterparts.getMyCounterpart("Maj ROGWELL, Roger").click()
    })
    it("Should be able to add a quarterly assessment with 1 question for the counterpart", () => {
      AssessmentsSection.getAssessmentsSection("quarterly").waitForDisplayed()
      const newAssessmentButton =
        AssessmentsSection.getNewAssessmentButton("quarterly")
      newAssessmentButton.waitForDisplayed()
      newAssessmentButton.click()
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      const modalContent = AssessmentsSection.getModalContent()
      modalContent.waitForDisplayed()
      AssessmentsSection.getModalTitle().waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        AssessmentsSection.getModalAssessmentQuestion("test1").isExisting()
      ).to.be.false
      expect(AssessmentsSection.getModalAssessmentQuestion("text").isExisting())
        .to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion(
          "questionSets.topLevelQs.questions.test2"
        ).isExisting()
      ).to.be.false
      expect(
        AssessmentsSection.getModalAssessmentQuestion(
          "questionSets.topLevelQs.questionSets.bottomLevelQs.questions.test3"
        ).isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */
      const closeButton = AssessmentsSection.getModalCloseButton()
      closeButton.waitForDisplayed()
      closeButton.click()
      modalContent.waitForDisplayed({ reverse: true, timeout: SHORT_WAIT_MS })
      MyCounterparts.logout()
    })
  })
})

describe("In my tasks page", () => {
  describe("When Erin is checking the contents of the page", () => {
    it("Should see an empty table of my tasks that have pending assessments", () => {
      MyTasks.open()
      MyTasks.getMyPendingTasks().waitForDisplayed()
      // eslint-disable-next-line no-unused-expressions
      expect(MyTasks.getMyPendingTasksContent().isExisting()).to.be.false
      MyTasks.logout()
    })
  })

  describe("When Jack is checking the contents of the page", () => {
    it("Should see 1 task in the table of my tasks that has pending assessments", () => {
      MyTasks.openAs("jack")
      MyTasks.getMyPendingTasks().waitForDisplayed()
      const myPendingTasks = MyTasks.getMyPendingTasksContent().$$("tr")
      expect(myPendingTasks).to.have.length(1)
      MyTasks.getMyPendingTask("2.B").click()
    })
    it("Should be able to add a monthly assessment with 2 questions for the task", () => {
      AssessmentsSection.getAssessmentsSection("monthly").waitForDisplayed()
      const newAssessmentButton =
        AssessmentsSection.getNewAssessmentButton("monthly")
      newAssessmentButton.waitForDisplayed()
      newAssessmentButton.click()
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      const modalContent = AssessmentsSection.getModalContent()
      modalContent.waitForDisplayed()
      AssessmentsSection.getModalTitle().waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        AssessmentsSection.getModalAssessmentQuestion("issues").isExisting()
      ).to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion("status").isExisting()
      ).to.be.true
      /* eslint-enable no-unused-expressions */
      const closeButton = AssessmentsSection.getModalCloseButton()
      closeButton.waitForDisplayed()
      closeButton.click()
      modalContent.waitForDisplayed({ reverse: true, timeout: SHORT_WAIT_MS })
    })
    it("Should be able to add a weekly assessment with 1 question for the task", () => {
      AssessmentsSection.getAssessmentsSection("weekly").waitForDisplayed()
      const newAssessmentButton =
        AssessmentsSection.getNewAssessmentButton("weekly")
      newAssessmentButton.waitForDisplayed()
      newAssessmentButton.click()
      browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
      const modalContent = AssessmentsSection.getModalContent()
      modalContent.waitForDisplayed()
      AssessmentsSection.getModalTitle().waitForDisplayed()
      /* eslint-disable no-unused-expressions */
      expect(
        AssessmentsSection.getModalAssessmentQuestion("issues").isExisting()
      ).to.be.true
      expect(
        AssessmentsSection.getModalAssessmentQuestion("status").isExisting()
      ).to.be.false
      /* eslint-enable no-unused-expressions */
      const closeButton = AssessmentsSection.getModalCloseButton()
      closeButton.waitForDisplayed()
      closeButton.click()
      modalContent.waitForDisplayed({ reverse: true, timeout: SHORT_WAIT_MS })
      MyTasks.logout()
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
      expect(CreateReport.getAttendeesAssessments().isExisting()).to.be.false
      expect(CreateReport.getTasksAssessments().isExisting()).to.be.false
      CreateReport.fillForm(report)
      expect(CreateReport.getAttendeesAssessments().isExisting()).to.be.true
      expect(CreateReport.getTasksAssessments().isExisting()).to.be.true
      /* eslint-enable no-unused-expressions */
    })
    it("Should be able to add instant assessments for tasks", () => {
      const report = {
        tasks: ["1.2.A"]
      }
      CreateReport.fillForm(report)
      browser.pause(SHORT_WAIT_MS) // wait for assessment questions to be updated
      CreateReport.getTasksAssessments().scrollIntoView()
      const taskAssessmentRows = CreateReport.getTaskAssessmentRows()
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
      browser.pause(SHORT_WAIT_MS) // wait for assessment questions to be updated
      CreateReport.getAttendeesAssessments().scrollIntoView()
      const attendeeAssessmentRows = CreateReport.getAttendeeAssessmentRows()
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
      CreateReport.getPositiveAtmosphere().click()
      browser.pause(SHORT_WAIT_MS) // wait for assessment questions to be updated
      CreateReport.getAttendeesAssessments().scrollIntoView()
      const attendeeAssessmentRows = CreateReport.getAttendeeAssessmentRows()
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
      if (!CreateReport.getDeleteButton().isExisting()) {
        // Cancel the report
        CreateReport.getCancelButton().click()
      } else {
        // Delete it
        CreateReport.getDeleteButton().waitForExist()
        CreateReport.getDeleteButton().waitForDisplayed()
        CreateReport.getDeleteButton().click()
        // Confirm delete
        browser.pause(SHORT_WAIT_MS) // wait for the modal to slide in (transition is 300 ms)
        CreateReport.getConfirmButton().waitForExist()
        CreateReport.getConfirmButton().waitForDisplayed()
        CreateReport.getConfirmButton().click()
        browser.pause(SHORT_WAIT_MS) // wait for the modal to slide out (transition is 300 ms)
        // Report should be deleted
        CreateReport.waitForAlertToLoad()
        expect(CreateReport.getAlert().getText()).to.include("Report deleted")
      }
    })
  })
})
