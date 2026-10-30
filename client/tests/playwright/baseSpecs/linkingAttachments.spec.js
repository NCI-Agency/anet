import { expect, test } from "@playwright/test"
import HomePageObject from "../pages/home.page.js"
import ShowPersonPageObject from "../pages/showPerson.page.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, Home, ShowPerson
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    Home = new HomePageObject(page)
    ShowPerson = new ShowPersonPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
  })
  const ADMIN_PERSON_UUID = "b5d495af-44d5-4c35-851a-1039352a8307"
  const ADMIN_LINK_ATTACHMENT_UUID = "13318e42-a0a3-438f-8ed5-dc16b1ef17bc"
  const ADMIN_LINK_ATTACHMENT_CAPTION = "Erin"
  const REGULAR_PERSON_UUID = "a9d65d96-d107-45c3-bbaa-1133a354335b"
  const REGULAR_LINK_ATTACHMENT_UUID = "3187ad8a-6130-4ec0-bffc-9ebfad4dee39"
  const REGULAR_USER_CREDENTIALS = "elizabeth"
  const REGULAR_LINK_ATTACHMENT_CAPTION = "Michael"
  test.describe("Linking attachments", () => {
    test("Admin can link and unlink an attachment", async () => {
      await ShowPerson.openAsAdminUser(ADMIN_PERSON_UUID)
      await ShowPerson.openAttachmentsEdit()
      await ShowPerson.ensureAttachmentUnlinked(ADMIN_LINK_ATTACHMENT_UUID)
      await ShowPerson.selectAttachmentToLink(ADMIN_LINK_ATTACHMENT_CAPTION)
      await ShowPerson.linkSelectedAttachments()
      await ShowPerson.waitForLinkToComplete()
      await ShowPerson.unlinkAttachmentByUuid(ADMIN_LINK_ATTACHMENT_UUID)
      await ShowPerson.waitForAttachmentToDisappear(ADMIN_LINK_ATTACHMENT_UUID)
      await ShowPerson.logout()
    })
    test("Regular user can link/unlink but cannot delete unowned attachment", async () => {
      await Home.open("/", REGULAR_USER_CREDENTIALS)
      await ShowPerson.open(REGULAR_PERSON_UUID)
      await ShowPerson.openAttachmentsEdit()
      await ShowPerson.ensureAttachmentUnlinked(REGULAR_LINK_ATTACHMENT_UUID)
      await ShowPerson.selectAttachmentToLink(REGULAR_LINK_ATTACHMENT_CAPTION)
      await ShowPerson.linkSelectedAttachments()
      await ShowPerson.waitForLinkToComplete()
      await ShowPerson.attemptDeleteAttachmentByUuid(
        REGULAR_LINK_ATTACHMENT_UUID
      )
      await expect
        .poll(
          async () => {
            return ShowPerson.attachmentCardExistsByUuid(
              REGULAR_LINK_ATTACHMENT_UUID
            )
          },
          {
            timeout: 10000
          }
        )
        .toBeTruthy()
      await ShowPerson.unlinkAttachmentByUuid(REGULAR_LINK_ATTACHMENT_UUID)
      await ShowPerson.waitForAttachmentToDisappear(
        REGULAR_LINK_ATTACHMENT_UUID
      )
      await expect
        .poll(
          async () =>
            await ShowPerson.attachmentCardExistsByUuid(
              REGULAR_LINK_ATTACHMENT_UUID
            )
        )
        .toEqual(false)
      await ShowPerson.logout()
    })
  })
})
