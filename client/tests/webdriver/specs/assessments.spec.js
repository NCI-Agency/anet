import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowPerson from "../pages/showPerson.page"

const PERSON_SEARCH_STRING = "steve"
const ADVISOR_CREDENTIALS = "elizabeth"
const ADVISOR_CREATED_WITH = ["1", "3", "1"]
const ADVISOR_EDITED_WITH = ["2", "4", "2"]
const ADMIN_EDITED_WITH = ["3", "5", "3"]

const VALUE_TO_TEXT = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five"
}
describe("When dealing with assessments", () => {
  describe("When an advisor is looking to create a periodic assessment", () => {
    it("Should first search, find and open the the counterpart's person page", () => {
      Home.open("/", ADVISOR_CREDENTIALS)
      Home.searchBar.setValue(PERSON_SEARCH_STRING)
      Home.submitSearch.click()

      Search.linkOfFirstPersonFound.click()
    })

    it("Should allow advisor the add periodic assessment", () => {
      ShowPerson.assessmentsTable.waitForExist()
      ShowPerson.assessmentsTable.waitForDisplayed()

      ShowPerson.addPeriodicAssessmentButton.click()

      ShowPerson.quarterlyAssessmentContainer.scrollIntoView()
      ShowPerson.assessmentModalForm.waitForExist({ timeout: 20000 })
      ShowPerson.assessmentModalForm.waitForDisplayed()

      // NOTE: assuming assessment question content here, may change in future
      ShowPerson.fillAssessmentQuestion(ADVISOR_CREATED_WITH)
      ShowPerson.saveAssessmentAndWaitForModalClose()
    })

    it("Should show the correct assessment details from the form just saved", () => {
      ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) + VALUE_TO_TEXT[ADVISOR_CREATED_WITH[index]]
        )
      })
    })

    it("Should allow the author of the assessment to edit it", () => {
      ShowPerson.editAssessmentButton.waitForExist()
      ShowPerson.editAssessmentButton.waitForDisplayed()

      ShowPerson.editAssessmentButton.click()
      ShowPerson.assessmentModalForm.waitForExist()
      ShowPerson.assessmentModalForm.waitForDisplayed()

      ShowPerson.fillAssessmentQuestion(ADVISOR_EDITED_WITH)
      ShowPerson.saveAssessmentAndWaitForModalClose()
    })

    it("Should show the correct assessment details from the form just edited", () => {
      ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) + VALUE_TO_TEXT[ADVISOR_EDITED_WITH[index]]
        )
      })
    })
  })

  describe("When an admin is looking to edit existing periodic assessments", () => {
    it("Should first search, find and open the the counterpart's person page", () => {
      Home.openAsAdminUser()
      Home.searchBar.setValue(PERSON_SEARCH_STRING)
      Home.submitSearch.click()
      Search.linkOfFirstPersonFound.click()
    })

    it("Should allow admins to edit existing assesment", () => {
      ShowPerson.editAssessmentButton.waitForExist()
      ShowPerson.editAssessmentButton.waitForDisplayed()

      ShowPerson.editAssessmentButton.click()
      ShowPerson.assessmentModalForm.waitForExist()
      ShowPerson.assessmentModalForm.waitForDisplayed()

      ShowPerson.fillAssessmentQuestion(ADMIN_EDITED_WITH)
      ShowPerson.saveAssessmentAndWaitForModalClose()
    })

    it("Should show the correct assessment details from the form just edited", () => {
      ShowPerson.shownAssessmentDetails.forEach((detail, index) => {
        expect(prefix(index) + detail.getText()).to.equal(
          prefix(index) + VALUE_TO_TEXT[ADMIN_EDITED_WITH[index]]
        )
      })
    })
  })
})

// use indexed prefix to see which one fails if any fails
const prefix = index => `${index}-) `
