import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import SearchPageObject from "../pages/search.page.js"
import ShowTaskPageObject from "../pages/showTask.page.js"

test.describe(() => {
  let page, Home, Search, ShowTask
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    Home = new HomePageObject(page)
    Search = new SearchPageObject(page)
    ShowTask = new ShowTaskPageObject(page)
  })
  const TASK_SEARCH_STRING = "1.1.A"
  // both are responsible from '1.1.A Milestone' task
  const ADVISOR1_CREDENTIALS = "bob"
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
  const ASSESSED_TASKS = [
    {
      shortName: "1.1.B",
      visibleAssessments: [
        {
          key: "taskOnceReportRestricted",
          recurrence: "monthly"
        },
        {
          key: "taskMonthly",
          recurrence: "monthly",
          details: [
            "Test assessment taskMonthly with questionFor11B",
            "Test assessment taskMonthly with questionFor11B",
            "Amber"
          ]
        },
        {
          key: "taskWeekly",
          recurrence: "weekly"
        },
        {
          key: "taskOnceReport",
          recurrence: "monthly"
        }
      ],
      invisibleAssessments: [
        {
          key: "taskSemiannuallyRestricted",
          recurrence: "semiannually"
        },
        {
          key: "task11COnceReport",
          recurrence: "monthly"
        }
      ]
    },
    {
      shortName: "1.1.C",
      visibleAssessments: [
        {
          key: "taskOnceReportRestricted",
          recurrence: "monthly"
        },
        {
          key: "taskMonthly",
          recurrence: "monthly"
        },
        {
          key: "taskWeekly",
          recurrence: "weekly"
        },
        {
          key: "taskOnceReport",
          recurrence: "monthly"
        },
        {
          key: "task11COnceReport",
          recurrence: "monthly"
        }
      ],
      invisibleAssessments: [
        {
          key: "taskSemiannuallyRestricted",
          recurrence: "semiannually"
        }
      ]
    },
    {
      shortName: "1.3.A",
      visibleAssessments: [
        {
          key: "taskMonthly",
          recurrence: "monthly"
        },
        {
          key: "taskWeekly",
          recurrence: "weekly"
        },
        {
          key: "taskOnceReport",
          recurrence: "monthly"
        }
      ],
      invisibleAssessments: [
        {
          key: "taskOnceReportRestricted",
          recurrence: "monthly"
        },
        {
          key: "taskSemiannuallyRestricted",
          recurrence: "semiannually"
        },
        {
          key: "task11COnceReport",
          recurrence: "monthly"
        }
      ]
    },
    {
      shortName: "2.C",
      visibleAssessments: [
        {
          key: "taskOnceReportRestricted",
          recurrence: "monthly"
        },
        {
          key: "taskMonthly",
          recurrence: "monthly"
        },
        {
          key: "taskWeekly",
          recurrence: "weekly"
        },
        {
          key: "taskOnceReport",
          recurrence: "monthly"
        }
      ],
      invisibleAssessments: [
        {
          key: "taskSemiannuallyRestricted",
          recurrence: "semiannually"
        },
        {
          key: "task11COnceReport",
          recurrence: "monthly"
        }
      ]
    },
    {
      shortName: "EF7",
      visibleAssessments: [
        {
          key: "taskSemiannuallyRestricted",
          recurrence: "semiannually"
        },
        {
          key: "taskMonthly",
          recurrence: "monthly"
        },
        {
          key: "taskWeekly",
          recurrence: "weekly",
          details: ["Test assessment taskWeekly"]
        }
      ],
      invisibleAssessments: [
        {
          key: "taskOnceReportRestricted",
          recurrence: "monthly"
        },
        {
          key: "taskOnceReport",
          recurrence: "monthly"
        },
        {
          key: "task11COnceReport",
          recurrence: "monthly"
        }
      ]
    },
    {
      shortName: "EF8",
      visibleAssessments: [
        {
          key: "taskSemiannuallyRestricted",
          recurrence: "semiannually"
        },
        {
          key: "taskMonthly",
          recurrence: "monthly",
          details: ["Test assessment taskMonthly", "Green"]
        },
        {
          key: "taskWeekly",
          recurrence: "weekly"
        }
      ],
      invisibleAssessments: [
        {
          key: "taskOnceReportRestricted",
          recurrence: "monthly"
        },
        {
          key: "taskOnceReport",
          recurrence: "monthly"
        },
        {
          key: "task11COnceReport",
          recurrence: "monthly"
        }
      ]
    },
    {
      shortName: "EF9",
      visibleAssessments: [
        {
          key: "taskSemiannuallyRestricted",
          recurrence: "semiannually",
          details: ["Test assessment taskSemiannuallyRestricted"]
        },
        {
          key: "taskMonthly",
          recurrence: "monthly"
        },
        {
          key: "taskWeekly",
          recurrence: "weekly"
        }
      ],
      invisibleAssessments: [
        {
          key: "taskOnceReportRestricted",
          recurrence: "monthly"
        },
        {
          key: "taskOnceReport",
          recurrence: "monthly"
        },
        {
          key: "task11COnceReport",
          recurrence: "monthly"
        }
      ]
    }
  ]
  test("As an admin", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 2)

    await test.step(
      "Should see the proper assessment sections for each task",
      async () => {
        await Home.openAsAdminUser()
        for (const t of ASSESSED_TASKS) {
          await (await Home.getSearchBar()).fill(String(t.shortName))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (await Search.linkOfTaskFound(t.shortName)).click()
          await (
            await ShowTask.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          for (const a of t.visibleAssessments) {
            await expect(
              await ShowTask.getAssessmentResults(a.key, a.recurrence)
            ).not.toHaveCount(0)
            if (a.details) {
              await assertAssessmentDetails(
                a.key,
                a.recurrence,
                a.details,
                2,
                1,
                null
              )
            }
          }
        }
        await ShowTask.logout()
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Should not see not-applicable assessment sections for each task",
      async () => {
        await Home.openAsAdminUser()
        for (const t of ASSESSED_TASKS) {
          await (await Home.getSearchBar()).fill(String(t.shortName))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (await Search.linkOfTaskFound(t.shortName)).click()
          await (
            await ShowTask.getForm()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          for (const a of t.invisibleAssessments) {
            await expect(
              await ShowTask.getAssessmentResults(a.key, a.recurrence)
            ).toHaveCount(0)
          }
        }
        await ShowTask.logout()
      },
      { timeout: stepTimeout }
    )
  })
  test("For the periodic task assessments", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 16)

    await test.step("As an advisor who has tasks he is responsible for", async () => {
      await test.step(
        "Should first search, find and open the task page",
        async () => {
          await Home.open("/", ADVISOR1_CREDENTIALS)
          await (await Home.getSearchBar()).fill(String(TASK_SEARCH_STRING))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should allow advisor to successfully add an assessment",
        async () => {
          await (
            await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await ShowTask.getAddAssessmentButton("taskMonthly", "monthly")
          ).click()
          await ShowTask.waitForAssessmentModalForm()

          // NOTE: assuming assessment question content here, may change in future
          await ShowTask.fillAssessmentQuestion(ADVISOR_1_TASK_CREATE_DETAILS)
          await ShowTask.saveAssessmentAndWaitForModalClose(
            "taskMonthly",
            "monthly",
            ADVISOR_1_TASK_CREATE_DETAILS[0]
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should show the same assessment details with the details just created",
        async () => {
          await assertAssessmentDetails(
            "taskMonthly",
            "monthly",
            ADVISOR_1_TASK_CREATE_DETAILS
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should allow the author of the assessment to successfully edit it",
        async () => {
          await (
            await ShowTask.getEditAssessmentButton("taskMonthly", "monthly")
          ).click()
          await ShowTask.waitForAssessmentModalForm()
          await ShowTask.fillAssessmentQuestion(
            ADVISOR_1_TASK_EDIT_DETAILS,
            ADVISOR_1_TASK_CREATE_DETAILS[0]
          )
          await ShowTask.saveAssessmentAndWaitForModalClose(
            "taskMonthly",
            "monthly",
            ADVISOR_1_TASK_EDIT_DETAILS[0]
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should show the same assessment details with the details just edited",
        async () => {
          await assertAssessmentDetails(
            "taskMonthly",
            "monthly",
            ADVISOR_1_TASK_EDIT_DETAILS
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should see an add button for taskMonthly assessments in the future",
        async () => {
          await (
            await ShowTask.getNextPeriodButton("taskMonthly", "monthly")
          ).click()
          await (
            await ShowTask.getFutureAddAssessmentButton(
              "taskMonthly",
              "monthly"
            )
          ).waitFor({
            state: "attached",
            timeout: 10000
          })
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not see an add button for taskWeekly assessments in the future",
        async () => {
          await (
            await ShowTask.getNextPeriodButton("taskWeekly", "weekly")
          ).click()
          await expect(
            await ShowTask.getFutureAddAssessmentButton("taskWeekly", "weekly")
          ).toHaveCount(0)
          await ShowTask.logout()
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("As an admin", async () => {
      await test.step(
        "Should first search, find and open the task's page",
        async () => {
          await Home.openAsAdminUser()
          await (await Home.getSearchBar()).fill(String(TASK_SEARCH_STRING))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not show make assessment button when there is an assessment on that period",
        async () => {
          await expect(
            await ShowTask.getAddAssessmentButton("taskMonthly", "monthly")
          ).toHaveCount(0)
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should allow admins to successfully edit existing assessment",
        async () => {
          await (
            await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await ShowTask.getEditAssessmentButton("taskMonthly", "monthly")
          ).click()
          await ShowTask.waitForAssessmentModalForm()

          // NOTE: assuming assessment question content here, may change in future
          await ShowTask.fillAssessmentQuestion(
            ADMIN_TASK_EDIT_DETAILS,
            ADVISOR_1_TASK_EDIT_DETAILS[0]
          )
          await ShowTask.saveAssessmentAndWaitForModalClose(
            "taskMonthly",
            "monthly",
            ADMIN_TASK_EDIT_DETAILS[0]
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should show the same assessment details with the details just edited",
        async () => {
          await assertAssessmentDetails(
            "taskMonthly",
            "monthly",
            ADMIN_TASK_EDIT_DETAILS
          )
          await ShowTask.logout()
        },
        { timeout: stepTimeout }
      )
    })
    await test.step("As a different advisor responsible from same task", async () => {
      await test.step(
        "Should first search, find and open the task's page",
        async () => {
          await Home.open("/", ADVISOR2_CREDENTIALS)
          await (await Home.getSearchBar()).fill(String(TASK_SEARCH_STRING))
          await (await Home.getSubmitSearch()).click()
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "attached",
            timeout: 20000
          })
          await (
            await Search.getFoundTaskTable()
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should not show make assessment button when there is an assessment on that period",
        async () => {
          await expect(
            await ShowTask.getAddAssessmentButton("taskMonthly", "monthly")
          ).toHaveCount(0)
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should allow the other advisor to successfully edit existing assessment",
        async () => {
          await (
            await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
          ).waitFor({
            state: "visible",
            timeout: 10000
          })
          await (
            await ShowTask.getEditAssessmentButton("taskMonthly", "monthly")
          ).click()
          await ShowTask.waitForAssessmentModalForm()

          // NOTE: assuming assessment question content here, may change in future
          await ShowTask.fillAssessmentQuestion(
            ADVISOR_2_TASK_EDIT_DETAILS,
            ADMIN_TASK_EDIT_DETAILS[0]
          )
          await ShowTask.saveAssessmentAndWaitForModalClose(
            "taskMonthly",
            "monthly",
            ADVISOR_2_TASK_EDIT_DETAILS[0]
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should show the same assessment details with the details just edited",
        async () => {
          await assertAssessmentDetails(
            "taskMonthly",
            "monthly",
            ADVISOR_2_TASK_EDIT_DETAILS
          )
        },
        { timeout: stepTimeout }
      )
      await test.step(
        "Should allow the other advisor to delete the assessment",
        async () => {
          await (await ShowTask.getDeleteAssessmentButton()).click()
          await ShowTask.confirmDelete()
          await ShowTask.waitForDeletedAssessmentToDisappear(
            "taskMonthly",
            "monthly"
          )
          await ShowTask.logout()
        },
        { timeout: stepTimeout }
      )
    })
  })
  const assertAssessmentDetails = async (
    assessmentKey,
    recurrence,
    assessmentDetails,
    row = 2,
    column = 1,
    valueToText = VALUE_TO_TEXT_FOR_TASK
  ) => {
    const details = await ShowTask.getShownAssessmentDetails(
      assessmentKey,
      recurrence,
      row,
      column
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
