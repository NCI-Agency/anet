class Page {
  static DEFAULT_CREDENTIALS = {
    user: "erin",
    superuser: "rebecca",
    adminUser: "arthur",
    onboardUser: "bonny",
    noPositionUser: "nopos"
  }

  async getLoginForm() {
    return browser.$("#kc-form-login")
  }

  async getLoginFormUsername() {
    return browser.$("#username")
  }

  async getLoginFormPassword() {
    return browser.$("#password")
  }

  async getLoginFormSubmitButton() {
    return browser.$("#kc-login")
  }

  async getLogoutFormSubmitButton() {
    return browser.$("#kc-logout")
  }

  async getLogo() {
    return browser.$("#topbar .logo")
  }

  async getAttachments() {
    return browser.$("#attachments")
  }

  async getCard() {
    return browser.$(".card")
  }

  async getCaption() {
    return (await browser.$(".info-line")).getText()
  }

  async getImageClick() {
    return browser.$(".image-preview")
  }

  async loginFormSubmit() {
    await (await this.getLoginFormSubmitButton()).click()
  }

  async waitForLoginForm() {
    await (await this.getLoginForm()).waitForExist()
    await (await this.getLoginForm()).waitForDisplayed()
  }

  async login(credentials) {
    await this.waitForLoginForm()
    await (await this.getLoginFormUsername()).setValue(credentials)
    await (await this.getLoginFormPassword()).setValue(credentials)
    await this.loginFormSubmit()
  }

  async logout(resetRedux = false) {
    // Reset redux state before logout
    if (resetRedux) {
      await (await this.getLogo()).click()
      await browser.pause(1000)
    }
    await browser.url("/api/logout")
    await browser.pause(1000)
    await (await this.getLogoutFormSubmitButton()).click()
  }

  async waitUntilLoaded() {
    await (
      await browser.$("div.loader")
    ).waitForExist({
      timeout: 30000,
      reverse: true,
      timeoutMsg: "Expected everything to be loaded by now"
    })
  }

  async _open(pathName, credentials) {
    await browser.url(pathName)
    // Wait for page load or login redirect
    await browser.pause(1000)
    if (await (await this.getLoginForm()).isExisting()) {
      await this.login(credentials)
    }
    await this.waitUntilLoaded()
  }

  async openWithoutWaiting(
    pathName = "/",
    credentials = Page.DEFAULT_CREDENTIALS.user
  ) {
    await browser.url(pathName)
    // Wait for page load or login redirect
    await browser.pause(1000)
    if (await (await this.getLoginForm()).isExisting()) {
      await this.login(credentials)
    }
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

  async getAlertSuccess() {
    return browser.$(".alert-success")
  }

  async waitForAlertSuccessToLoad() {
    if (!(await (await this.getAlertSuccess()).isDisplayed())) {
      await (await this.getAlertSuccess()).waitForExist()
      await (await this.getAlertSuccess()).waitForDisplayed()
    }
  }

  async getAlertInfo() {
    return browser.$(".alert-info")
  }

  async waitForAlertInfoToLoad() {
    if (!(await (await this.getAlertInfo()).isDisplayed())) {
      await (await this.getAlertInfo()).waitForExist()
      await (await this.getAlertInfo()).waitForDisplayed()
    }
  }

  async getAlertWarning() {
    return browser.$(".alert-warning")
  }

  async waitForAlertWarningToLoad() {
    if (!(await (await this.getAlertWarning()).isDisplayed())) {
      await (await this.getAlertWarning()).waitForExist()
      await (await this.getAlertWarning()).waitForDisplayed()
    }
  }

  async getAlertDanger() {
    return browser.$(".alert-danger")
  }

  async waitForAlertDangerToLoad() {
    if (!(await (await this.getAlertDanger()).isDisplayed())) {
      await (await this.getAlertDanger()).waitForExist()
      await (await this.getAlertDanger()).waitForDisplayed()
    }
  }

  async getRandomOption(select) {
    const options = await select.$$("option")
    // Ignore the first option, it is always the empty one
    const index = 1 + Math.floor(Math.random() * (options.length - 1))
    return options[index].getValue()
  }

  async saveAssessmentAndWaitForModalClose(
    saveButton,
    getModalForm,
    getAssessmentDetails,
    detailIndex,
    detailToWaitFor
  ) {
    await saveButton.click()
    await browser.pause(300) // wait for modal animation to finish

    await (
      await getModalForm()
    ).waitForExist({
      reverse: true,
      timeout: 20000
    })
    // wait until details to change, can take some time to update show page
    await browser.waitUntil(
      async () => {
        return (
          (await (await getAssessmentDetails())[detailIndex].getText()) ===
          detailToWaitFor
        )
      },
      {
        timeout: 5000,
        timeoutMsg: "Expected change after save"
      }
    )
  }

  async clickButton(buttonContainer, buttonSelector) {
    const button = await buttonContainer.$(buttonSelector)
    // wait for a bit and click twice, sometimes it does not go through
    await browser.pause(300)
    await button.click({ x: 10, y: 10 })
    await button.click({ x: 10, y: 10 })
    await browser.pause(300)
  }

  async fillRichTextInput(
    editorContainer,
    editorSelector,
    editorValue,
    oldValue
  ) {
    await (await editorContainer.$(editorSelector)).click()
    // Wait for the editor to be focused
    await browser.pause(300)
    if (oldValue) {
      await this.deleteText(oldValue)
      // Wait for the previous value to be deleted
      await browser.pause(300)
    }
    await browser.keys(editorValue)
    // Wait for rich-text editor to update content
    await browser.pause(300)
  }

  async deleteText(text = "") {
    // Clumsy way to clear text…
    await browser.keys(["End"].concat(Array(text.length).fill("Backspace")))
  }

  async deleteInput(inputField) {
    // Clumsy way to clear input…
    if (await (await inputField)?.isDisplayed()) {
      await (await inputField).click()
      await this.deleteText(await (await inputField).getValue())
    }
  }

  async getMergeButton() {
    return browser.$('a[id="mergeWithOther"]')
  }
}

export default Page
