import { expect } from "chai"
import Home from "../pages/home.page"
import Search from "../pages/search.page"
import ShowTask from "../pages/showTask.page"

const TASK_SEARCH_STRING = "1.1.A"
// both are responsible from '1.1.A Milestone' task
const ADVISOR1_CREDENTIALS = "elizabeth"
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
      { key: "taskOnceReportRestricted", recurrence: "monthly" },
      {
        key: "taskMonthly",
        recurrence: "monthly",
        details: [
          "Test assessment taskMonthly with questionFor11B",
          "Test assessment taskMonthly with questionFor11B",
          "Amber"
        ]
      },
      { key: "taskWeekly", recurrence: "weekly" },
      { key: "taskOnceReport", recurrence: "monthly" }
    ],
    invisibleAssessments: [
      { key: "taskSemiannuallyRestricted", recurrence: "semiannually" },
      { key: "task11COnceReport", recurrence: "monthly" }
    ]
  },
  {
    shortName: "1.1.C",
    visibleAssessments: [
      { key: "taskOnceReportRestricted", recurrence: "monthly" },
      { key: "taskMonthly", recurrence: "monthly" },
      { key: "taskWeekly", recurrence: "weekly" },
      { key: "taskOnceReport", recurrence: "monthly" },
      { key: "task11COnceReport", recurrence: "monthly" }
    ],
    invisibleAssessments: [
      { key: "taskSemiannuallyRestricted", recurrence: "semiannually" }
    ]
  },
  {
    shortName: "1.3.A",
    visibleAssessments: [
      { key: "taskMonthly", recurrence: "monthly" },
      { key: "taskWeekly", recurrence: "weekly" },
      { key: "taskOnceReport", recurrence: "monthly" }
    ],
    invisibleAssessments: [
      { key: "taskOnceReportRestricted", recurrence: "monthly" },
      { key: "taskSemiannuallyRestricted", recurrence: "semiannually" },
      { key: "task11COnceReport", recurrence: "monthly" }
    ]
  },
  {
    shortName: "2.C",
    visibleAssessments: [
      { key: "taskOnceReportRestricted", recurrence: "monthly" },
      { key: "taskMonthly", recurrence: "monthly" },
      { key: "taskWeekly", recurrence: "weekly" },
      { key: "taskOnceReport", recurrence: "monthly" }
    ],
    invisibleAssessments: [
      { key: "taskSemiannuallyRestricted", recurrence: "semiannually" },
      { key: "task11COnceReport", recurrence: "monthly" }
    ]
  },
  {
    shortName: "EF7",
    visibleAssessments: [
      { key: "taskSemiannuallyRestricted", recurrence: "semiannually" },
      { key: "taskMonthly", recurrence: "monthly" },
      {
        key: "taskWeekly",
        recurrence: "weekly",
        details: ["Test assessment taskWeekly"]
      }
    ],
    invisibleAssessments: [
      { key: "taskOnceReportRestricted", recurrence: "monthly" },
      { key: "taskOnceReport", recurrence: "monthly" },
      { key: "task11COnceReport", recurrence: "monthly" }
    ]
  },
  {
    shortName: "EF8",
    visibleAssessments: [
      { key: "taskSemiannuallyRestricted", recurrence: "semiannually" },
      {
        key: "taskMonthly",
        recurrence: "monthly",
        details: ["Test assessment taskMonthly", "Green"]
      },
      { key: "taskWeekly", recurrence: "weekly" }
    ],
    invisibleAssessments: [
      { key: "taskOnceReportRestricted", recurrence: "monthly" },
      { key: "taskOnceReport", recurrence: "monthly" },
      { key: "task11COnceReport", recurrence: "monthly" }
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
      { key: "taskMonthly", recurrence: "monthly" },
      { key: "taskWeekly", recurrence: "weekly" }
    ],
    invisibleAssessments: [
      { key: "taskOnceReportRestricted", recurrence: "monthly" },
      { key: "taskOnceReport", recurrence: "monthly" },
      { key: "task11COnceReport", recurrence: "monthly" }
    ]
  }
]

describe("As an admin", () => {
  it("Should see the proper assessment sections for each task", async () => {
    await Home.openAsAdminUser()
    for (const t of ASSESSED_TASKS) {
      await (await Home.getSearchBar()).setValue(t.shortName)
      await (await Home.getSubmitSearch()).click()
      await (await Search.getFoundTaskTable()).waitForExist({ timeout: 20000 })
      await (await Search.getFoundTaskTable()).waitForDisplayed()
      await (await Search.linkOfTaskFound(t.shortName)).click()
      await (await ShowTask.getForm()).waitForDisplayed()

      for (const a of t.visibleAssessments) {
        expect(
          await (
            await ShowTask.getAssessmentResults(a.key, a.recurrence)
          ).isExisting()
        ).to.equal(true)
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
  })

  it("Should not see not-applicable assessment sections for each task", async () => {
    await Home.openAsAdminUser()
    for (const t of ASSESSED_TASKS) {
      await (await Home.getSearchBar()).setValue(t.shortName)
      await (await Home.getSubmitSearch()).click()
      await (await Search.getFoundTaskTable()).waitForExist({ timeout: 20000 })
      await (await Search.getFoundTaskTable()).waitForDisplayed()
      await (await Search.linkOfTaskFound(t.shortName)).click()
      await (await ShowTask.getForm()).waitForDisplayed()

      for (const a of t.invisibleAssessments) {
        expect(
          await (
            await ShowTask.getAssessmentResults(a.key, a.recurrence)
          ).isExisting()
        ).to.equal(false)
      }
    }
  })
})

describe("For the periodic task assessments", () => {
  describe("As an advisor who has tasks he is responsible for", () => {
    it("Should first search, find and open the task page", async () => {
      await Home.open("/", ADVISOR1_CREDENTIALS)
      await (await Home.getSearchBar()).setValue(TASK_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (await Search.getFoundTaskTable()).waitForExist({ timeout: 20000 })
      await (await Search.getFoundTaskTable()).waitForDisplayed()
      await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
    })

    it("Should allow advisor to successfully add an assessment", async () => {
      await (
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
      ).waitForExist()
      await (
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
      ).waitForDisplayed()
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

    it("Should show the same assessment details with the details just created", async () => {
      await assertAssessmentDetails(
        "taskMonthly",
        "monthly",
        ADVISOR_1_TASK_CREATE_DETAILS
      )
    })

    it("Should allow the author of the assessment to successfully edit it", async () => {
      await (
        await ShowTask.getEditAssessmentButton("taskMonthly", "monthly")
      ).waitForExist()
      await (
        await ShowTask.getEditAssessmentButton("taskMonthly", "monthly")
      ).waitForDisplayed()
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

    it("Should show the same assessment details with the details just edited", async () => {
      await assertAssessmentDetails(
        "taskMonthly",
        "monthly",
        ADVISOR_1_TASK_EDIT_DETAILS
      )
    })

    it("Should see an add button for taskMonthly assessments in the future", async () => {
      await (
        await ShowTask.getNextPeriodButton("taskMonthly", "monthly")
      ).waitForExist()

      await (
        await ShowTask.getNextPeriodButton("taskMonthly", "monthly")
      ).click()

      await (
        await ShowTask.getFutureAddAssessmentButton("taskMonthly", "monthly")
      ).waitForExist()
    })

    it("Should not see an add button for taskWeekly assessments in the future", async () => {
      await (
        await ShowTask.getNextPeriodButton("taskWeekly", "weekly")
      ).waitForExist()

      await (await ShowTask.getNextPeriodButton("taskWeekly", "weekly")).click()

      expect(
        await (
          await ShowTask.getFutureAddAssessmentButton("taskWeekly", "weekly")
        ).isExisting()
      ).to.equal(false)

      await ShowTask.logout()
    })
  })

  describe("As an admin", () => {
    it("Should first search, find and open the task's page", async () => {
      await Home.openAsAdminUser()
      await (await Home.getSearchBar()).setValue(TASK_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (await Search.getFoundTaskTable()).waitForExist({ timeout: 20000 })
      await (await Search.getFoundTaskTable()).waitForDisplayed()
      await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
    })

    it("Should not show make assessment button when there is an assessment on that period", async () => {
      expect(
        await (
          await ShowTask.getAddAssessmentButton("taskMonthly", "monthly")
        ).isExisting()
      ).to.equal(false)
    })

    it("Should allow admins to successfully edit existing assessment", async () => {
      await (
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
      ).waitForExist()
      await (
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
      ).waitForDisplayed()
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

    it("Should show the same assessment details with the details just edited", async () => {
      await assertAssessmentDetails(
        "taskMonthly",
        "monthly",
        ADMIN_TASK_EDIT_DETAILS
      )
      await ShowTask.logout()
    })
  })

  describe("As a different advisor responsible from same task", () => {
    it("Should first search, find and open the task's page", async () => {
      await Home.open("/", ADVISOR2_CREDENTIALS)
      await (await Home.getSearchBar()).setValue(TASK_SEARCH_STRING)
      await (await Home.getSubmitSearch()).click()
      await (await Search.getFoundTaskTable()).waitForExist({ timeout: 20000 })
      await (await Search.getFoundTaskTable()).waitForDisplayed()
      await (await Search.linkOfTaskFound(TASK_SEARCH_STRING)).click()
    })

    it("Should not show make assessment button when there is an assessment on that period", async () => {
      expect(
        await (
          await ShowTask.getAddAssessmentButton("taskMonthly", "monthly")
        ).isExisting()
      ).to.equal(false)
    })

    it("Should allow the other advisor to successfully edit existing assessment", async () => {
      await (
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
      ).waitForExist()
      await (
        await ShowTask.getAssessmentsTable("taskMonthly", "monthly")
      ).waitForDisplayed()
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

    it("Should show the same assessment details with the details just edited", async () => {
      await assertAssessmentDetails(
        "taskMonthly",
        "monthly",
        ADVISOR_2_TASK_EDIT_DETAILS
      )
    })

    it("Should allow the other advisor to delete the assessment", async () => {
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
