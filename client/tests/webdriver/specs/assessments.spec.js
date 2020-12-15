import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowPerson from "../pages/showPerson.page"
import ShowTask from "../pages/showTask.page"

const PERSON_SEARCH_STRING = "steve"
const TASK_SEARCH_STRING = "1.1.A Milestone"
const ADVISOR_CREDENTIALS = "elizabeth"
const ADVISOR_CREATED_FOR_PERSON_WITH = ["1", "3", "1"]
const ADVISOR_EDITED_FOR_PERSON_WITH = ["2", "4", "2"]
const ADMIN_EDITED_FOR_PERSON_WITH = ["3", "5", "3"]

const VALUE_TO_TEXT_FOR_PERSON = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five"
}

const ADVISOR_CREATED_FOR_TASK_WITH = ["advisor create", "GREEN"]
const ADVISOR_EDITED_FOR_TASK_WITH = ["advisor edit", "AMBER"]
const ADMIN_EDITED_FOR_TASK_WITH = ["admin edit", "RED"]

const VALUE_TO_TEXT_FOR_TASK = {
  GREEN: "Green",
  AMBER: "Amber",
  RED: "Red"
}

describe("When dealing with assessments", () => {
  describe("For the periodic person assessments", () => {
    describe("As an advisor who has a counterpart who needs to be assessed", () => {
      it("Should first search, find and open the person page", () => {
        Home.open("/", ADVISOR_CREDENTIALS)
        Home.searchBar.setValue(PERSON_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundPeopleTable.waitForExist()
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
        ShowPerson.fillAssessmentQuestion(ADVISOR_CREATED_FOR_PERSON_WITH)
        ShowPerson.saveAssessmentAndWaitForModalClose()
      })

      it("Should show the same assessment details with the details just created", () => {
        ShowPerson.assessmentsTable.waitForExist()
        ShowPerson.assessmentsTable.waitForDisplayed()
        ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              VALUE_TO_TEXT_FOR_PERSON[ADVISOR_CREATED_FOR_PERSON_WITH[index]]
          )
        })
      })

      it("Should allow the author of the assessment to successfully edit it", () => {
        ShowPerson.editAssessmentButton.waitForExist()
        ShowPerson.editAssessmentButton.waitForDisplayed()

        ShowPerson.editAssessmentButton.click()
        ShowPerson.assessmentModalForm.waitForExist()
        ShowPerson.assessmentModalForm.waitForDisplayed()

        ShowPerson.fillAssessmentQuestion(ADVISOR_EDITED_FOR_PERSON_WITH)
        ShowPerson.saveAssessmentAndWaitForModalClose()
      })

      it("Should show the same assessment details with the details just edited", () => {
        ShowPerson.assessmentsTable.waitForExist()
        ShowPerson.assessmentsTable.waitForDisplayed()
        ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              VALUE_TO_TEXT_FOR_PERSON[ADVISOR_EDITED_FOR_PERSON_WITH[index]]
          )
        })
      })
    })

    describe("As an admin", () => {
      it("Should first search, find and open the person's page", () => {
        Home.openAsAdminUser()
        Home.searchBar.setValue(PERSON_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundPeopleTable.waitForExist()
        Search.foundPeopleTable.waitForDisplayed()
        Search.linkOfFirstPersonFound.click()
      })

      it("Should allow admins to successfully edit existing assesment", () => {
        ShowPerson.editAssessmentButton.waitForExist()
        ShowPerson.editAssessmentButton.waitForDisplayed()

        ShowPerson.editAssessmentButton.click()
        ShowPerson.assessmentModalForm.waitForExist()
        ShowPerson.assessmentModalForm.waitForDisplayed()

        ShowPerson.fillAssessmentQuestion(ADMIN_EDITED_FOR_PERSON_WITH)
        ShowPerson.saveAssessmentAndWaitForModalClose()
      })

      it("Should show the same assessment details with the details just edited", () => {
        ShowPerson.assessmentsTable.waitForExist()
        ShowPerson.assessmentsTable.waitForDisplayed()
        ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              VALUE_TO_TEXT_FOR_PERSON[ADMIN_EDITED_FOR_PERSON_WITH[index]]
          )
        })
      })
    })
  })

  describe("For the periodic task assessments", () => {
    describe("As an advisor who has tasks he is responsible for", () => {
      it("Should first search, find and open the task page", () => {
        Home.open("/", ADVISOR_CREDENTIALS)
        Home.searchBar.setValue(TASK_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundTaskTable.waitForExist()
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
        ShowTask.fillAssessmentQuestion(ADVISOR_CREATED_FOR_TASK_WITH)
        ShowTask.saveAssessmentAndWaitForModalClose()
      })

      it("Should show the same assessment details with the details just created", () => {
        ShowTask.monthlyAssessmentsTable.waitForExist()
        ShowTask.monthlyAssessmentsTable.waitForDisplayed()
        ShowTask.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              // Only some values are mapped, others are same
              (VALUE_TO_TEXT_FOR_TASK[ADVISOR_CREATED_FOR_TASK_WITH[index]] ||
                ADVISOR_CREATED_FOR_TASK_WITH[index])
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
          ADVISOR_EDITED_FOR_TASK_WITH,
          ADVISOR_CREATED_FOR_TASK_WITH[0]
        )
        ShowTask.saveAssessmentAndWaitForModalClose()
      })

      it("Should show the same assessment details with the details just edited", () => {
        ShowTask.monthlyAssessmentsTable.waitForExist()
        ShowTask.monthlyAssessmentsTable.waitForDisplayed()
        ShowTask.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              // Only some values are mapped, others are same
              (VALUE_TO_TEXT_FOR_TASK[ADVISOR_EDITED_FOR_TASK_WITH[index]] ||
                ADVISOR_EDITED_FOR_TASK_WITH[index])
          )
        })
      })
    })

    describe("As an admin", () => {
      it("Should first search, find and open the person's page", () => {
        Home.openAsAdminUser()
        Home.searchBar.setValue(TASK_SEARCH_STRING)
        Home.submitSearch.click()
        Search.foundTaskTable.waitForExist()
        Search.foundTaskTable.waitForDisplayed()
        Search.linkOfFirstTaskFound.click()
      })

      it("Should allow admins to successfully edit existing assesment", () => {
        ShowTask.monthlyAssessmentsTable.waitForExist()
        ShowTask.monthlyAssessmentsTable.waitForDisplayed()

        ShowTask.editAssessmentButton.click()

        ShowTask.assessmentModalForm.waitForExist({ timeout: 20000 })
        ShowTask.assessmentModalForm.waitForDisplayed()

        // NOTE: assuming assessment question content here, may change in future
        ShowTask.fillAssessmentQuestion(
          ADMIN_EDITED_FOR_TASK_WITH,
          ADVISOR_EDITED_FOR_TASK_WITH[0]
        )
        ShowTask.saveAssessmentAndWaitForModalClose()
      })

      it("Should show the same assessment details with the details just edited", () => {
        ShowTask.monthlyAssessmentsTable.waitForExist()
        ShowTask.monthlyAssessmentsTable.waitForDisplayed()
        ShowTask.shownAssessmentDetails.forEach((detail, index) => {
          expect(prefix(index) + detail.getText()).to.equal(
            prefix(index) +
              // Only some values are mapped, others are same
              (VALUE_TO_TEXT_FOR_TASK[ADMIN_EDITED_FOR_TASK_WITH[index]] ||
                ADMIN_EDITED_FOR_TASK_WITH[index])
          )
        })
      })
    })
  })
})

// use indexed prefix to see which one fails if any fails
const prefix = index => `${index}-) `
