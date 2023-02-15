class Page {
  static DEFAULT_CREDENTIALS = {
    user: "erin",
    superUser: "rebecca",
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

  async getLogo() {
    return browser.$("#topbar .logo")
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
    if (await (await this.getLoginForm()).isExisting()) {
      await this.login(credentials)
    }
  }

  async open(pathName = "/", credentials = Page.DEFAULT_CREDENTIALS.user) {
    await this._open(pathName, credentials)
  }

  async openAsSuperUser(pathName = "/") {
    await this._open(pathName, Page.DEFAULT_CREDENTIALS.superUser)
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

  async getAlertWarning() {
    return browser.$(".alert-warning")
  }

  async waitForAlertWarningToLoad() {
    if (!(await (await this.getAlertWarning()).isDisplayed())) {
      await (await this.getAlertWarning()).waitForExist()
      await (await this.getAlertWarning()).waitForDisplayed()
    }
  }

  async getRandomOption(select) {
    const options = await select.$$("option")
    // Ignore the first option, it is always the empty one
    const index = 1 + Math.floor(Math.random() * (options.length - 1))
    return options[index].getValue()
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
}

export default Page
