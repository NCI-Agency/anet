import { expect, test } from "@playwright/test"
import MergeTasksPageObject from "../pages/mergeTasks.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, MergeTasks
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    MergeTasks = new MergeTasksPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const EXAMPLE_TASKS = {
    childLeft: {
      search: "1.2.C",
      shortName: "1.2.C",
      displayedName: "EF 1\n»\nEF 1.2\n»\n1.2.C"
    },
    parentRight: {
      search: "EF 1.2",
      shortName: "EF 1.2",
      displayedName: "EF 1\n»\nEF 1.2"
    },
    validLeft: {
      search: "Merge Task 1",
      uuid: "cb18b0c1-17d6-417e-951f-9db8b2f39b25",
      shortName: "Merge Task 1",
      longName: "Long Merge 1 Name",
      status: "ACTIVE",
      displayedName: "TAAC\n»\nTAAC Air\n»\nMerge Task 1",
      parentTask: "TAAC\n»\nTAAC Air"
    },
    validRight: {
      search: "Merge Task 2",
      uuid: "867ff6b6-07f7-4448-b2a3-a1bdc9b423be",
      shortName: "Merge Task 2",
      longName: "Long Merge 2 Name",
      status: "ACTIVE",
      displayedName: "TAAC\n»\nTAAC Air\n»\nMerge Task 2",
      parentTask: "TAAC\n»\nTAAC Air"
    }
  }
  test.describe("Merge tasks error", () => {
    test("Should show an error when merging tasks would create a loop", async () => {
      await MergeTasks.openPage()
      await (
        await MergeTasks.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (await MergeTasks.getLeftTaskField()).click()
      await (
        await MergeTasks.getLeftTaskField()
      ).fill(String(EXAMPLE_TASKS.childLeft.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.childLeft.displayedName
      )
      await (await MergeTasks.getItemFromAdvancedSelect()).click()
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.childLeft.shortName,
        "left",
        "Short name"
      )
      await (await MergeTasks.getRightTaskField()).click()
      await (
        await MergeTasks.getRightTaskField()
      ).fill(String(EXAMPLE_TASKS.parentRight.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.parentRight.displayedName,
        4
      )
      await (await MergeTasks.getItemFromAdvancedSelect(4)).click()
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.parentRight.shortName,
        "right",
        "Short name"
      )
      await (await MergeTasks.getUseAllButton("left")).click()
      await (await MergeTasks.getMergeTasksButton()).click()
      await MergeTasks.waitForAlertDangerToLoad()
      await expect(await MergeTasks.getAlertDanger()).toHaveText(
        "Task can not be its own (grand…)parent",
        {
          useInnerText: true
        }
      )
    })
  })
  test.describe("Merge tasks page", () => {
    test("Should display a warning when leaving the page with unsaved changes", async () => {
      await MergeTasks.openPage()
      await (
        await MergeTasks.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (await MergeTasks.getLeftTaskField()).click()
      await (
        await MergeTasks.getLeftTaskField()
      ).fill(String(EXAMPLE_TASKS.validLeft.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.validLeft.displayedName
      )
      await (await MergeTasks.getItemFromAdvancedSelect()).click()
      // attempt to leave when only one task is selected, should allow to leave
      await MergeTasks.clickLogo()
      await expect(await MergeTasks.getModalDialog()).toHaveCount(0)
      await MergeTasks.openPage()
      await (
        await MergeTasks.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (await MergeTasks.getLeftTaskField()).click()
      await (
        await MergeTasks.getLeftTaskField()
      ).fill(String(EXAMPLE_TASKS.validLeft.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.validLeft.displayedName
      )
      await (await MergeTasks.getItemFromAdvancedSelect()).click()
      await (await MergeTasks.getRightTaskField()).click()
      await (
        await MergeTasks.getRightTaskField()
      ).fill(String(EXAMPLE_TASKS.validRight.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.validRight.displayedName
      )
      // attempt to leave when both tasks are selected, should show warning
      await (await MergeTasks.getItemFromAdvancedSelect()).click()
      await MergeTasks.clickLogo()
      await expect(await MergeTasks.getModalDialog()).not.toHaveCount(0)
      await page.locator(".btn-danger").first().click()
    })
    test("Should display field values of the left task", async () => {
      await MergeTasks.openPage()
      await (
        await MergeTasks.getTitle()
      ).waitFor({
        state: "visible",
        timeout: 10000
      })
      await (await MergeTasks.getLeftTaskField()).click()
      await (
        await MergeTasks.getLeftTaskField()
      ).fill(String(EXAMPLE_TASKS.validLeft.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.validLeft.displayedName
      )
      await (await MergeTasks.getItemFromAdvancedSelect()).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from left side.
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.validLeft.uuid,
        "left",
        "UUID"
      )
      await expect(
        await MergeTasks.getColumnContent("left", "UUID")
      ).toHaveText(EXAMPLE_TASKS.validLeft.uuid, {
        useInnerText: true
      })
      await expect(
        await MergeTasks.getColumnContent("left", "Short name")
      ).toHaveText(EXAMPLE_TASKS.validLeft.shortName, {
        useInnerText: true
      })
      await expect(
        await MergeTasks.getColumnContent("left", "Parent objective")
      ).toHaveText(EXAMPLE_TASKS.validLeft.parentTask, {
        useInnerText: true
      })
    })
    test("Should not allow to select the same tasks", async () => {
      await (
        await MergeTasks.getRightTaskField()
      ).fill(String(EXAMPLE_TASKS.validLeft.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.validLeft.displayedName
      )
      await expect(
        await MergeTasks.getItemRadioButtonFromAdvancedSelect()
      ).toHaveCount(0)
    })
    test("Should display field values of the right task", async () => {
      await (await MergeTasks.getRightTaskField()).click()
      await (
        await MergeTasks.getRightTaskField()
      ).fill(String(EXAMPLE_TASKS.validRight.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.validRight.displayedName
      )
      await (await MergeTasks.getItemFromAdvancedSelect()).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from right side.
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.validRight.uuid,
        "right",
        "UUID"
      )
      await expect(
        await MergeTasks.getColumnContent("right", "UUID")
      ).toHaveText(EXAMPLE_TASKS.validRight.uuid, {
        useInnerText: true
      })
      await expect(
        await MergeTasks.getColumnContent("right", "Short name")
      ).toHaveText(EXAMPLE_TASKS.validRight.shortName, {
        useInnerText: true
      })
      await expect(
        await MergeTasks.getColumnContent("right", "Parent objective")
      ).toHaveText(EXAMPLE_TASKS.validRight.parentTask, {
        useInnerText: true
      })
    })
    test("Should autoMerge some identical fields from both tasks", async () => {
      await expect(
        await MergeTasks.getColumnContent("mid", "Parent objective")
      ).toHaveText(EXAMPLE_TASKS.validLeft.parentTask, {
        useInnerText: true
      })
      await expect(
        await MergeTasks.getColumnContent("mid", "Parent objective")
      ).toHaveText(EXAMPLE_TASKS.validRight.parentTask, {
        useInnerText: true
      })
      await expect(
        await MergeTasks.getColumnContent("mid", "Status")
      ).toHaveText(EXAMPLE_TASKS.validLeft.status, {
        useInnerText: true
      })
      await expect(
        await MergeTasks.getColumnContent("mid", "Status")
      ).toHaveText(EXAMPLE_TASKS.validRight.status, {
        useInnerText: true
      })
    })
    test("Should be able to select all fields from left task", async () => {
      await (await MergeTasks.getUseAllButton("left")).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from left side.
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.validLeft.uuid,
        "mid",
        "UUID"
      )
      await expect(await MergeTasks.getColumnContent("mid", "UUID")).toHaveText(
        EXAMPLE_TASKS.validLeft.uuid,
        {
          useInnerText: true
        }
      )
      await expect(
        await MergeTasks.getColumnContent("mid", "Short name")
      ).toHaveText(EXAMPLE_TASKS.validLeft.shortName, {
        useInnerText: true
      })
    })
    test("Should be able to select all fields from right task", async () => {
      await (await MergeTasks.getUseAllButton("right")).click()
      // wait for the rendering of custom fields
      // Check if the fields displayed properly after selecting from right side.
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.validRight.uuid,
        "mid",
        "UUID"
      )
      await expect(await MergeTasks.getColumnContent("mid", "UUID")).toHaveText(
        EXAMPLE_TASKS.validRight.uuid,
        {
          useInnerText: true
        }
      )
      await expect(
        await MergeTasks.getColumnContent("mid", "Short name")
      ).toHaveText(EXAMPLE_TASKS.validRight.shortName, {
        useInnerText: true
      })
    })
    test("Should be able to select from both left and right side", async () => {
      // Perform a fresh search to clear the merge state
      await (await MergeTasks.getLeftTaskField()).click()
      await (
        await MergeTasks.getLeftTaskField()
      ).fill(String(EXAMPLE_TASKS.validLeft.search))
      await MergeTasks.waitForAdvancedSelectLoading(
        EXAMPLE_TASKS.validLeft.displayedName
      )
      await (await MergeTasks.getItemFromAdvancedSelect()).click()
      await (await MergeTasks.getSelectButton("left", "UUID")).click()
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.validLeft.uuid,
        "mid",
        "UUID"
      )
      await expect(await MergeTasks.getColumnContent("mid", "UUID")).toHaveText(
        EXAMPLE_TASKS.validLeft.uuid,
        {
          useInnerText: true
        }
      )
      await (await MergeTasks.getSelectButton("left", "Short name")).click()
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.validLeft.shortName,
        "mid",
        "Short name"
      )
      await expect(
        await MergeTasks.getColumnContent("mid", "Short name")
      ).toHaveText(EXAMPLE_TASKS.validLeft.shortName, {
        useInnerText: true
      })
      await (await MergeTasks.getSelectButton("right", "Long name")).click()
      await MergeTasks.waitForColumnToChange(
        EXAMPLE_TASKS.validRight.longName,
        "mid",
        "Long name"
      )
      await expect(
        await MergeTasks.getColumnContent("mid", "Long name")
      ).toHaveText(EXAMPLE_TASKS.validRight.longName, {
        useInnerText: true
      })
    })
    test("Should not be able to click merge button when some fields are empty", async () => {
      await expect(await MergeTasks.getMergeTasksButton()).toBeDisabled()
    })
    test("Should be able to merge both tasks when winner is left task", async () => {
      await (await MergeTasks.getUseAllButton("left")).click()
      await (await MergeTasks.getMergeTasksButton()).click()
      await MergeTasks.waitForSuccessAlert()
    })
  })
})
