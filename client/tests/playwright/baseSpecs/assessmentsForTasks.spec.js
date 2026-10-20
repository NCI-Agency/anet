import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import Home from "../pages/home.page.js"
import Search from "../pages/search.page.js"
import ShowTask from "../pages/showTask.page.js"
import { mapSequential, test, waitFor } from "../support.js"

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
test.describe("As an admin", () => {
  test("Should see the proper assessment sections for each task", async () => {
    await Home.openAsAdminUser()
    for (const t of ASSESSED_TASKS) {
      await (await Home.getSearchBar()).fill(String(t.shortName))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundTaskTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundTaskTable(), "visible")
      await (await Search.linkOfTaskFound(t.shortName)).click()
      await waitFor(await ShowTask.getForm(), "visible")
      for (const a of t.visibleAssessments) {
        await pwExpect(
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
  })
  test("Should not see not-applicable assessment sections for each task", async () => {
    await Home.openAsAdminUser()
    for (const t of ASSESSED_TASKS) {
      await (await Home.getSearchBar()).fill(String(t.shortName))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundTaskTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundTaskTable(), "visible")
      await (await Search.linkOfTaskFound(t.shortName)).click()
      await waitFor(await ShowTask.getForm(), "visible")
      for (const a of t.invisibleAssessments) {
        await pwExpect(
          await ShowTask.getAssessmentResults(a.key, a.recurrence)
        ).toHaveCount(0)
      }
    }
    await ShowTask.logout()
  })
})
test.describe("For the periodic task assessments", () => {
  test.describe("As an advisor who has tasks he is responsible for", () => {
    test("Should first search, find and open the task page", async () => {
      await Home.open("/", ADVISOR1_CREDENTIALS)
      await (await Home.getSearchBar()).fill(String(TASK_SEARCH_STRING))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundTaskTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundTaskTable(), "visible")
      await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
    })
    test("Should allow advisor to successfully add an assessment", async () => {
      await waitFor(
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly"),
        "attached"
      )
      await waitFor(
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly"),
        "visible"
      )
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
    })
    test("Should show the same assessment details with the details just created", async () => {
      await assertAssessmentDetails(
        "taskMonthly",
        "monthly",
        ADVISOR_1_TASK_CREATE_DETAILS
      )
    })
    test("Should allow the author of the assessment to successfully edit it", async () => {
      await waitFor(
        await ShowTask.getEditAssessmentButton("taskMonthly", "monthly"),
        "attached"
      )
      await waitFor(
        await ShowTask.getEditAssessmentButton("taskMonthly", "monthly"),
        "visible"
      )
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
    })
    test("Should show the same assessment details with the details just edited", async () => {
      await assertAssessmentDetails(
        "taskMonthly",
        "monthly",
        ADVISOR_1_TASK_EDIT_DETAILS
      )
    })
    test("Should see an add button for taskMonthly assessments in the future", async () => {
      await waitFor(
        await ShowTask.getNextPeriodButton("taskMonthly", "monthly"),
        "attached"
      )
      await (
        await ShowTask.getNextPeriodButton("taskMonthly", "monthly")
      ).click()
      await waitFor(
        await ShowTask.getFutureAddAssessmentButton("taskMonthly", "monthly"),
        "attached"
      )
    })
    test("Should not see an add button for taskWeekly assessments in the future", async () => {
      await waitFor(
        await ShowTask.getNextPeriodButton("taskWeekly", "weekly"),
        "attached"
      )
      await (await ShowTask.getNextPeriodButton("taskWeekly", "weekly")).click()
      await pwExpect(
        await ShowTask.getFutureAddAssessmentButton("taskWeekly", "weekly")
      ).toHaveCount(0)
      await ShowTask.logout()
    })
  })
  test.describe("As an admin", () => {
    test("Should first search, find and open the task's page", async () => {
      await Home.openAsAdminUser()
      await (await Home.getSearchBar()).fill(String(TASK_SEARCH_STRING))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundTaskTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundTaskTable(), "visible")
      await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
    })
    test("Should not show make assessment button when there is an assessment on that period", async () => {
      await pwExpect(
        await ShowTask.getAddAssessmentButton("taskMonthly", "monthly")
      ).toHaveCount(0)
    })
    test("Should allow admins to successfully edit existing assessment", async () => {
      await waitFor(
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly"),
        "attached"
      )
      await waitFor(
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly"),
        "visible"
      )
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
    })
    test("Should show the same assessment details with the details just edited", async () => {
      await assertAssessmentDetails(
        "taskMonthly",
        "monthly",
        ADMIN_TASK_EDIT_DETAILS
      )
      await ShowTask.logout()
    })
  })
  test.describe("As a different advisor responsible from same task", () => {
    test("Should first search, find and open the task's page", async () => {
      await Home.open("/", ADVISOR2_CREDENTIALS)
      await (await Home.getSearchBar()).fill(String(TASK_SEARCH_STRING))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundTaskTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundTaskTable(), "visible")
      await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
    })
    test("Should not show make assessment button when there is an assessment on that period", async () => {
      await pwExpect(
        await ShowTask.getAddAssessmentButton("taskMonthly", "monthly")
      ).toHaveCount(0)
    })
    test("Should allow the other advisor to successfully edit existing assessment", async () => {
      await waitFor(
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly"),
        "attached"
      )
      await waitFor(
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly"),
        "visible"
      )
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
    })
    test("Should show the same assessment details with the details just edited", async () => {
      await assertAssessmentDetails(
        "taskMonthly",
        "monthly",
        ADVISOR_2_TASK_EDIT_DETAILS
      )
    })
    test("Should allow the other advisor to delete the assessment", async () => {
      await (await ShowTask.getDeleteAssessmentButton()).click()
      await ShowTask.confirmDelete()
      await ShowTask.waitForDeletedAssessmentToDisappear(
        "taskMonthly",
        "monthly"
      )
      await ShowTask.logout()
    })
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
  await mapSequential(details, async (detail, index) => {
    const pre = `${index}-) `
    const det = (await detail.innerText()).trim()
    expect(`${pre}${det}`).to.equal(
      `${pre}${valueToText?.[assessmentDetails[index]] || assessmentDetails[index]}`
    )
  })
}
