import { expect } from "@playwright/test"

class Page {
  /** @param {import("@playwright/test").Page} page */
  constructor(page) {
    this.page = page
  }

  static DEFAULT_CREDENTIALS = {
    user: "erin",
    superuser: "rebecca",
    adminUser: "arthur",
    onboardUser: "bonny",
    noPositionUser: "nopos"
  }

  async getLoginForm() {
    return this.page.locator("#kc-form-login").first()
  }

  async getLoginFormUsername() {
    return this.page.locator("#username").first()
  }

  async getLoginFormPassword() {
    return this.page.locator("#password").first()
  }

  async getLoginFormSubmitButton() {
    return this.page.locator("#kc-login").first()
  }

  async getLogoutFormSubmitButton() {
    return this.page.locator("#kc-logout").first()
  }

  async getLoggedOutForm() {
    return this.page.locator(".logout-container").first()
  }

  async getLogo() {
    return this.page.locator("#anet-logo .logo").first()
  }

  async clickLogo() {
    await (await this.getLogo()).click()
  }

  async getAttachments() {
    return this.page.locator("#attachments").first()
  }

  async getCard() {
    return this.page.locator(".card").first()
  }

  async getClassificationLine() {
    return this.page.locator(".classification-line").first()
  }

  async getCaptionLine() {
    return this.page.locator(".info-line").first()
  }

  async getImageClick() {
    return this.page.locator(".image-preview").first()
  }

  async getModalDialog() {
    return this.page.locator(".modal-dialog").first()
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
    await this.page.waitForURL(url => !url.pathname.includes("/realms/"))
  }

  async logout(resetRedux = false) {
    // Reset redux state before logout
    if (resetRedux) {
      await this.clickLogo()
    }
    await this.page.goto("/api/logout")
    await (await this.getLogoutFormSubmitButton()).click()
    await expect(await this.getLoggedOutForm()).toBeVisible()
  }

  async waitUntilLoaded() {
    await (
      await this.page.locator("div.loader").first()
    ).waitFor({
      state: "detached",
      timeout: 30000
    })
  }

  async _open(pathName, credentials) {
    await this.page.goto(pathName)
    // Wait for page load or login redirect

    if ((await (await this.getLoginForm()).count()) > 0) {
      await this.login(credentials)
      // Wait for login redirect
    }
    await this.page.locator("#topbar").waitFor({
      state: "visible",
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
    return this.page.locator(".not-found-text").first()
  }

  async getAlertSuccess() {
    return this.page.locator(".alert-success").first()
  }

  async waitForAlertSuccessToLoad() {
    await expect(await this.getAlertSuccess()).toBeVisible()
  }

  async getAlertInfo() {
    return this.page.locator(".alert-info").first()
  }

  async waitForAlertInfoToLoad() {
    await expect(await this.getAlertInfo()).toBeVisible()
  }

  async getAlertWarning() {
    return this.page.locator(".alert-warning").first()
  }

  async waitForAlertWarningToLoad() {
    await expect(await this.getAlertWarning()).toBeVisible()
  }

  async getAlertDanger() {
    return this.page.locator(".alert-danger").first()
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

    await (
      await getModalForm()
    ).waitFor({
      state: "detached",
      timeout: 20000
    })
    // wait until details to change, can take some time to update show page
    await expect
      .poll(
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
          message: "Expected change after save"
        }
      )
      .toBeTruthy()
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
    for (const key of ["End"].concat(Array(text.length).fill("Backspace"))) {
      await this.page.keyboard.press(key)
    }
  }

  async deleteInput(inputField) {
    const input = await inputField
    if (await input?.isVisible()) {
      await input.fill("")
    }
  }

  async getMergeButton() {
    return this.page.locator('a[id="mergeWithOther"]').first()
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
    return this.page.locator("#ownerOrg").first()
  }

  async getOwnerOrgAdvancedSelectFirstItem() {
    return this.page
      .locator("#ownerOrg-popover tbody tr:first-child td:nth-child(2) span")
      .first()
  }

  async getAdminOrganizationInput() {
    return this.page.locator("#adminOrg").first()
  }

  async getAdminOrgAdvancedSelectFirstItem() {
    return this.page
      .locator("#adminOrg-popover tbody tr:first-child td:nth-child(2) span")
      .first()
  }

  async waitForOwnerOrgAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getOwnerOrgAdvancedSelectFirstItem.bind(this),
      value
    )
  }

  async waitForAdminOrgAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getAdminOrgAdvancedSelectFirstItem.bind(this),
      value
    )
  }

  async getRelatedObjectsAdvancedSelectFirstItem() {
    return this.page
      .locator(
        "#entitySelect-popover tbody tr:first-child td:nth-child(2) span"
      )
      .first()
  }

  async waitForRelatedObjectsAdvancedSelectToChange(value) {
    return this.waitForElementToChange(
      this.getRelatedObjectsAdvancedSelectFirstItem.bind(this),
      value
    )
  }

  async getMemberTypeButton(memberType) {
    return this.page
      .getByRole("button", {
        name: `${memberType}`,
        exact: true
      })
      .first()
  }

  async selectHostType(memberType) {
    await (await this.getMemberTypeButton(memberType)).click()
    // Switching host types closes the overlay; reopen it before searching.
    await (await this.getHostRelatedObjectsInput()).click()
    await expect(this.page.locator("#entitySelect-popover")).toBeVisible()
  }

  async getHostRelatedObjectsInput() {
    return this.page.locator("#hostRelatedObjects").first()
  }

  async getRelatedObjectsTable() {
    return this.page.locator(".related_objects_table").first()
  }

  async getRelatedObjectsTableEntry(relatedObjectText) {
    return (await this.getRelatedObjectsTable())
      .locator(`xpath=.//tr/td/span//a[text()="${relatedObjectText}"]`)
      .first()
  }
}
export default Page
