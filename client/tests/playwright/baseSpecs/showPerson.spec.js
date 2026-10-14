import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import MergePeople from "../pages/mergePeople.page.js"
import ShowPerson from "../pages/showPerson.page.js"
import { currentPage, test, waitFor } from "../support.js"

const PERSON_UUID = "df9c7381-56ac-4bc5-8e24-ec524bccd7e9"
const PERSON_WITH_AG_UUID = "31cba227-f6c6-49e9-9483-fce441bea624" // CIV Creed Bratton

test.describe("Show person page", () => {
  test.describe("When on the show page of a person with communities", () => {
    test("We should see a table with communities", async () => {
      await ShowPerson.open(PERSON_WITH_AG_UUID)
      await waitFor(await ShowPerson.getAuthorizationGroupsTable(), "attached")
      await waitFor(await ShowPerson.getAuthorizationGroupsTable(), "visible")
      await pwExpect(
        await ShowPerson.getAuthorizationGroupsTable()
      ).toContainText("EF 5", {
        useInnerText: true
      })
    })
    test("We can go to the show page of a community", async () => {
      await (await ShowPerson.getAuthorizationGroup(1)).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/communities/ab1a7d99-4529-44b1-a118-bdee3ca8296b")
    })
  })
  test.describe("When on the show page of a person with attachment(s)", () => {
    test("We should see a container for Attachment List", async () => {
      await ShowPerson.open(PERSON_UUID)
      await waitFor(await ShowPerson.getAttachments(), "attached")
      await waitFor(await ShowPerson.getAttachments(), "visible")
    })
    test("We should see a card of Attachment", async () => {
      await waitFor(await ShowPerson.getCard(), "attached")
      await waitFor(await ShowPerson.getCard(), "visible")
      await pwExpect
        .poll(async () => await ShowPerson.getClassificationLine())
        .toEqual("[Public]")
      await pwExpect
        .poll(async () => await ShowPerson.getCaptionLine())
        .toEqual("Erin")
    })
    test("We should be able to edit the attachments", async () => {
      const editAttachmentsButton = await ShowPerson.getEditAttachmentsButton()
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
        .toContain("/attachments/13318e42-a0a3-438f-8ed5-dc16b1ef17bc/edit")
      await editAttachmentsButton.click()
    })
    test("We can go to the show page of Attachment", async () => {
      await (await ShowPerson.getImageClick()).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/attachments/13318e42-a0a3-438f-8ed5-dc16b1ef17bc")
      await ShowPerson.logout()
    })
  })
  test.describe("When on the show page of a person as admin", () => {
    test("We can select to merge them with another person", async () => {
      await ShowPerson.openAsAdminUser(PERSON_WITH_AG_UUID)
      await (await ShowPerson.getMergeButton()).click()
      // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergePeople.getTitle()).to.exist
      await pwExpect
        .poll(
          async () =>
            await (await MergePeople.getLeftPersonField()).inputValue()
        )
        .toContain("Creed Bratton")
      await pwExpect(await MergePeople.getLeftPersonField()).not.toBeEnabled()
    })
  })
  test.describe("When on the show page of a person with additional positions", () => {
    test("We should see a table with additional positions", async () => {
      await ShowPerson.open(PERSON_WITH_AG_UUID)
      await waitFor(await ShowPerson.getAdditionalPositionsTable(), "attached")
      await waitFor(await ShowPerson.getAdditionalPositionsTable(), "visible")
      await pwExpect(
        await ShowPerson.getAdditionalPositionsTable()
      ).toContainText("EF 1.1 Advisor for Interagency Advising", {
        useInnerText: true
      })
      await pwExpect(
        await ShowPerson.getAdditionalPositionsTable()
      ).toContainText("EF 1.1 Advisor for Space Issues", {
        useInnerText: true
      })
    })
  })
})
