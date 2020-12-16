import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowPerson from "../pages/showPerson.page"
import ShowTask from "../pages/showTask.page"

const PERSON_SEARCH_STRING = "steve"
const TASK_SEARCH_STRING = "1.1.A Milestone"
// both are responsible from '1.1.A Milestone' task
const ADVISOR1_CREDENTIALS = "elizabeth"
const ADVISOR2_CREDENTIALS = "andrew"
const ADVISOR_1_PERSON_CREATE_DETAILS = ["1", "3", "1"]
const ADVISOR_1_PERSON_EDIT_DETAILS = ["2", "4", "2"]
const ADMIN_PERSON_EDIT_DETAILS = ["3", "5", "3"]

const VALUE_TO_TEXT_FOR_PERSON = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five"
}

const ADVISOR_1_TASK_CREATE_DETAILS = ["advisor1 create", "GREEN"]
const ADVISOR_1_TASK_EDIT_DETAILS = ["advisor1 edit", "AMBER"]
const ADVISOR_2_TASK_EDIT_DETAILS = ["advisor2 edit", "GREEN"]
const ADMIN_TASK_EDIT_DETAILS = ["admin edit", "RED"]

const VALUE_TO_TEXT_FOR_TASK = {
  GREEN: "Green",
  AMBER: "Amber",
  RED: "Red"
}

describe("When dealing with assessments", () => {
  describe("For the periodic person assessments", () => {
    describe("As an advisor who has a counterpart who needs to be assessed", () => {
      it("Should first search, find and open the person page", () => {
        Home.open("/", ADVISOR1_CREDENTIALS)
        Home.searchBar.setValue(PERSON_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundPeopleTable.waitForExist({ timeout: 20000 })
        Search.foundPeopleTable.waitForDisplayed()
        Search.linkOfFirstPersonFound.click()
      })

      it("Should allow advisor to successfully add an assessment", () => {
        ShowPerson.assessmentsTable.waitForExist()
        ShowPerson.assessmentsTable.waitForDisplayed()

        ShowPerson.addPeriodicAssessmentButton.click()

        ShowPerson.assessmentModalForm.waitForExist({ timeout: 20000 })
        ShowPerson.assessmentModalForm.waitForDisplayed()

        // NOTE: assuming assessment question content here, may change in future
        ShowPerson.fillAssessmentQuestion(ADVISOR_1_PERSON_CREATE_DETAILS)
        ShowPerson.saveAssessmentAndWaitForModalClose(
          VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_CREATE_DETAILS[0]]
        )
      })

      it("Should show the same assessment details with the details just created", () => {
        ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_CREATE_DETAILS[index]]
          )
        })
      })

      it("Should allow the author of the assessment to successfully edit it", () => {
        ShowPerson.editAssessmentButton.waitForExist()
        ShowPerson.editAssessmentButton.waitForDisplayed()

        ShowPerson.editAssessmentButton.click()
        ShowPerson.assessmentModalForm.waitForExist()
        ShowPerson.assessmentModalForm.waitForDisplayed()

        ShowPerson.fillAssessmentQuestion(ADVISOR_1_PERSON_EDIT_DETAILS)
        ShowPerson.saveAssessmentAndWaitForModalClose(
          VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_EDIT_DETAILS[0]]
        )
      })

      it("Should show the same assessment details with the details just edited", () => {
        ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_EDIT_DETAILS[index]]
          )
        })
      })
    })

    describe("As an admin", () => {
      it("Should first search, find and open the person's page", () => {
        Home.openAsAdminUser()
        Home.searchBar.setValue(PERSON_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundPeopleTable.waitForExist({ timeout: 20000 })
        Search.foundPeopleTable.waitForDisplayed()
        Search.linkOfFirstPersonFound.click()
      })

      it("Should not show make assessment button when there is an assessment on that period", () => {
        expect(ShowPerson.addPeriodicAssessmentButton.isExisting()).to.equal(
          false
        )
      })

      it("Should allow admins to successfully edit existing assesment", () => {
        ShowPerson.editAssessmentButton.waitForExist()
        ShowPerson.editAssessmentButton.waitForDisplayed()

        ShowPerson.editAssessmentButton.click()
        ShowPerson.assessmentModalForm.waitForExist()
        ShowPerson.assessmentModalForm.waitForDisplayed()

        ShowPerson.fillAssessmentQuestion(ADMIN_PERSON_EDIT_DETAILS)
        ShowPerson.saveAssessmentAndWaitForModalClose(
          VALUE_TO_TEXT_FOR_PERSON[ADMIN_PERSON_EDIT_DETAILS[0]]
        )
      })

      it("Should show the same assessment details with the details just edited", () => {
        ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              VALUE_TO_TEXT_FOR_PERSON[ADMIN_PERSON_EDIT_DETAILS[index]]
          )
        })
      })
    })
  })

  describe("For the periodic task assessments", () => {
    describe("As an advisor who has tasks he is responsible for", () => {
      it("Should first search, find and open the task page", () => {
        Home.open("/", ADVISOR1_CREDENTIALS)
        Home.searchBar.setValue(TASK_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundTaskTable.waitForExist({ timeout: 20000 })
        Search.foundTaskTable.waitForDisplayed()
        Search.linkOfFirstTaskFound.click()
      })

      it("Should allow advisor to successfully add an assessment", () => {
        ShowTask.monthlyAssessmentsTable.waitForExist()
        ShowTask.monthlyAssessmentsTable.waitForDisplayed()

        ShowTask.addPeriodicAssessmentButton.click()

        ShowTask.assessmentModalForm.waitForExist({ timeout: 20000 })
        ShowTask.assessmentModalForm.waitForDisplayed()

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
        ShowTask.editAssessmentButton.waitForExist()
        ShowTask.editAssessmentButton.waitForDisplayed()
        ShowTask.editAssessmentButton.click()

        ShowTask.assessmentModalForm.waitForExist()
        ShowTask.assessmentModalForm.waitForDisplayed()

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
      })
    })

    describe("As a different advisor responsible from same task", () => {
      it("Should first search, find and open the task's page", () => {
        Home.open("/", ADVISOR2_CREDENTIALS)
        Home.searchBar.setValue(TASK_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundTaskTable.waitForExist({ timeout: 20000 })
        Search.foundTaskTable.waitForDisplayed()
        Search.linkOfFirstTaskFound.click()
      })

      it("Should not show make assessment button when there is an assessment on that period", () => {
        expect(ShowTask.addPeriodicAssessmentButton.isExisting()).to.equal(
          false
        )
      })

      it("Should allow admins to successfully edit existing assesment", () => {
        ShowTask.monthlyAssessmentsTable.waitForExist()
        ShowTask.monthlyAssessmentsTable.waitForDisplayed()

        ShowTask.editAssessmentButton.click()

        ShowTask.assessmentModalForm.waitForExist({ timeout: 20000 })
        ShowTask.assessmentModalForm.waitForDisplayed()

        // NOTE: assuming assessment question content here, may change in future
        ShowTask.fillAssessmentQuestion(
          ADVISOR_2_TASK_EDIT_DETAILS,
          ADVISOR_1_TASK_EDIT_DETAILS[0]
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
    })

    describe("As an admin", () => {
      it("Should first search, find and open the task's page", () => {
        Home.openAsAdminUser()
        Home.searchBar.setValue(TASK_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundTaskTable.waitForExist({ timeout: 20000 })
        Search.foundTaskTable.waitForDisplayed()
        Search.linkOfFirstTaskFound.click()
      })

      it("Should not show make assessment button when there is an assessment on that period", () => {
        expect(ShowTask.addPeriodicAssessmentButton.isExisting()).to.equal(
          false
        )
      })

      it("Should allow admins to successfully edit existing assesment", () => {
        ShowTask.monthlyAssessmentsTable.waitForExist()
        ShowTask.monthlyAssessmentsTable.waitForDisplayed()

        ShowTask.editAssessmentButton.click()

        ShowTask.assessmentModalForm.waitForExist({ timeout: 20000 })
        ShowTask.assessmentModalForm.waitForDisplayed()

        // NOTE: assuming assessment question content here, may change in future
        ShowTask.fillAssessmentQuestion(
          ADMIN_TASK_EDIT_DETAILS,
          ADVISOR_2_TASK_EDIT_DETAILS[0]
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
      })
    })
  })
})

// use indexed prefix to see which one fails if any fails
const prefix = index => `${index}-) `
