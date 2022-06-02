class Page {
  static DEFAULT_CREDENTIALS = {
    user: "erin",
    superUser: "rebecca",
    adminUser: "arthur",
    onboardUser: "bonny",
    noPositionUser: "nopos"
  }

  get loginForm() {
    return browser.$("#kc-form-login")
  }

  get loginFormUsername() {
    return browser.$("#username")
  }

  get loginFormPassword() {
    return browser.$("#password")
  }

  get loginFormSubmitButton() {
    return browser.$("#kc-login")
  }

  loginFormSubmit() {
    this.loginFormSubmitButton.click()
  }

  get logoutLink() {
    return browser.$("=Logout")
  }

  waitForLoginForm() {
    this.loginForm.waitForExist()
    this.loginForm.waitForDisplayed()
  }

  login(credentials) {
    this.waitForLoginForm()
    this.loginFormUsername.setValue(credentials)
    this.loginFormPassword.setValue(credentials)
    this.loginFormSubmit()
  }

  logout() {
    this.logoutLink.waitForExist()
    this.logoutLink.waitForDisplayed()
    this.logoutLink.click()
    this.waitForLoginForm()
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
    if (this.loginForm.isExisting()) {
      this.login(credentials)
    }
    this.waitUntilLoaded()
  }

  openWithoutWaiting(
    pathName = "/",
    credentials = Page.DEFAULT_CREDENTIALS.user
  ) {
    browser.url(pathName)
    if (this.loginForm.isExisting()) {
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

  get alertSuccess() {
    return browser.$(".alert-success")
  }

  waitForAlertSuccessToLoad() {
    if (!this.alertSuccess.isDisplayed()) {
      this.alertSuccess.waitForExist()
      this.alertSuccess.waitForDisplayed()
    }
  }

  get alertWarning() {
    return browser.$(".alert-warning")
  }

  waitForAlertWarningToLoad() {
    if (!this.alertWarning.isDisplayed()) {
      this.alertWarning.waitForExist()
      this.alertWarning.waitForDisplayed()
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
