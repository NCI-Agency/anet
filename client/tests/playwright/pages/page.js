import { expect } from "@playwright/test"
import { currentPage, typeKeys, waitFor, waitUntil } from "../support.js"

class Page {
  static DEFAULT_CREDENTIALS = {
    user: "erin",
    superuser: "rebecca",
    adminUser: "arthur",
    onboardUser: "bonny",
    noPositionUser: "nopos"
  }

  async getLoginForm() {
    return currentPage().locator("#kc-form-login").first()
  }

  async getLoginFormUsername() {
    return currentPage().locator("#username").first()
  }

  async getLoginFormPassword() {
    return currentPage().locator("#password").first()
  }

  async getLoginFormSubmitButton() {
    return currentPage().locator("#kc-login").first()
  }

  async getLogoutFormSubmitButton() {
    return currentPage().locator("#kc-logout").first()
  }

  async getLoggedOutForm() {
    return currentPage().locator(".logout-container").first()
  }

  async getLogo() {
    return currentPage().locator("#anet-logo .logo").first()
  }

  async clickLogo() {
    await (await this.getLogo()).click()
  }

  async getAttachments() {
    return currentPage().locator("#attachments").first()
  }

  async getCard() {
    return currentPage().locator(".card").first()
  }

  async getClassificationLine() {
    return currentPage().locator(".classification-line").first()
  }

  async getCaptionLine() {
    return currentPage().locator(".info-line").first()
  }

  async getImageClick() {
    return currentPage().locator(".image-preview").first()
  }

  async getModalDialog() {
    return currentPage().locator(".modal-dialog").first()
  }

  async loginFormSubmit() {
    await (await this.getLoginFormSubmitButton()).click()
  }

  async waitForLoginForm() {
    await expect(await this.getLoginForm()).toBeVisible()
  }

  async login(credentials) {
    await this.waitForLoginForm()
    await (await this.getLoginFormUsername()).fill(String(credentials))
    await (await this.getLoginFormPassword()).fill(String(credentials))
    await this.loginFormSubmit()
    await currentPage().waitForURL(url => !url.pathname.includes("/realms/"))
  }

  async logout(resetRedux = false) {
    // Reset redux state before logout
    if (resetRedux) {
      await this.clickLogo()
    }
    await currentPage().goto("/api/logout")
    await (await this.getLogoutFormSubmitButton()).click()
    await expect(await this.getLoggedOutForm()).toBeVisible()
  }

  async waitUntilLoaded() {
    await waitFor(
      await currentPage().locator("div.loader").first(),
      "attached",
      {
        timeout: 30000,
        reverse: true,
        timeoutMsg: "Expected everything to be loaded by now"
      }
    )
  }

  async _open(pathName, credentials) {
    await currentPage().goto(pathName)
    // Wait for page load or login redirect

    if ((await (await this.getLoginForm()).count()) > 0) {
      await this.login(credentials)
      // Wait for login redirect
    }
    await waitFor(currentPage().locator("#topbar"), "visible", {
      timeout: 30000
    })
    await this.waitUntilLoaded()
  }

  async open(pathName = "/", credentials = Page.DEFAULT_CREDENTIALS.user) {
    await this._open(pathName, credentials)
  }

  async openAsSuperuser(pathName = "/") {
    await this._open(pathName, Page.DEFAULT_CREDENTIALS.superuser)
  }

  async openAsAdminUser(pathName = "/") {
    await this._open(pathName, Page.DEFAULT_CREDENTIALS.adminUser)
  }

  async openAsPositionlessUser(pathName = "/") {
    await this._open(pathName, Page.DEFAULT_CREDENTIALS.noPositionUser)
  }

  async openAsOnboardUser(
    pathName = "/",
    uniqueName = Page.DEFAULT_CREDENTIALS.onboardUser
  ) {
    await this._open(pathName, uniqueName)
  }

  async getNotFound() {
    return currentPage().locator(".not-found-text").first()
  }

  async getAlertSuccess() {
    return currentPage().locator(".alert-success").first()
  }

  async waitForAlertSuccessToLoad() {
    await expect(await this.getAlertSuccess()).toBeVisible()
  }

  async getAlertInfo() {
    return currentPage().locator(".alert-info").first()
  }

  async waitForAlertInfoToLoad() {
    await expect(await this.getAlertInfo()).toBeVisible()
  }

  async getAlertWarning() {
    return currentPage().locator(".alert-warning").first()
  }

  async waitForAlertWarningToLoad() {
    await expect(await this.getAlertWarning()).toBeVisible()
  }

  async getAlertDanger() {
    return currentPage().locator(".alert-danger").first()
  }

  async waitForAlertDangerToLoad() {
    await expect(await this.getAlertDanger()).toBeVisible()
  }

  async getRandomOption(select) {
    const options = await select.locator("option").all()
    // Ignore the first option, it is always the empty one
    const index = 1 + Math.floor(Math.random() * (options.length - 1))
    return options[index].getAttribute("value")
  }

  async saveAssessmentAndWaitForModalClose(
    saveButton,
    getModalForm,
    getAssessmentDetails,
    detailIndex,
    detailToWaitFor
  ) {
    await saveButton.click()
    // wait for modal animation to finish

    await waitFor(await getModalForm(), "attached", {
      reverse: true,
      timeout: 20000
    })
    // wait until details to change, can take some time to update show page
    await waitUntil(
      async () => {
        const details = await getAssessmentDetails()
        if (!details[detailIndex]) {
          return false
        }
        return (
          (await details[detailIndex].innerText()).trim() === detailToWaitFor
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Expected change after save"
      }
    )
  }

  async clickButton(buttonContainer, buttonSelector) {
    await (
      await (await buttonContainer).locator(buttonSelector).first()
    ).click({
      position: {
        x: 10,
        y: 10
      }
    })
  }

  async fillRichTextInput(editorContainer, editorSelector, editorValue) {
    const editor = editorContainer.locator(editorSelector).first()
    await editor.fill(String(editorValue))
    await editor.blur()
  }

  async deleteText(text = "") {
    // Clumsy way to clear text…
    await typeKeys(["End"].concat(Array(text.length).fill("Backspace")))
  }

  async deleteInput(inputField) {
    const input = await inputField
    if (await input?.isVisible()) {
      await input.fill("")
    }
  }

  async getMergeButton() {
    return currentPage().locator('a[id="mergeWithOther"]').first()
  }

  async waitForElementToChange(getElementCallback, value) {
    await expect(await getElementCallback()).toHaveText(value, {
      useInnerText: true,
      timeout: 10000
    })
  }

  async waitForElementToContain(getElementCallback, value) {
    await expect(await getElementCallback()).toContainText(value, {
      useInnerText: true,
      timeout: 10000
    })
  }

  async getOwnerOrganizationInput() {
    return currentPage().locator("#ownerOrg").first()
  }

  async getOwnerOrgAdvancedSelectFirstItem() {
    return currentPage()
      .locator("#ownerOrg-popover tbody tr:first-child td:nth-child(2) span")
      .first()
  }

  async getAdminOrganizationInput() {
    return currentPage().locator("#adminOrg").first()
  }

  async getAdminOrgAdvancedSelectFirstItem() {
    return currentPage()
      .locator("#adminOrg-popover tbody tr:first-child td:nth-child(2) span")
      .first()
  }

  async waitForOwnerOrgAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getOwnerOrgAdvancedSelectFirstItem,
      value
    )
  }

  async waitForAdminOrgAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getAdminOrgAdvancedSelectFirstItem,
      value
    )
  }

  async getRelatedObjectsAdvancedSelectFirstItem() {
    return currentPage()
      .locator(
        "#entitySelect-popover tbody tr:first-child td:nth-child(2) span"
      )
      .first()
  }

  async waitForRelatedObjectsAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getRelatedObjectsAdvancedSelectFirstItem,
      value
    )
  }

  async getMemberTypeButton(memberType) {
    return currentPage()
      .getByRole("button", {
        name: `${memberType}`,
        exact: true
      })
      .first()
  }

  async getHostRelatedObjectsInput() {
    return currentPage().locator("#hostRelatedObjects").first()
  }

  async getRelatedObjectsTable() {
    return currentPage().locator(".related_objects_table").first()
  }

  async getRelatedObjectsTableEntry(relatedObjectText) {
    return (await this.getRelatedObjectsTable())
      .locator(`xpath=.//tr/td/span//a[text()="${relatedObjectText}"]`)
      .first()
  }
}

export default Page
