class Page {
  static DEFAULT_CREDENTIALS = {
    user: "erin",
    superUser: "rebecca",
    adminUser: "arthur",
    onboardUser: "bonny",
    noPositionUser: "nopos"
  }

  getLoginForm() {
    return browser.$("#kc-form-login")
  }

  getLoginFormUsername() {
    return browser.$("#username")
  }

  getLoginFormPassword() {
    return browser.$("#password")
  }

  getLoginFormSubmitButton() {
    return browser.$("#kc-login")
  }

  getLogo() {
    return browser.$("#topbar .logo")
  }

  loginFormSubmit() {
    this.getLoginFormSubmitButton().click()
  }

  waitForLoginForm() {
    this.getLoginForm().waitForExist()
    this.getLoginForm().waitForDisplayed()
  }

  login(credentials) {
    this.waitForLoginForm()
    this.getLoginFormUsername().setValue(credentials)
    this.getLoginFormPassword().setValue(credentials)
    this.loginFormSubmit()
  }

  logout(resetRedux = false) {
    // Reset redux state before logout
    if (resetRedux) {
      this.getLogo().click()
      browser.pause(1000)
    }
    browser.url("/api/logout")
  }

  waitUntilLoaded() {
    browser.$("div.loader").waitForExist({
      timeout: 30000,
      reverse: true,
      timeoutMsg: "Expected everything to be loaded by now"
    })
  }

  _open(pathName, credentials) {
    browser.url(pathName)
    if (this.getLoginForm().isExisting()) {
      this.login(credentials)
    }
    this.waitUntilLoaded()
  }

  openWithoutWaiting(
    pathName = "/",
    credentials = Page.DEFAULT_CREDENTIALS.user
  ) {
    browser.url(pathName)
    if (this.getLoginForm().isExisting()) {
      this.login(credentials)
    }
  }

  open(pathName = "/", credentials = Page.DEFAULT_CREDENTIALS.user) {
    this._open(pathName, credentials)
  }

  openAsSuperUser(pathName = "/") {
    this._open(pathName, Page.DEFAULT_CREDENTIALS.superUser)
  }

  openAsAdminUser(pathName = "/") {
    this._open(pathName, Page.DEFAULT_CREDENTIALS.adminUser)
  }

  openAsPositionlessUser(pathName = "/") {
    this._open(pathName, Page.DEFAULT_CREDENTIALS.noPositionUser)
  }

  openAsOnboardUser(
    pathName = "/",
    uniqueName = Page.DEFAULT_CREDENTIALS.onboardUser
  ) {
    this._open(pathName, uniqueName)
  }

  getAlertSuccess() {
    return browser.$(".alert-success")
  }

  waitForAlertSuccessToLoad() {
    if (!this.getAlertSuccess().isDisplayed()) {
      this.getAlertSuccess().waitForExist()
      this.getAlertSuccess().waitForDisplayed()
    }
  }

  getAlertWarning() {
    return browser.$(".alert-warning")
  }

  waitForAlertWarningToLoad() {
    if (!this.getAlertWarning().isDisplayed()) {
      this.getAlertWarning().waitForExist()
      this.getAlertWarning().waitForDisplayed()
    }
  }

  getRandomOption(select) {
    const options = select.$$("option")
    // Ignore the first option, it is always the empty one
    const index = 1 + Math.floor(Math.random() * (options.length - 1))
    return options[index].getValue()
  }

  deleteText(text = "") {
    // Clumsy way to clear text…
    browser.keys(["End"].concat(Array(text.length).fill("Backspace")))
  }

  deleteInput(inputField) {
    // Clumsy way to clear input…
    if (inputField && inputField.isDisplayed()) {
      inputField.click()
      this.deleteText(inputField.getValue())
    }
  }
}

export default Page
