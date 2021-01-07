import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowTask from "../pages/showTask.page"

const TASK_SEARCH_STRING = "1.1.A"
// both are responsible from '1.1.A Milestone' task
const ADVISOR1_CREDENTIALS = "elizabeth"
const ADVISOR2_CREDENTIALS = "andrew"

const ADVISOR_1_TASK_CREATE_DETAILS = ["advisor1 create", "GREEN"]
const ADVISOR_1_TASK_EDIT_DETAILS = ["advisor1 edit", "AMBER"]
const ADVISOR_2_TASK_EDIT_DETAILS = ["advisor2 edit", "GREEN"]
const ADMIN_TASK_EDIT_DETAILS = ["admin edit", "RED"]

const VALUE_TO_TEXT_FOR_TASK = {
  GREEN: "Green",
  AMBER: "Amber",
  RED: "Red"
}
describe("For the periodic task assessments", () => {
  describe("As an advisor who has tasks he is responsible for", () => {
    it("Should first search, find and open the task page", () => {
      Home.open("/", ADVISOR1_CREDENTIALS)
      Home.searchBar.setValue(TASK_SEARCH_STRING)
      Home.submitSearch.click()
      Search.foundTaskTable.waitForExist({ timeout: 20000 })
      Search.foundTaskTable.waitForDisplayed()
      Search.linkOfTaskFound(TASK_SEARCH_STRING).click()
    })

    it("Should allow advisor to successfully add an assessment", () => {
      ShowTask.monthlyAssessmentsTable.waitForExist()
      ShowTask.monthlyAssessmentsTable.waitForDisplayed()
      ShowTask.addMonthlyAssessmentButton.click()
      ShowTask.waitForAssessmentModalForm()

      // NOTE: assuming assessment question content here, may change in future
      ShowTask.fillAssessmentQuestion(ADVISOR_1_TASK_CREATE_DETAILS)
      ShowTask.saveAssessmentAndWaitForModalClose(
        ADVISOR_1_TASK_CREATE_DETAILS[0]
      )
    })

    it("Should show the same assessment details with the details just created", () => {
      ShowTask.shownAssessmentDetails.forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) +
            // Only some values are mapped, others are same
            (VALUE_TO_TEXT_FOR_TASK[ADVISOR_1_TASK_CREATE_DETAILS[index]] ||
              ADVISOR_1_TASK_CREATE_DETAILS[index])
        )
      })
    })

    it("Should allow the author of the assessment to successfully edit it", () => {
      ShowTask.editMonthlyAssessmentButton.waitForExist()
      ShowTask.editMonthlyAssessmentButton.waitForDisplayed()
      ShowTask.editMonthlyAssessmentButton.click()
      ShowTask.waitForAssessmentModalForm()

      ShowTask.fillAssessmentQuestion(
        ADVISOR_1_TASK_EDIT_DETAILS,
        ADVISOR_1_TASK_CREATE_DETAILS[0]
      )
      ShowTask.saveAssessmentAndWaitForModalClose(
        ADVISOR_1_TASK_EDIT_DETAILS[0]
      )
    })

    it("Should show the same assessment details with the details just edited", () => {
      ShowTask.shownAssessmentDetails.forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) +
            // Only some values are mapped, others are same
            (VALUE_TO_TEXT_FOR_TASK[ADVISOR_1_TASK_EDIT_DETAILS[index]] ||
              ADVISOR_1_TASK_EDIT_DETAILS[index])
        )
      })
      ShowTask.logout()
    })
  })

  describe("As an admin", () => {
    it("Should first search, find and open the task's page", () => {
      Home.openAsAdminUser()
      Home.searchBar.setValue(TASK_SEARCH_STRING)
      Home.submitSearch.click()
      Search.foundTaskTable.waitForExist({ timeout: 20000 })
      Search.foundTaskTable.waitForDisplayed()
      Search.linkOfTaskFound(TASK_SEARCH_STRING).click()
    })

    it("Should not show make assessment button when there is an assessment on that period", () => {
      expect(ShowTask.addMonthlyAssessmentButton.isExisting()).to.equal(false)
    })

    it("Should allow admins to successfully edit existing assesment", () => {
      ShowTask.monthlyAssessmentsTable.waitForExist()
      ShowTask.monthlyAssessmentsTable.waitForDisplayed()
      ShowTask.editMonthlyAssessmentButton.click()
      ShowTask.waitForAssessmentModalForm()

      // NOTE: assuming assessment question content here, may change in future
      ShowTask.fillAssessmentQuestion(
        ADMIN_TASK_EDIT_DETAILS,
        ADVISOR_1_TASK_EDIT_DETAILS[0]
      )
      ShowTask.saveAssessmentAndWaitForModalClose(ADMIN_TASK_EDIT_DETAILS[0])
    })

    it("Should show the same assessment details with the details just edited", () => {
      ShowTask.shownAssessmentDetails.forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) +
            // Only some values are mapped, others are same
            (VALUE_TO_TEXT_FOR_TASK[ADMIN_TASK_EDIT_DETAILS[index]] ||
              ADMIN_TASK_EDIT_DETAILS[index])
        )
      })
      ShowTask.logout()
    })
  })

  describe("As a different advisor responsible from same task", () => {
    it("Should first search, find and open the task's page", () => {
      Home.open("/", ADVISOR2_CREDENTIALS)
      Home.searchBar.setValue(TASK_SEARCH_STRING)
      Home.submitSearch.click()
      Search.foundTaskTable.waitForExist({ timeout: 20000 })
      Search.foundTaskTable.waitForDisplayed()
      Search.linkOfTaskFound(TASK_SEARCH_STRING).click()
    })

    it("Should not show make assessment button when there is an assessment on that period", () => {
      expect(ShowTask.addMonthlyAssessmentButton.isExisting()).to.equal(false)
    })

    it("Should allow the other advisor to successfully edit existing assesment", () => {
      ShowTask.monthlyAssessmentsTable.waitForExist()
      ShowTask.monthlyAssessmentsTable.waitForDisplayed()
      ShowTask.editMonthlyAssessmentButton.click()
      ShowTask.waitForAssessmentModalForm()

      // NOTE: assuming assessment question content here, may change in future
      ShowTask.fillAssessmentQuestion(
        ADVISOR_2_TASK_EDIT_DETAILS,
        ADMIN_TASK_EDIT_DETAILS[0]
      )
      ShowTask.saveAssessmentAndWaitForModalClose(
        ADVISOR_2_TASK_EDIT_DETAILS[0]
      )
    })

    it("Should show the same assessment details with the details just edited", () => {
      ShowTask.shownAssessmentDetails.forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) +
            // Only some values are mapped, others are same
            (VALUE_TO_TEXT_FOR_TASK[ADVISOR_2_TASK_EDIT_DETAILS[index]] ||
              ADVISOR_2_TASK_EDIT_DETAILS[index])
        )
      })
    })

    it("Should allow the other advisor to delete the assessment", () => {
      ShowTask.deleteMonthlyAssessmentButton.click()
      ShowTask.confirmDelete()
      ShowTask.waitForDeletedAssessmentToDisappear()
      ShowTask.logout()
    })
  })
})

// use indexed prefix to see which one fails if any fails
const prefix = index => `${index}-) `
