import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import SearchPageObject from "../pages/search.page.js"
import ShowPersonPageObject from "../pages/showPerson.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, Search, ShowPerson
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    Search = new SearchPageObject(page)
    ShowPerson = new ShowPersonPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
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
      name: "Andrew Anderson",
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
        {
          key: "personOnceReportLinguist",
          recurrence: "monthly"
        },
        {
          key: "personOnceReportLinguistLin",
          recurrence: "monthly"
        },
        {
          key: "interlocutorMonthly",
          recurrence: "monthly"
        },
        {
          key: "interlocutorQuarterly",
          recurrence: "quarterly"
        },
        {
          key: "interlocutorOnceReport",
          recurrence: "monthly"
        },
        {
          key: "interlocutorOndemandScreeningAndVetting",
          recurrence: "ondemand"
        }
      ]
    },
    {
      name: "Kyle Kyleson",
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
        {
          key: "interlocutorOnceReport",
          recurrence: "monthly"
        },
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
        {
          key: "personOnceReportLinguist",
          recurrence: "monthly"
        },
        {
          key: "personOnceReportLinguistLin",
          recurrence: "monthly"
        },
        {
          key: "advisorPeriodic",
          recurrence: "monthly"
        },
        {
          key: "advisorOndemand",
          recurrence: "ondemand"
        },
        {
          key: "advisorOndemandNoWrite",
          recurrence: "ondemand"
        }
      ]
    },
    {
      name: "Lin Guist",
      visibleAssessments: [
        {
          key: "personOnceReportLinguist",
          recurrence: "monthly"
        },
        {
          key: "personOnceReportLinguistLin",
          recurrence: "monthly"
        },
        {
          key: "advisorPeriodic",
          recurrence: "monthly"
        },
        {
          key: "advisorOndemand",
          recurrence: "ondemand"
        },
        {
          key: "advisorOndemandNoWrite",
          recurrence: "ondemand"
        }
      ],
      invisibleAssessments: [
        {
          key: "interlocutorMonthly",
          recurrence: "monthly"
        },
        {
          key: "interlocutorQuarterly",
          recurrence: "quarterly"
        },
        {
          key: "interlocutorOnceReport",
          recurrence: "monthly"
        },
        {
          key: "interlocutorOndemandScreeningAndVetting",
          recurrence: "ondemand"
        }
      ]
    },
    {
      name: "Inter Preter",
      visibleAssessments: [
        {
          key: "personOnceReportLinguist",
          recurrence: "monthly"
        },
        {
          key: "advisorPeriodic",
          recurrence: "monthly"
        },
        {
          key: "advisorOndemand",
          recurrence: "ondemand"
        },
        {
          key: "advisorOndemandNoWrite",
          recurrence: "ondemand"
        }
      ],
      invisibleAssessments: [
        {
          key: "personOnceReportLinguistLin",
          recurrence: "monthly"
        },
        {
          key: "interlocutorMonthly",
          recurrence: "monthly"
        },
        {
          key: "interlocutorQuarterly",
          recurrence: "quarterly"
        },
        {
          key: "interlocutorOnceReport",
          recurrence: "monthly"
        },
        {
          key: "interlocutorOndemandScreeningAndVetting",
          recurrence: "ondemand"
        }
      ]
    }
  ]
  test.describe("As an admin", () => {
    test("Should see the proper assessment sections for each person", async () => {
      await Home.openAsAdminUser()
      await (
        await Home.getSearchBar()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      for (const p of ASSESSED_PEOPLE) {
        await (await Home.getSearchBar()).fill(String(p.name))
        await (await Home.getSubmitSearch()).click()
        await (
          await Search.getFoundPeopleTable()
        ).waitFor({
          state: "attached",
          timeout: 20000
        })
        await (
          await Search.getFoundPeopleTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (await Search.linkOfPersonFound(p.name)).click()
        await (
          await ShowPerson.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        for (const a of p.visibleAssessments) {
          await expect(
            await ShowPerson.getAssessmentContainer(a.key, a.recurrence)
          ).not.toHaveCount(0)
          if (a.details) {
            await assertAssessmentDetails(
              a.key,
              a.recurrence,
              a.details,
              1,
              null
            )
          }
        }
      }
    })
    test("Should not see not-applicable assessment sections for each person", async () => {
      await Home.openAsAdminUser()
      await (
        await Home.getSearchBar()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      for (const p of ASSESSED_PEOPLE) {
        await (await Home.getSearchBar()).fill(String(p.name))
        await (await Home.getSubmitSearch()).click()
        await (
          await Search.getFoundPeopleTable()
        ).waitFor({
          state: "attached",
          timeout: 20000
        })
        await (
          await Search.getFoundPeopleTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (await Search.linkOfPersonFound(p.name)).click()
        await (
          await ShowPerson.getForm()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        for (const a of p.invisibleAssessments) {
          await expect(
            await ShowPerson.getAssessmentContainer(a.key, a.recurrence)
          ).toHaveCount(0)
        }
      }
    })
  })
  test.describe("For the periodic person assessments", () => {
    test.describe("As an advisor who has a counterpart who needs to be assessed", () => {
      test("Should first search, find and open the person page", async () => {
        await Home.open("/", ADVISOR1_CREDENTIALS)
        await (await Home.getSearchBar()).fill(String(PERSON_SEARCH_STRING))
        await (await Home.getSubmitSearch()).click()
        await (
          await Search.getFoundPeopleTable()
        ).waitFor({
          state: "attached",
          timeout: 20000
        })
        await (
          await Search.getFoundPeopleTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (await Search.linkOfPersonFound(PERSON_SEARCH_STRING)).click()
      })
      test("Should display nested question sets", async () => {
        await (
          await ShowPerson.getAssessmentsTable(
            "interlocutorQuarterly",
            "quarterly"
          )
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await ShowPerson.getAddAssessmentButton(
            "interlocutorQuarterly",
            "quarterly"
          )
        ).click()
        await ShowPerson.waitForAssessmentModalForm()
        await (
          await ShowPerson.getTopLevelQuestionSetTitle()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (
          await ShowPerson.getBottomLevelQuestionSetTitle()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      })
      test("Should display validation error messages on every level", async () => {
        await (await ShowPerson.getSaveAssessmentButton()).click()
        await expect
          .poll(async () => await ShowPerson.getValidationErrorMessages())
          .toEqual(ERROR_MESSAGES)
      })
      test("Should allow advisor to successfully add an assessment", async () => {
        // NOTE: assuming assessment question content here, may change in future
        await ShowPerson.fillAssessmentQuestion(ADVISOR_1_PERSON_CREATE_DETAILS)
        await ShowPerson.saveAssessmentAndWaitForModalClose(
          "interlocutorQuarterly",
          "quarterly",
          VALUE_TO_TEXT_FOR_PERSON[ADVISOR_1_PERSON_CREATE_DETAILS[0]]
        )
      })
      test("Should show the same assessment details with the details just created", async () => {
        await assertAssessmentDetails(
          "interlocutorQuarterly",
          "quarterly",
          ADVISOR_1_PERSON_CREATE_DETAILS
        )
      })
      test("Should allow the author of the assessment to successfully edit it", async () => {
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
      test("Should show the same assessment details with the details just edited", async () => {
        await assertAssessmentDetails(
          "interlocutorQuarterly",
          "quarterly",
          ADVISOR_1_PERSON_EDIT_DETAILS
        )
        await ShowPerson.logout()
      })
    })
    test.describe("As an admin", () => {
      test("Should first search, find and open the person's page", async () => {
        await Home.openAsAdminUser()
        await (await Home.getSearchBar()).fill(String(PERSON_SEARCH_STRING))
        await (await Home.getSubmitSearch()).click()
        await (
          await Search.getFoundPeopleTable()
        ).waitFor({
          state: "attached",
          timeout: 20000
        })
        await (
          await Search.getFoundPeopleTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await (await Search.linkOfPersonFound(PERSON_SEARCH_STRING)).click()
      })
      test("Should not show make assessment button when there is an assessment on that period", async () => {
        await expect(
          await ShowPerson.getAddAssessmentButton(
            "interlocutorQuarterly",
            "quarterly"
          )
        ).toHaveCount(0)
      })
      test("Should allow admins to successfully edit existing assessment", async () => {
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
      test("Should show the same assessment details with the details just edited", async () => {
        await assertAssessmentDetails(
          "interlocutorQuarterly",
          "quarterly",
          ADMIN_PERSON_EDIT_DETAILS
        )
      })
      test("Should allow an admin to delete the assessment", async () => {
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
  const assertAssessmentDetails = async (
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
    // first wait for assessment modal to be fully rendered
    for (const [index, detail] of details.entries()) {
      const pre = `${index}-) `
      const det = (await detail.innerText()).trim()
      expect(`${pre}${det}`).toBe(
        `${pre}${valueToText?.[assessmentDetails[index]] || assessmentDetails[index]}`
      )
    }
  }
})
