import { expect } from "chai"
import Home from "../pages/home.page"
import ShowPerson from "../pages/showPerson.page"

const ADMIN_PERSON_UUID = "b5d495af-44d5-4c35-851a-1039352a8307"
const ADMIN_LINK_ATTACHMENT_UUID = "13318e42-a0a3-438f-8ed5-dc16b1ef17bc"
const ADMIN_LINK_ATTACHMENT_CAPTION = "Erin"

const REGULAR_PERSON_UUID = "a9d65d96-d107-45c3-bbaa-1133a354335b"
const REGULAR_LINK_ATTACHMENT_UUID = "3187ad8a-6130-4ec0-bffc-9ebfad4dee39"
const REGULAR_USER_CREDENTIALS = "elizabeth"
const REGULAR_LINK_ATTACHMENT_CAPTION = "Michael"

describe("Linking attachments", () => {
  it("Admin can link and unlink an attachment", async () => {
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

  it("Regular user can link/unlink but cannot delete unowned attachment", async () => {
    await Home.open("/", REGULAR_USER_CREDENTIALS)
    await ShowPerson.open(REGULAR_PERSON_UUID)
    await ShowPerson.openAttachmentsEdit()
    await ShowPerson.ensureAttachmentUnlinked(REGULAR_LINK_ATTACHMENT_UUID)

    await ShowPerson.selectAttachmentToLink(REGULAR_LINK_ATTACHMENT_CAPTION)
    await ShowPerson.linkSelectedAttachments()
    await ShowPerson.waitForLinkToComplete()

    await ShowPerson.attemptDeleteAttachmentByUuid(REGULAR_LINK_ATTACHMENT_UUID)

    await browser.waitUntil(async () => {
      return ShowPerson.attachmentCardExistsByUuid(REGULAR_LINK_ATTACHMENT_UUID)
    })

    await ShowPerson.unlinkAttachmentByUuid(REGULAR_LINK_ATTACHMENT_UUID)
    await ShowPerson.waitForAttachmentToDisappear(REGULAR_LINK_ATTACHMENT_UUID)

    expect(
      await ShowPerson.attachmentCardExistsByUuid(REGULAR_LINK_ATTACHMENT_UUID)
    ).to.equal(false)

    await ShowPerson.logout()
  })
})
