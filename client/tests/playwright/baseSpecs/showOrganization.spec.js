import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import Home from "../pages/home.page.js"
import MergeOrganizations from "../pages/mergeOrganizations.page.js"
import Search from "../pages/search.page.js"
import ShowOrganization from "../pages/showOrganization.page.js"
import ShowTask from "../pages/showTask.page.js"
import { currentPage, test, waitFor } from "../support.js"

const EF1_ORGANIZATION_UUID = "9a35caa7-a095-4963-ac7b-b784fde4d583" // EF 1
const EF1_1_ORGANIZATION_UUID = "04614b0f-7e8e-4bf1-8bc5-13abaffeab8a" // EF 1.1
const EF2_2_ORGANIZATION_UUID = "ccbee4bb-08b8-42df-8cb5-65e8172f657b" // EF 2.2
const ORGANIZATION_WITH_AG_UUID = "7f939a44-b9e4-48e0-98f5-7d0ea38a6ecf" // EF 5.1
const ORGANIZATION_EF2_SEARCH_STRING = "EF 2"
const EF1_MATRIX_TASKS = [
  "EF 1",
  "»\n1.1",
  "»\n1.1.A",
  "»\n1.1.B",
  "»\n1.1.C",
  "»\nEF 1.2",
  "»\n1.2.A",
  "»\n1.2.B",
  "»\n1.2.C"
]
const EF1_1_MATRIX_TASKS = [
  "EF 1",
  "»\n1.1",
  "»\n1.1.A",
  "»\n1.1.B",
  "»\n1.1.C"
]
const EF2_ASSIGNED_TASKS = [
  "EF 2\n»\n2.A",
  "EF 2\n»\n2.B",
  "EF 2\n»\n2.C",
  "EF 2\n»\n2.D"
]
const EF2_MATRIX_TASKS = ["EF 2", "»\n2.A", "»\n2.B", "»\n2.C", "»\n2.D"]
const EF2_2_ASSIGNED_TASKS = ["No matching Objective"]
const ORGANIZATION_EF22_SEARCH_STRING = "EF 2.2"
const LEADER_POSITION_TEXT = "EF 2.2 Final Reviewer"
const LEADER_PERSON_TEXT = "CTR Rebecca Beccabon"
const DEPUTY_POSITION_TEXT = "EF 2.2 Superuser"
const DEPUTY_PERSON_TEXT = "CIV Jacob Jacobson"
test.describe("Show organization page", () => {
  test.describe("As an admin", () => {
    test("Should first search, find and open the organization page", async () => {
      await Home.openAsAdminUser()
      await (
        await Home.getSearchBar()
      ).fill(String(ORGANIZATION_EF2_SEARCH_STRING))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundOrganizationTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundOrganizationTable(), "visible")
      await (
        await Search.linkOfOrganizationFound(ORGANIZATION_EF2_SEARCH_STRING)
      ).click()
    })
    test("Should see leader&deputy fields are not listed", async () => {
      // Organization longName should be there
      const longNameField = await ShowOrganization.getLongName()
      await waitFor(longNameField, "attached")
      await waitFor(longNameField, "visible")
      await pwExpect(longNameField).not.toHaveCount(0)

      // Organization leaders should not be there
      const leaderField = await ShowOrganization.getLeaders()
      await pwExpect(leaderField).toHaveCount(0)

      // Organization deputies should not be there
      const deputyField = await ShowOrganization.getDeputies()
      await pwExpect(deputyField).toHaveCount(0)
    })
    test("Should see assigned tasks on the Show page", async () => {
      const tasks = await ShowOrganization.getTasks()
      await waitFor(tasks, "attached")
      await waitFor(tasks, "visible")
      const assignedTasks = await ShowOrganization.getAssignedTasks()
      const assignedTasksShortNames = await Promise.all(
        assignedTasks.map(async at => (await at.innerText()).trim())
      )
      expect(assignedTasksShortNames).to.have.members(EF2_ASSIGNED_TASKS)
    })
    test("Should see sync matrix on the EF2 Show page", async () => {
      const syncMatrix = await ShowTask.getSyncMatrix()
      await waitFor(syncMatrix, "attached")
      await waitFor(syncMatrix, "visible")
      await pwExpect(await syncMatrix.locator(".legend").first()).toContainText(
        "Sync matrix for EF 2",
        {
          useInnerText: true
        }
      )
      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(EF2_MATRIX_TASKS.length)
      const taskPaths = await Promise.all(
        tasks.map(async task =>
          (
            await (await task.locator("td:first-child").first()).innerText()
          ).trim()
        )
      )
      expect(taskPaths).to.deep.equal(EF2_MATRIX_TASKS)
    })
    test("Should see assigned tasks on the Edit page", async () => {
      await (await ShowOrganization.getEditOrganizationButton()).click()
      const editableTasks = await ShowOrganization.getEditableTasks()
      await waitFor(editableTasks, "attached")
      await waitFor(editableTasks, "visible")
      const editableAssignedTasks =
        await ShowOrganization.getEditableAssignedTasks()
      const editableAssignedTasksShortNames = await Promise.all(
        editableAssignedTasks.map(async at => (await at.innerText()).trim())
      )
      expect(editableAssignedTasksShortNames).to.have.members(
        EF2_ASSIGNED_TASKS
      )

      // Log out
      await ShowOrganization.logout()
    })
    test("Should see sync matrix on the EF1 Show page", async () => {
      await ShowOrganization.openAsAdminUser(EF1_ORGANIZATION_UUID)
      const syncMatrix = await ShowTask.getSyncMatrix()
      await waitFor(syncMatrix, "attached")
      await waitFor(syncMatrix, "visible")
      await pwExpect(await syncMatrix.locator(".legend").first()).toContainText(
        "Sync matrix for EF 1",
        {
          useInnerText: true
        }
      )
      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(EF1_MATRIX_TASKS.length)
      const taskPaths = await Promise.all(
        tasks.map(async task =>
          (
            await (await task.locator("td:first-child").first()).innerText()
          ).trim()
        )
      )
      expect(taskPaths).to.deep.equal(EF1_MATRIX_TASKS)
    })
    test("Should see sync matrix on the EF1.1 Show page", async () => {
      await ShowOrganization.openAsAdminUser(EF1_1_ORGANIZATION_UUID)
      const syncMatrix = await ShowTask.getSyncMatrix()
      await waitFor(syncMatrix, "attached")
      await waitFor(syncMatrix, "visible")
      await pwExpect(await syncMatrix.locator(".legend").first()).toContainText(
        "Sync matrix for EF 1.1",
        {
          useInnerText: true
        }
      )
      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(EF1_1_MATRIX_TASKS.length)
      const taskPaths = await Promise.all(
        tasks.map(async task =>
          (
            await (await task.locator("td:first-child").first()).innerText()
          ).trim()
        )
      )
      expect(taskPaths).to.deep.equal(EF1_1_MATRIX_TASKS)
    })
    test("Should see sync matrix on the EF2.2 Show page", async () => {
      await ShowOrganization.openAsAdminUser(EF2_2_ORGANIZATION_UUID)
      const syncMatrix = await ShowTask.getSyncMatrix()
      await waitFor(syncMatrix, "attached")
      await waitFor(syncMatrix, "visible")
      await pwExpect(await syncMatrix.locator(".legend").first()).toContainText(
        "Sync matrix for EF 2.2",
        {
          useInnerText: true
        }
      )
      const eventSeries = await ShowTask.getEventMatrixEventSeries()
      // Additional eventSeries may have been created during the tests!
      expect(eventSeries).to.have.lengthOf.at.least(1)
      const eventSeriesText = (
        await Promise.all(
          eventSeries.map(async es => (await es.innerText()).trim())
        )
      ).join(" ; ")
      expect(eventSeriesText).to.include("NMI PDT")
      expect(eventSeriesText).to.include("My active NMI test event")
      expect(eventSeriesText).to.include("My inactive NMI test event")
      expect(eventSeriesText).to.include("Inactive event series")
      expect(eventSeriesText).to.include("My active test event")
      expect(eventSeriesText).to.include("My inactive test event")
      const tasks = await ShowTask.getEventMatrixTasks()
      expect(tasks.length).to.equal(1)
      const taskPaths = await Promise.all(
        tasks.map(async task =>
          (
            await (await task.locator("td:first-child").first()).innerText()
          ).trim()
        )
      )
      expect(taskPaths).to.deep.equal(EF2_2_ASSIGNED_TASKS)

      // Move to the previous period, the inactive eventSeries should no longer be shown
      await ShowTask.gotoPreviousPeriod()
      // Wait for data retrieval
      const eventSeriesPrev = await ShowTask.getEventMatrixEventSeries()
      const eventSeriesPrevText = (
        await Promise.all(
          eventSeriesPrev.map(async es => (await es.innerText()).trim())
        )
      ).join(" ; ")
      expect(eventSeriesPrevText).to.include("NMI PDT")
      expect(eventSeriesPrevText).to.not.include("My active NMI test event")
      expect(eventSeriesPrevText).to.not.include("My inactive NMI test event")
      expect(eventSeriesPrevText).to.not.include("Inactive event series")
      expect(eventSeriesPrevText).to.not.include("My active test event")
      expect(eventSeriesPrevText).to.not.include("My inactive test event")
      const tasksPrev = await ShowTask.getEventMatrixTasks()
      expect(tasksPrev.length).to.equal(1)
      const tasksPrevPaths = await Promise.all(
        tasks.map(async task =>
          (
            await (await task.locator("td:first-child").first()).innerText()
          ).trim()
        )
      )
      expect(tasksPrevPaths).to.deep.equal(EF2_2_ASSIGNED_TASKS)
    })
  })
  test.describe("As an admin viewing EF 2.2", () => {
    test("Should first search, find and open the organization page", async () => {
      await Home.openAsAdminUser()
      await (
        await Home.getSearchBar()
      ).fill(String(ORGANIZATION_EF22_SEARCH_STRING))
      await (await Home.getSubmitSearch()).click()
      await waitFor(await Search.getFoundOrganizationTable(), "attached", {
        timeout: 20000
      })
      await waitFor(await Search.getFoundOrganizationTable(), "visible")
      await (
        await Search.linkOfOrganizationFound(ORGANIZATION_EF22_SEARCH_STRING)
      ).click()
    })
    test("Should see leader&deputy fields are listed", async () => {
      // Organization longName should be there
      const longNameField = await ShowOrganization.getLongName()
      await waitFor(longNameField, "attached")
      await waitFor(longNameField, "visible")
      await pwExpect(longNameField).not.toHaveCount(0)

      // Organization leaders should be there
      const leaderField = await ShowOrganization.getLeaders()
      await waitFor(leaderField, "attached", {
        timeout: 5000
      })
      await waitFor(leaderField, "visible")
      await pwExpect(leaderField).not.toHaveCount(0)
      await pwExpect(await ShowOrganization.getLeaderPosition()).toHaveText(
        LEADER_POSITION_TEXT,
        {
          useInnerText: true
        }
      )
      await pwExpect(
        await ShowOrganization.getLeaderPositionPerson()
      ).toHaveText(LEADER_PERSON_TEXT, {
        useInnerText: true
      })

      // Organization deputies should be there
      const deputyField = await ShowOrganization.getDeputies()
      await waitFor(deputyField, "attached", {
        timeout: 5000
      })
      await waitFor(deputyField, "visible")
      await pwExpect(deputyField).not.toHaveCount(0)
      await pwExpect(await ShowOrganization.getDeputyPosition()).toHaveText(
        DEPUTY_POSITION_TEXT,
        {
          useInnerText: true
        }
      )
      await pwExpect(
        await ShowOrganization.getDeputyPositionPerson()
      ).toHaveText(DEPUTY_PERSON_TEXT, {
        useInnerText: true
      })

      // Log out
      await ShowOrganization.logout()
    })
  })
  test.describe("When on the show page of an organization with communities", () => {
    test("We should see a table with communities", async () => {
      await ShowOrganization.openAsAdminUser(ORGANIZATION_WITH_AG_UUID)
      await waitFor(
        await ShowOrganization.getAuthorizationGroupsTable(),
        "attached"
      )
      await waitFor(
        await ShowOrganization.getAuthorizationGroupsTable(),
        "visible"
      )
      await pwExpect(
        await ShowOrganization.getAuthorizationGroupsTable()
      ).toContainText("EF 5", {
        useInnerText: true
      })
    })
    test("We can go to the show page of a community", async () => {
      await (await ShowOrganization.getAuthorizationGroup(1)).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/communities/ab1a7d99-4529-44b1-a118-bdee3ca8296b")
    })
  })
  test.describe("When on the show page of an organization with attachment(s)", () => {
    test("We should see a container for Attachment List", async () => {
      await ShowOrganization.open(EF2_2_ORGANIZATION_UUID)
      await waitFor(await ShowOrganization.getAttachments(), "attached")
      await waitFor(await ShowOrganization.getAttachments(), "visible")
    })
    test("We should see a card of Attachment", async () => {
      await waitFor(await ShowOrganization.getCard(), "attached")
      await waitFor(await ShowOrganization.getCard(), "visible")
      await pwExpect
        .poll(async () => await ShowOrganization.getClassificationLine())
        .toEqual("[Public]")
      await pwExpect
        .poll(async () => await ShowOrganization.getCaptionLine())
        .toEqual("EF 2.2")
    })
    test("We should be able to edit the attachments", async () => {
      const editAttachmentsButton =
        await ShowOrganization.getEditAttachmentsButton()
      await pwExpect(editAttachmentsButton).toHaveText("Edit attachments", {
        useInnerText: true
      })
      await editAttachmentsButton.click()
      await pwExpect(editAttachmentsButton).toHaveText("View attachments", {
        useInnerText: true
      })
      const editButton = await currentPage()
        .locator(".attachment-card .button-line a")
        .first()
      await pwExpect
        .poll(async () => await editButton.getAttribute("href"))
        .toContain("/attachments/9ac41246-25ac-457c-b7d6-946c5f625f1f/edit")
      await editAttachmentsButton.click()
    })
    test("We can go to the show page of Attachment", async () => {
      await (await ShowOrganization.getImageClick()).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/attachments/9ac41246-25ac-457c-b7d6-946c5f625f1f")
      await ShowOrganization.logout()
    })
  })
  test.describe("When on the show page of an organization as admin", () => {
    test("We can select to merge it with another organization", async () => {
      await ShowOrganization.openAsAdminUser(EF2_2_ORGANIZATION_UUID)
      await (await ShowOrganization.getMergeButton()).click()
      // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergeOrganizations.getTitle()).to.exist
      await pwExpect
        .poll(
          async () =>
            await (
              await MergeOrganizations.getLeftOrganizationField()
            ).inputValue()
        )
        .toContain("EF 2.2")
      await pwExpect(
        await MergeOrganizations.getLeftOrganizationField()
      ).not.toBeEnabled()
    })
    test("Should open and close the Edit Engagement planning approvals modal correctly", async () => {
      await ShowOrganization.openAsAdminUser(EF2_2_ORGANIZATION_UUID)
      const editButton =
        await ShowOrganization.getEditEngagementPlanningApprovalsButton()
      await waitFor(editButton, "attached")
      await waitFor(editButton, "visible")
      await editButton.click()
      const modal = await ShowOrganization.getEditApprovalsModal()
      await waitFor(modal, "attached")
      await waitFor(modal, "visible")
      const modalTitle = await modal.locator(".modal-title").first()
      await pwExpect(modalTitle).toHaveText(
        "Edit Engagement planning approval process",
        {
          useInnerText: true
        }
      )
      const closeButton = await ShowOrganization.getModalCloseButton()
      await closeButton.click()
      await waitFor(modal, "attached", {
        reverse: true
      })
    })
    test("Should open and close the Edit Report publication approvals modal correctly", async () => {
      await ShowOrganization.openAsAdminUser(EF2_2_ORGANIZATION_UUID)
      const editButton =
        await ShowOrganization.getEditReportPublicationApprovalsButton()
      await waitFor(editButton, "attached")
      await waitFor(editButton, "visible")
      await editButton.click()
      const modal = await ShowOrganization.getEditApprovalsModal()
      await waitFor(modal, "attached")
      await waitFor(modal, "visible")
      const modalTitle = await modal.locator(".modal-title").first()
      await pwExpect(modalTitle).toHaveText(
        "Edit Report publication approval process",
        {
          useInnerText: true
        }
      )
      const closeButton = await ShowOrganization.getModalCloseButton()
      await closeButton.click()
      await waitFor(modal, "attached", {
        reverse: true
      })
    })
  })
  test.describe("When on the show page of an organization with entity avatar", () => {
    test("We should see the avatar", async () => {
      await ShowOrganization.open(EF2_2_ORGANIZATION_UUID)
      await waitFor(await ShowOrganization.getEntityAvatar(), "attached")
      await waitFor(await ShowOrganization.getEntityAvatar(), "visible")
    })
  })
  test.describe("When on the show page of an organization with events", () => {
    test("We should see a table with events", async () => {
      await ShowOrganization.open(EF2_2_ORGANIZATION_UUID)
      await waitFor(await ShowOrganization.getEventsTable(), "attached")
      await waitFor(await ShowOrganization.getEventsTable(), "visible")
      await pwExpect(await ShowOrganization.getEventsTable()).toContainText(
        "NMI PDT 2024-01",
        {
          useInnerText: true
        }
      )
    })
    test("We can go to the show page of event", async () => {
      await (await ShowOrganization.getEvent(5)).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/events/e850846e-9741-40e8-bc51-4dccc30cf47f")
    })
  })
})
