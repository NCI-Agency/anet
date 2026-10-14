import { expect as pwExpect } from "@playwright/test"
import { expect } from "chai"
import MergePositions from "../pages/mergePositions.page.js"
import ShowPosition from "../pages/showPosition.page.js"
import { currentPage, test, waitFor } from "../support.js"

const POSITION_WITH_AG_UUID = "05c42ce0-34a0-4391-8b2f-c4cd85ee6b47" // EF 5.1 Advisor Quality Assurance
const POSITION_WITH_ATTACHMENTS_UUID = "888d6c4b-deaa-4218-b8fd-abfb7c81a4c6" // EF 1.1 Advisor G

test.describe("Show position page", () => {
  test.describe("When on the show page of a position with communities", () => {
    test("We should see a table with communities", async () => {
      await ShowPosition.open(POSITION_WITH_AG_UUID)
      await waitFor(
        await ShowPosition.getAuthorizationGroupsTable(),
        "attached"
      )
      await waitFor(await ShowPosition.getAuthorizationGroupsTable(), "visible")
      await pwExpect(
        await ShowPosition.getAuthorizationGroupsTable()
      ).toContainText("EF 5", {
        useInnerText: true
      })
    })
    test("We can go to the show page of a community", async () => {
      await (await ShowPosition.getAuthorizationGroup(1)).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/communities/ab1a7d99-4529-44b1-a118-bdee3ca8296b")
      await ShowPosition.logout()
    })
  })
  test.describe("When on the show page of a position as admin", () => {
    test("We can select to merge it with another position", async () => {
      await ShowPosition.openAsAdminUser(POSITION_WITH_AG_UUID)
      await (await ShowPosition.getMergeButton()).click()
      // wait for the merge page to render and load data
      // eslint-disable-next-line no-unused-expressions
      expect(await MergePositions.getTitle()).to.exist
      await pwExpect
        .poll(
          async () =>
            await (await MergePositions.getLeftPositionField()).inputValue()
        )
        .toContain("EF 5.1 Advisor Quality Assurance")
      await pwExpect(
        await MergePositions.getLeftPositionField()
      ).not.toBeEnabled()
      await ShowPosition.logout()
    })
  })
  test.describe("When on the show page of a position with attachment(s)", () => {
    test("We should see a container for Attachment List", async () => {
      await ShowPosition.openAsAdminUser(POSITION_WITH_ATTACHMENTS_UUID)
      await waitFor(await ShowPosition.getAttachments(), "attached")
      await waitFor(await ShowPosition.getAttachments(), "visible")
    })
    test("We should see a card of Attachment", async () => {
      await waitFor(await ShowPosition.getCard(), "attached")
      await waitFor(await ShowPosition.getCard(), "visible")
      await pwExpect
        .poll(async () => await ShowPosition.getClassificationLine())
        .toEqual("[Public]")
      await pwExpect
        .poll(async () => await ShowPosition.getCaptionLine())
        .toEqual("EF 1.1 Advisor G")
    })
    test("We should be able to edit the attachments", async () => {
      const editAttachmentsButton =
        await ShowPosition.getEditAttachmentsButton()
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
        .toContain("/attachments/1d234036-1d6c-4cb0-8b1a-e4305aeca1e2/edit")
      await editAttachmentsButton.click()
    })
    test("We can go to the show page of Attachment", async () => {
      await (await ShowPosition.getImageClick()).click()
      await pwExpect
        .poll(async () => await currentPage().url())
        .toContain("/attachments/1d234036-1d6c-4cb0-8b1a-e4305aeca1e2")
    })
  })
  test.describe("When on the show page of a position with entity avatar", () => {
    test("We should see the avatar", async () => {
      await ShowPosition.openAsAdminUser(POSITION_WITH_ATTACHMENTS_UUID)
      await waitFor(await ShowPosition.getEntityAvatar(), "attached")
      await waitFor(await ShowPosition.getEntityAvatar(), "visible")
    })
  })
})
