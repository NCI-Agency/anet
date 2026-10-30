import { expect, test } from "@playwright/test"
import MergePeoplePageObject from "../pages/mergePeople.page.js"
import ShowPersonPageObject from "../pages/showPerson.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, MergePeople, ShowPerson
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    MergePeople = new MergePeoplePageObject(page)
    ShowPerson = new ShowPersonPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const PERSON_UUID = "df9c7381-56ac-4bc5-8e24-ec524bccd7e9"
  const PERSON_WITH_AG_UUID = "31cba227-f6c6-49e9-9483-fce441bea624" // CIV Creed Bratton

  test.describe("Show person page", () => {
    test.describe("When on the show page of a person with communities", () => {
      test("We should see a table with communities", async () => {
        await ShowPerson.open(PERSON_WITH_AG_UUID)
        await (
          await ShowPerson.getAuthorizationGroupsTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(
          await ShowPerson.getAuthorizationGroupsTable()
        ).toContainText("EF 5", {
          useInnerText: true
        })
      })
      test("We can go to the show page of a community", async () => {
        await (await ShowPerson.getAuthorizationGroup(1)).click()
        await expect(page).toHaveURL(
          /\/communities\/ab1a7d99-4529-44b1-a118-bdee3ca8296b/
        )
      })
    })
    test.describe("When on the show page of a person with attachment(s)", () => {
      test("We should see a container for Attachment List", async () => {
        await ShowPerson.open(PERSON_UUID)
        await (
          await ShowPerson.getAttachments()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
      })
      test("We should see a card of Attachment", async () => {
        await (
          await ShowPerson.getCard()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(await ShowPerson.getClassificationLine()).toHaveText(
          "[Public]",
          {
            useInnerText: true
          }
        )
        await expect(await ShowPerson.getCaptionLine()).toHaveText("Erin", {
          useInnerText: true
        })
      })
      test("We should be able to edit the attachments", async () => {
        const editAttachmentsButton =
          await ShowPerson.getEditAttachmentsButton()
        await expect(editAttachmentsButton).toHaveText("Edit attachments", {
          useInnerText: true
        })
        await editAttachmentsButton.click()
        await expect(editAttachmentsButton).toHaveText("View attachments", {
          useInnerText: true
        })
        const editButton = await page
          .locator(".attachment-card .button-line a")
          .first()
        await expect(editButton).toHaveAttribute(
          "href",
          /\/attachments\/13318e42-a0a3-438f-8ed5-dc16b1ef17bc\/edit/
        )
        await editAttachmentsButton.click()
      })
      test("We can go to the show page of Attachment", async () => {
        await (await ShowPerson.getImageClick()).click()
        await expect(page).toHaveURL(
          /\/attachments\/13318e42-a0a3-438f-8ed5-dc16b1ef17bc/
        )
        await ShowPerson.logout()
      })
    })
    test.describe("When on the show page of a person as admin", () => {
      test("We can select to merge them with another person", async () => {
        await ShowPerson.openAsAdminUser(PERSON_WITH_AG_UUID)
        await (await ShowPerson.getMergeButton()).click()
        // wait for the merge page to render and load data
        await expect(await MergePeople.getTitle()).toBeVisible()
        await expect(await MergePeople.getLeftPersonField()).toHaveValue(
          /Creed Bratton/
        )
        await expect(await MergePeople.getLeftPersonField()).not.toBeEnabled()
      })
    })
    test.describe("When on the show page of a person with additional positions", () => {
      test("We should see a table with additional positions", async () => {
        await ShowPerson.open(PERSON_WITH_AG_UUID)
        await (
          await ShowPerson.getAdditionalPositionsTable()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        await expect(
          await ShowPerson.getAdditionalPositionsTable()
        ).toContainText("EF 1.1 Advisor for Interagency Advising", {
          useInnerText: true
        })
        await expect(
          await ShowPerson.getAdditionalPositionsTable()
        ).toContainText("EF 1.1 Advisor for Space Issues", {
          useInnerText: true
        })
      })
    })
  })
})
