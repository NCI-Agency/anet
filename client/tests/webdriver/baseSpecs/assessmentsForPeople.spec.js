import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowPerson from "../pages/showPerson.page"

const PERSON_SEARCH_STRING = "Steve"
const ADVISOR1_CREDENTIALS = "elizabeth"
const ADVISOR_1_PERSON_CREATE_DETAILS = ["1", "advisor 1 create", "3", "1"]
const ADVISOR_1_PERSON_EDIT_DETAILS = ["2", "advisor 1 edit", "4", "2"]
const ADMIN_PERSON_EDIT_DETAILS = ["3", "admin edit", "5", "3"]

const VALUE_TO_TEXT_FOR_PERSON = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five"
}

const ERROR_MESSAGES = [
  "You must provide Test question 1",
  "You must provide Text",
  "You must provide Test question 2",
  "You must provide Test question 3"
]

describe("For the periodic person assessments", () => {
  describe("As an advisor who has a counterpart who needs to be assessed", () => {
    it("Should first search, find and open the person page", () => {
      Home.open("/", ADVISOR1_CREDENTIALS)
      Home.getSearchBar().setValue(PERSON_SEARCH_STRING)
      Home.getSubmitSearch().click()
      Search.getFoundPeopleTable().waitForExist({ timeout: 20000 })
      Search.getFoundPeopleTable().waitForDisplayed()
      Search.linkOfPersonFound(PERSON_SEARCH_STRING).click()
    })

    it("Should display nested question sets", () => {
      ShowPerson.getAssessmentsTable().waitForExist()
      ShowPerson.getAssessmentsTable().waitForDisplayed()

      ShowPerson.getAddPeriodicAssessmentButton().click()
      ShowPerson.waitForAssessmentModalForm()
      ShowPerson.getTopLevelQuestionSetTitle().waitForDisplayed()
      ShowPerson.getBottomLevelQuestionSetTitle().waitForDisplayed()
    })

    it("Should display validation error messages on every level", () => {
      ShowPerson.getSaveAssessmentButton().click()
      expect(ShowPerson.getValidationErrorMessages()).to.eql(ERROR_MESSAGES)
    })

    it("Should allow advisor to successfully add an assessment", () => {
      // NOTE: assuming assessment question content here, may change in future
      ShowPerson.fillAssessmentQuestion(ADVISOR_1_PERSON_CREATE_DETAILS)
      ShowPerson.saveAssessmentAndWaitForModalClose(
        VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_CREATE_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just created", () => {
      ShowPerson.getShownAssessmentDetails().forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) +
            (VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_CREATE_DETAILS[index]] ||
              ADVISOR_1_PERSON_CREATE_DETAILS[index])
        )
      })
    })

    it("Should allow the author of the assessment to successfully edit it", () => {
      ShowPerson.getEditAssessmentButton().waitForExist()
      ShowPerson.getEditAssessmentButton().waitForDisplayed()

      ShowPerson.getEditAssessmentButton().click()
      ShowPerson.waitForAssessmentModalForm()

      ShowPerson.fillAssessmentQuestion(
        ADVISOR_1_PERSON_EDIT_DETAILS,
        ADVISOR_1_PERSON_CREATE_DETAILS[1]
      )
      ShowPerson.saveAssessmentAndWaitForModalClose(
        VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_EDIT_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just edited", () => {
      ShowPerson.getShownAssessmentDetails().forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) +
            (VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_EDIT_DETAILS[index]] ||
              ADVISOR_1_PERSON_EDIT_DETAILS[index])
        )
      })
      ShowPerson.logout()
    })
  })

  describe("As an admin", () => {
    it("Should first search, find and open the person's page", () => {
      Home.openAsAdminUser()
      Home.getSearchBar().setValue(PERSON_SEARCH_STRING)
      Home.getSubmitSearch().click()
      Search.getFoundPeopleTable().waitForExist({ timeout: 20000 })
      Search.getFoundPeopleTable().waitForDisplayed()
      Search.linkOfPersonFound(PERSON_SEARCH_STRING).click()
    })

    it("Should not show make assessment button when there is an assessment on that period", () => {
      expect(ShowPerson.getAddPeriodicAssessmentButton().isExisting()).to.equal(
        false
      )
    })

    it("Should allow admins to successfully edit existing assessment", () => {
      ShowPerson.getEditAssessmentButton().waitForExist()
      ShowPerson.getEditAssessmentButton().waitForDisplayed()

      ShowPerson.getEditAssessmentButton().click()
      ShowPerson.waitForAssessmentModalForm()

      ShowPerson.fillAssessmentQuestion(
        ADMIN_PERSON_EDIT_DETAILS,
        ADVISOR_1_PERSON_EDIT_DETAILS[1]
      )
      ShowPerson.saveAssessmentAndWaitForModalClose(
        VALUE_TO_TEXT_FOR_PERSON[ADMIN_PERSON_EDIT_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just edited", () => {
      ShowPerson.getShownAssessmentDetails().forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) +
            (VALUE_TO_TEXT_FOR_PERSON[ADMIN_PERSON_EDIT_DETAILS[index]] ||
              ADMIN_PERSON_EDIT_DETAILS[index])
        )
      })
    })

    it("Should allow an admin to delete the assessment", () => {
      ShowPerson.getDeleteAssessmentButton().click()
      ShowPerson.confirmDelete()
      ShowPerson.waitForDeletedAssessmentToDisappear()
      ShowPerson.logout()
    })
  })
})

// use indexed prefix to see which one fails if any fails
const prefix = index => `${index}-) `
