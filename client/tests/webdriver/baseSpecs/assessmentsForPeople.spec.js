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
    it("Should first search, find and open the person page", async() => {
      await Home.open("/", ADVISOR1_CREDENTIALS)
      await (await Home.getSearchBar()).setValue(PERSON_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundPeopleTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundPeopleTable()).waitForDisplayed()
      await (await Search.linkOfPersonFound(PERSON_SEARCH_STRING)).click()
    })

    it("Should display nested question sets", async() => {
      await (
        await ShowPerson.getAssessmentsTable(
          "interlocutorQuarterly",
          "quarterly"
        )
      ).waitForExist()
      await (
        await ShowPerson.getAssessmentsTable(
          "interlocutorQuarterly",
          "quarterly"
        )
      ).waitForDisplayed()

      await (
        await ShowPerson.getAddAssessmentButton(
          "interlocutorQuarterly",
          "quarterly"
        )
      ).click()
      await ShowPerson.waitForAssessmentModalForm()
      await (await ShowPerson.getTopLevelQuestionSetTitle()).waitForDisplayed()
      await (
        await ShowPerson.getBottomLevelQuestionSetTitle()
      ).waitForDisplayed()
    })

    it("Should display validation error messages on every level", async() => {
      await (await ShowPerson.getSaveAssessmentButton()).click()
      expect(await ShowPerson.getValidationErrorMessages()).to.eql(
        ERROR_MESSAGES
      )
    })

    it("Should allow advisor to successfully add an assessment", async() => {
      // NOTE: assuming assessment question content here, may change in future
      await ShowPerson.fillAssessmentQuestion(ADVISOR_1_PERSON_CREATE_DETAILS)
      await ShowPerson.saveAssessmentAndWaitForModalClose(
        "interlocutorQuarterly",
        "quarterly",
        VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_CREATE_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just created", async() => {
      await assertAssessmentDetails(
        "interlocutorQuarterly",
        "quarterly",
        ADVISOR_1_PERSON_CREATE_DETAILS
      )
    })

    it("Should allow the author of the assessment to successfully edit it", async() => {
      await (await ShowPerson.getEditAssessmentButton()).waitForExist()
      await (await ShowPerson.getEditAssessmentButton()).waitForDisplayed()

      await (await ShowPerson.getEditAssessmentButton()).click()
      await ShowPerson.waitForAssessmentModalForm()

      await ShowPerson.fillAssessmentQuestion(
        ADVISOR_1_PERSON_EDIT_DETAILS,
        ADVISOR_1_PERSON_CREATE_DETAILS[1]
      )
      await ShowPerson.saveAssessmentAndWaitForModalClose(
        "interlocutorQuarterly",
        "quarterly",
        VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_EDIT_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just edited", async() => {
      await assertAssessmentDetails(
        "interlocutorQuarterly",
        "quarterly",
        ADVISOR_1_PERSON_EDIT_DETAILS
      )
      await ShowPerson.logout()
    })
  })

  describe("As an admin", () => {
    it("Should first search, find and open the person's page", async() => {
      await Home.openAsAdminUser()
      await (await Home.getSearchBar()).setValue(PERSON_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundPeopleTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundPeopleTable()).waitForDisplayed()
      await (await Search.linkOfPersonFound(PERSON_SEARCH_STRING)).click()
    })

    it("Should not show make assessment button when there is an assessment on that period", async() => {
      expect(
        await (
          await ShowPerson.getAddAssessmentButton(
            "interlocutorQuarterly",
            "quarterly"
          )
        ).isExisting()
      ).to.equal(false)
    })

    it("Should allow admins to successfully edit existing assessment", async() => {
      await (await ShowPerson.getEditAssessmentButton()).waitForExist()
      await (await ShowPerson.getEditAssessmentButton()).waitForDisplayed()

      await (await ShowPerson.getEditAssessmentButton()).click()
      await ShowPerson.waitForAssessmentModalForm()

      await ShowPerson.fillAssessmentQuestion(
        ADMIN_PERSON_EDIT_DETAILS,
        ADVISOR_1_PERSON_EDIT_DETAILS[1]
      )
      await ShowPerson.saveAssessmentAndWaitForModalClose(
        "interlocutorQuarterly",
        "quarterly",
        VALUE_TO_TEXT_FOR_PERSON[ADMIN_PERSON_EDIT_DETAILS[0]]
      )
    })

    it("Should show the same assessment details with the details just edited", async() => {
      await assertAssessmentDetails(
        "interlocutorQuarterly",
        "quarterly",
        ADMIN_PERSON_EDIT_DETAILS
      )
    })

    it("Should allow an admin to delete the assessment", async() => {
      await (await ShowPerson.getDeleteAssessmentButton()).click()
      await ShowPerson.confirmDelete()
      await ShowPerson.waitForDeletedAssessmentToDisappear(
        "interlocutorQuarterly",
        "quarterly"
      )
      await ShowPerson.logout()
    })
  })
})

const assertAssessmentDetails = async(
  assessmentKey,
  recurrence,
  assessmentDetails
) => {
  const details = await ShowPerson.getShownAssessmentDetails(
    assessmentKey,
    recurrence
  )
  for (const [index, detail] of await (await details).entries()) {
    const pre = `${index}-) `
    const det = await (await detail).getText()
    expect(`${pre}${det}`).to.equal(
      `${pre}${
        VALUE_TO_TEXT_FOR_PERSON[assessmentDetails[index]] ||
        assessmentDetails[index]
      }`
    )
  }
}
