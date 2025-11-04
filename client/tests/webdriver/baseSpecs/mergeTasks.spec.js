import { expect } from "chai"
import MergeTasks from "../pages/mergeTasks.page"

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
    shortName: "Merge Task 1",
    longName: "Long Merge 1 Name",
    status: "ACTIVE",
    displayedName: "TAAC\n»\nTAAC Air\n»\nMerge Task 1",
    parentTask: "TAAC\n»\nTAAC Air"
  },
  validRight: {
    search: "Merge Task 2",
    shortName: "Merge Task 2",
    longName: "Long Merge 2 Name",
    status: "ACTIVE",
    displayedName: "TAAC\n»\nTAAC Air\n»\nMerge Task 2",
    parentTask: "TAAC\n»\nTAAC Air"
  }
}

describe("Merge tasks error", () => {
  it("Should show an error when merging tasks would create a loop", async () => {
    await MergeTasks.openPage()
    await (await MergeTasks.getTitle()).waitForExist()
    await (await MergeTasks.getTitle()).waitForDisplayed()

    await (await MergeTasks.getLeftTaskField()).click()
    await (
      await MergeTasks.getLeftTaskField()
    ).setValue(EXAMPLE_TASKS.childLeft.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.childLeft.displayedName
    )
    await (await MergeTasks.getItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeTasks.waitForColumnToChange(
      EXAMPLE_TASKS.childLeft.shortName,
      "left",
      "Short name"
    )

    await (await MergeTasks.getRightTaskField()).click()
    await (
      await MergeTasks.getRightTaskField()
    ).setValue(EXAMPLE_TASKS.parentRight.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.parentRight.displayedName,
      4
    )
    await (await MergeTasks.getItemFromAdvancedSelect(4)).click()
    await browser.pause(500)
    await MergeTasks.waitForColumnToChange(
      EXAMPLE_TASKS.parentRight.shortName,
      "right",
      "Short name"
    )

    await (await MergeTasks.getUseAllButton("left")).click()
    await browser.pause(500)
    await (await MergeTasks.getMergeTasksButton()).click()
    await MergeTasks.waitForAlertDangerToLoad()
    expect(await (await MergeTasks.getAlertDanger()).getText()).to.eq(
      "Task can not be its own (grand…)parent"
    )
  })
})

describe("Merge tasks page", () => {
  it("Should display a warning when leaving the page with unsaved changes", async () => {
    await MergeTasks.openPage()
    await (await MergeTasks.getTitle()).waitForExist()
    await (await MergeTasks.getTitle()).waitForDisplayed()
    await (await MergeTasks.getLeftTaskField()).click()
    await (
      await MergeTasks.getLeftTaskField()
    ).setValue(EXAMPLE_TASKS.validLeft.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.validLeft.displayedName
    )
    await (await MergeTasks.getItemFromAdvancedSelect()).click()
    // attempt to leave when only one task is selected, should allow to leave
    await (await $("#anet-logo")).click()
    // eslint-disable-next-line no-unused-expressions
    expect(await (await $(".modal-dialog")).isExisting()).to.be.false

    await MergeTasks.openPage()
    await (await MergeTasks.getTitle()).waitForExist()
    await (await MergeTasks.getTitle()).waitForDisplayed()
    await (await MergeTasks.getLeftTaskField()).click()
    await (
      await MergeTasks.getLeftTaskField()
    ).setValue(EXAMPLE_TASKS.validLeft.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.validLeft.displayedName
    )
    await (await MergeTasks.getItemFromAdvancedSelect()).click()
    await (await MergeTasks.getRightTaskField()).click()
    await (
      await MergeTasks.getRightTaskField()
    ).setValue(EXAMPLE_TASKS.validRight.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.validRight.displayedName
    )
    // attempt to leave when both tasks are selected, should show warning
    await (await MergeTasks.getItemFromAdvancedSelect()).click()
    await (await $("#anet-logo")).click()
    const modalDialog = await $(".modal-dialog")
    // eslint-disable-next-line no-unused-expressions
    expect(await modalDialog.isExisting()).to.be.true
    await $(".btn-danger").click()
  })
  it("Should display field values of the left task", async () => {
    await MergeTasks.openPage()
    await (await MergeTasks.getTitle()).waitForExist()
    await (await MergeTasks.getTitle()).waitForDisplayed()

    await (await MergeTasks.getLeftTaskField()).click()
    await (
      await MergeTasks.getLeftTaskField()
    ).setValue(EXAMPLE_TASKS.validLeft.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.validLeft.displayedName
    )
    await (await MergeTasks.getItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeTasks.waitForColumnToChange(
      EXAMPLE_TASKS.validLeft.shortName,
      "left",
      "Short name"
    )
    expect(
      await (await MergeTasks.getColumnContent("left", "Short name")).getText()
    ).to.eq(EXAMPLE_TASKS.validLeft.shortName)
    expect(
      await (
        await MergeTasks.getColumnContent("left", "Parent objective")
      ).getText()
    ).to.eq(EXAMPLE_TASKS.validLeft.parentTask)
  })

  it("Should not allow to select the same tasks", async () => {
    await (
      await MergeTasks.getRightTaskField()
    ).setValue(EXAMPLE_TASKS.validLeft.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.validLeft.displayedName
    )
    // eslint-disable-next-line no-unused-expressions
    expect(
      await (
        await MergeTasks.getItemRadioButtonFromAdvancedSelect()
      ).isExisting()
    ).to.be.false
  })

  it("Should display field values of the right task", async () => {
    await (await MergeTasks.getRightTaskField()).click()
    await (
      await MergeTasks.getRightTaskField()
    ).setValue(EXAMPLE_TASKS.validRight.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.validRight.displayedName
    )
    await (await MergeTasks.getItemFromAdvancedSelect()).click()
    await browser.pause(500)
    await MergeTasks.waitForColumnToChange(
      EXAMPLE_TASKS.validRight.shortName,
      "right",
      "Short name"
    )
    expect(
      await (await MergeTasks.getColumnContent("right", "Short name")).getText()
    ).to.eq(EXAMPLE_TASKS.validRight.shortName)
    expect(
      await (
        await MergeTasks.getColumnContent("right", "Parent objective")
      ).getText()
    ).to.eq(EXAMPLE_TASKS.validRight.parentTask)
  })

  it("Should autoMerge some identical fields from both tasks", async () => {
    expect(
      await (
        await MergeTasks.getColumnContent("mid", "Parent objective")
      ).getText()
    ).to.eq(EXAMPLE_TASKS.validLeft.parentTask)
    expect(
      await (
        await MergeTasks.getColumnContent("mid", "Parent objective")
      ).getText()
    ).to.eq(EXAMPLE_TASKS.validRight.parentTask)

    expect(
      await (await MergeTasks.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_TASKS.validLeft.status)
    expect(
      await (await MergeTasks.getColumnContent("mid", "Status")).getText()
    ).to.eq(EXAMPLE_TASKS.validRight.status)
  })

  it("Should be able to select all fields from left task", async () => {
    await (await MergeTasks.getUseAllButton("left")).click()
    await browser.pause(500)

    await MergeTasks.waitForColumnToChange(
      EXAMPLE_TASKS.validLeft.shortName,
      "mid",
      "Short name"
    )
    expect(
      await (await MergeTasks.getColumnContent("mid", "Short name")).getText()
    ).to.eq(EXAMPLE_TASKS.validLeft.shortName)
  })

  it("Should be able to select all fields from right task", async () => {
    await (await MergeTasks.getUseAllButton("right")).click()
    await browser.pause(500)

    await MergeTasks.waitForColumnToChange(
      EXAMPLE_TASKS.validRight.shortName,
      "mid",
      "Short name"
    )
    expect(
      await (await MergeTasks.getColumnContent("mid", "Short name")).getText()
    ).to.eq(EXAMPLE_TASKS.validRight.shortName)
  })

  it("Should be able to select from both left and right side", async () => {
    await (await MergeTasks.getLeftTaskField()).click()
    await (
      await MergeTasks.getLeftTaskField()
    ).setValue(EXAMPLE_TASKS.validLeft.search)
    await MergeTasks.waitForAdvancedSelectLoading(
      EXAMPLE_TASKS.validLeft.displayedName
    )
    await (await MergeTasks.getItemFromAdvancedSelect()).click()
    await browser.pause(500)

    await (await MergeTasks.getSelectButton("left", "Short name")).click()
    await MergeTasks.waitForColumnToChange(
      EXAMPLE_TASKS.validLeft.shortName,
      "mid",
      "Short name"
    )
    expect(
      await (await MergeTasks.getColumnContent("mid", "Short name")).getText()
    ).to.eq(EXAMPLE_TASKS.validLeft.shortName)

    await (await MergeTasks.getSelectButton("right", "Long name")).click()
    await MergeTasks.waitForColumnToChange(
      EXAMPLE_TASKS.validRight.longName,
      "mid",
      "Long name"
    )
    expect(
      await (await MergeTasks.getColumnContent("mid", "Long name")).getText()
    ).to.eq(EXAMPLE_TASKS.validRight.longName)
  })

  it("Should not be able to click merge button when some fields are empty", async () => {
    // eslint-disable-next-line no-unused-expressions
    expect(await (await MergeTasks.getMergeTasksButton()).isClickable()).to.be
      .false
  })

  it("Should be able to merge both tasks when winner is left task", async () => {
    await (await MergeTasks.getUseAllButton("left")).click()
    await browser.pause(500)
    await (await MergeTasks.getMergeTasksButton()).click()
    await MergeTasks.waitForSuccessAlert()
  })
})
