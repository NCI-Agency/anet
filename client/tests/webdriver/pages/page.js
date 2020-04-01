class Page {
  static DEFAULT_CREDENTIALS = {
    user: "erin",
    superUser: "rebecca",
    adminUser: "arthur",
    onboardUser: "bonny"
  }

  _buildUrl(pathName, credentials) {
    const credSep = pathName.includes("?") ? "&" : "?"
    return `${browser.options.baseUrl}${pathName}${credSep}user=${credentials}&pass=${credentials}`
  }

  _open(pathName, credentials) {
    browser.url(this._buildUrl(pathName, credentials))
    browser.$("div.loader").waitForExist({
      timeout: 30000,
      reverse: true,
      timeoutMsg: "Expected everything to be loaded by now"
    })
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

  openAsOnboardUser(pathName = "/") {
    this._open(pathName, Page.DEFAULT_CREDENTIALS.onboardUser)
  }

  getRandomOption(select) {
    const options = select.$$("option")
    // Ignore the first option, it is always the empty one
    const index = 1 + Math.floor(Math.random() * (options.length - 1))
    return options[index].getValue()
  }
}

export default Page
