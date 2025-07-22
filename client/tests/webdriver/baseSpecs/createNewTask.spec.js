import { expect } from "chai"
import CreateTask from "../pages/createNewTask.page"
import ShowTask from "../pages/showTask.page"

const SHORT_NAME = "TO 1"
const LONG_NAME = "To the 1"
const PARENT_TASK = "TAAC Air"
const DESCRIPTION = "Test Task 1"

const SHORT_NAME_SUBTASK = "TO 1.1"
const LONG_NAME_SUBTASK = "To the 1.1"
const DESCRIPTION_SUBTASK = "Test Task 1.1"

describe("When creating an task", () => {
  it("Should show name to be required when submitting empty form", async () => {
    await CreateTask.openAsAdmin()
    await (await CreateTask.getForm()).waitForExist()
    await (await CreateTask.getForm()).waitForDisplayed()
    await CreateTask.submitForm()
    await (await CreateTask.getShortName()).waitForExist()
    await (await CreateTask.getShortName()).waitForDisplayed()
  })

  it("Should successfully create a task", async () => {
    await (await CreateTask.getShortNameInput()).setValue(SHORT_NAME)
    await (await CreateTask.getLongNameInput()).setValue(LONG_NAME)
    await CreateTask.selectParentTaskByText(PARENT_TASK)
    await CreateTask.fillTaskDescription(DESCRIPTION)
    await CreateTask.submitForm()
    await ShowTask.waitForAlertSuccessToLoad()
    expect(await (await ShowTask.getAlertSuccess()).getText()).to.equal(
      "Objective saved"
    )
  })

  it("Should display the newly created task", async () => {
    expect(await (await ShowTask.getShortName()).getText()).to.equal(
      `Objective ${SHORT_NAME}`
    )
    expect(await (await ShowTask.getLongName()).getText()).to.equal(LONG_NAME)
    expect(await (await ShowTask.getDescription()).getText()).to.equal(
      DESCRIPTION
    )
  })

  it("Should be able to create a sub-task for the newly created task", async () => {
    await (await ShowTask.getCreateSubTaskButton()).waitForExist()
    await (await ShowTask.getCreateSubTaskButton()).waitForDisplayed()
    await (await ShowTask.getCreateSubTaskButton()).click()
    await (await CreateTask.getForm()).waitForExist()
    await (await CreateTask.getForm()).waitForDisplayed()
    expect(await (await CreateTask.getParentTaskInput()).getValue()).to.equal(
      SHORT_NAME
    )
    await (await CreateTask.getShortNameInput()).setValue(SHORT_NAME_SUBTASK)
    await (await CreateTask.getLongNameInput()).setValue(LONG_NAME_SUBTASK)
    await CreateTask.fillTaskDescription(DESCRIPTION_SUBTASK)
    await CreateTask.submitForm()
    await ShowTask.waitForAlertSuccessToLoad()
    expect(await (await ShowTask.getAlertSuccess()).getText()).to.equal(
      "Objective saved"
    )
  })

  it("Should display the newly created sub-task", async () => {
    expect(await (await ShowTask.getShortName()).getText()).to.equal(
      `Objective ${SHORT_NAME_SUBTASK}`
    )
    expect(await (await ShowTask.getLongName()).getText()).to.equal(
      LONG_NAME_SUBTASK
    )
    expect(await (await ShowTask.getDescription()).getText()).to.include(
      DESCRIPTION_SUBTASK
    )
  })
})
