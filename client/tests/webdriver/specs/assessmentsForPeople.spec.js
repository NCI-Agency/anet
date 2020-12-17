import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowPerson from "../pages/showPerson.page"

const PERSON_SEARCH_STRING = "steve"
const ADVISOR1_CREDENTIALS = "elizabeth"
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

    it("Should allow an admin to delete the assessment", () => {
      ShowPerson.deleteAssessmentButton.click()
      ShowPerson.deleteConfirmButton.waitForExist()
      ShowPerson.deleteConfirmButton.waitForDisplayed()
      ShowPerson.deleteConfirmButton.click()
      ShowPerson.successfulDeleteMessage.waitForExist()
      ShowPerson.successfulDeleteMessage.waitForDisplayed()
    })
  })
})

// use indexed prefix to see which one fails if any fails
const prefix = index => `${index}-) `
