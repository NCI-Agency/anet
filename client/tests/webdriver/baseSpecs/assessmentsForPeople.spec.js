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

const ASSESSED_PEOPLE = [
  {
    name: "ANDERSON, Andrew",
    visibleAssessments: [
      {
        key: "advisorPeriodic",
        recurrence: "monthly",
        details: ["Test assessment advisorPeriodic"]
      },
      {
        key: "advisorOndemand",
        recurrence: "ondemand",
        details: ["1 January 2025", "Test assessment advisorOndemand"]
      },
      {
        key: "advisorOndemandNoWrite",
        recurrence: "ondemand",
        details: ["1 January 2025", "1"]
      }
    ],
    invisibleAssessments: [
      { key: "personOnceReportLinguist", recurrence: "monthly" },
      { key: "personOnceReportLinguistLin", recurrence: "monthly" },
      { key: "interlocutorMonthly", recurrence: "monthly" },
      { key: "interlocutorQuarterly", recurrence: "quarterly" },
      { key: "interlocutorOnceReport", recurrence: "monthly" },
      { key: "interlocutorOndemandScreeningAndVetting", recurrence: "ondemand" }
    ]
  },
  {
    name: "KYLESON, Kyle",
    visibleAssessments: [
      {
        key: "interlocutorMonthly",
        recurrence: "monthly",
        details: ["Test assessment interlocutorMonthly"]
      },
      {
        key: "interlocutorQuarterly",
        recurrence: "quarterly",
        details: [
          "one",
          "Test assessment interlocutorQuarterly",
          "three",
          "one"
        ]
      },
      { key: "interlocutorOnceReport", recurrence: "monthly" },
      {
        key: "interlocutorOndemandScreeningAndVetting",
        recurrence: "ondemand",
        details: [
          "1 January 2025",
          "1 February 2025",
          "Pass 1",
          "Test assessment interlocutorOndemandScreeningAndVetting"
        ]
      }
    ],
    invisibleAssessments: [
      { key: "personOnceReportLinguist", recurrence: "monthly" },
      { key: "personOnceReportLinguistLin", recurrence: "monthly" },
      { key: "advisorPeriodic", recurrence: "monthly" },
      { key: "advisorOndemand", recurrence: "ondemand" },
      { key: "advisorOndemandNoWrite", recurrence: "ondemand" }
    ]
  },
  {
    name: "GUIST, Lin",
    visibleAssessments: [
      { key: "personOnceReportLinguist", recurrence: "monthly" },
      { key: "personOnceReportLinguistLin", recurrence: "monthly" },
      { key: "advisorPeriodic", recurrence: "monthly" },
      { key: "advisorOndemand", recurrence: "ondemand" },
      { key: "advisorOndemandNoWrite", recurrence: "ondemand" }
    ],
    invisibleAssessments: [
      { key: "interlocutorMonthly", recurrence: "monthly" },
      { key: "interlocutorQuarterly", recurrence: "quarterly" },
      { key: "interlocutorOnceReport", recurrence: "monthly" },
      { key: "interlocutorOndemandScreeningAndVetting", recurrence: "ondemand" }
    ]
  },
  {
    name: "PRETER, Inter",
    visibleAssessments: [
      { key: "personOnceReportLinguist", recurrence: "monthly" },
      { key: "advisorPeriodic", recurrence: "monthly" },
      { key: "advisorOndemand", recurrence: "ondemand" },
      { key: "advisorOndemandNoWrite", recurrence: "ondemand" }
    ],
    invisibleAssessments: [
      { key: "personOnceReportLinguistLin", recurrence: "monthly" },
      { key: "interlocutorMonthly", recurrence: "monthly" },
      { key: "interlocutorQuarterly", recurrence: "quarterly" },
      { key: "interlocutorOnceReport", recurrence: "monthly" },
      { key: "interlocutorOndemandScreeningAndVetting", recurrence: "ondemand" }
    ]
  }
]

describe("As an admin", () => {
  it("Should see the proper assessment sections for each person", async() => {
    await Home.openAsAdminUser()
    for (const p of ASSESSED_PEOPLE) {
      await (await Home.getSearchBar()).setValue(p.name)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundPeopleTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundPeopleTable()).waitForDisplayed()
      await (await Search.linkOfPersonFound(p.name)).click()
      await (await ShowPerson.getForm()).waitForDisplayed()

      for (const a of p.visibleAssessments) {
        expect(
          await (
            await ShowPerson.getAssessmentContainer(a.key, a.recurrence)
          ).isExisting()
        ).to.equal(true)
        if (a.details) {
          await assertAssessmentDetails(a.key, a.recurrence, a.details, 1, null)
        }
      }
    }
  })

  it("Should not see not-applicable assessment sections for each person", async() => {
    await Home.openAsAdminUser()
    for (const p of ASSESSED_PEOPLE) {
      await (await Home.getSearchBar()).setValue(p.name)
      await (await Home.getSubmitSearch()).click()
      await (
        await Search.getFoundPeopleTable()
      ).waitForExist({ timeout: 20000 })
      await (await Search.getFoundPeopleTable()).waitForDisplayed()
      await (await Search.linkOfPersonFound(p.name)).click()
      await (await ShowPerson.getForm()).waitForDisplayed()

      for (const a of p.invisibleAssessments) {
        expect(
          await (
            await ShowPerson.getAssessmentContainer(a.key, a.recurrence)
          ).isExisting()
        ).to.equal(false)
      }
    }
  })
})

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
  assessmentDetails,
  i = 2,
  valueToText = VALUE_TO_TEXT_FOR_PERSON
) => {
  const details = await ShowPerson.getShownAssessmentDetails(
    assessmentKey,
    recurrence,
    i
  )
  for (const [index, detail] of await (await details).entries()) {
    const pre = `${index}-) `
    const det = await (await detail).getText()
    expect(`${pre}${det}`).to.equal(
      `${pre}${
        valueToText?.[assessmentDetails[index]] || assessmentDetails[index]
      }`
    )
  }
}
