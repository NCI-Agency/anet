class Page {
  static DEFAULT_CREDENTIALS = {
    user: "erin",
    superUser: "rebecca",
    adminUser: "arthur",
    onboardUser: "bonny",
    noPositionUser: "nopos"
  }

  _buildUrl(pathName, credentials) {
    const credSep = pathName.includes("?") ? "&" : "?"
    const baseUrl = browser.options.baseUrl
    const url = pathName.startsWith(baseUrl)
      ? pathName
      : `${baseUrl}${pathName}`
    return `${url}${credSep}user=${credentials}&pass=${credentials}`
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

  openAsPositionlessUser(pathName = "/") {
    this._open(pathName, Page.DEFAULT_CREDENTIALS.noPositionUser)
  }

  openAsOnboardUser(
    pathName = "/",
    uniqueName = Page.DEFAULT_CREDENTIALS.onboardUser
  ) {
    this._open(pathName, uniqueName)
  }

  getRandomOption(select) {
    const options = select.$$("option")
    // Ignore the first option, it is always the empty one
    const index = 1 + Math.floor(Math.random() * (options.length - 1))
    return options[index].getValue()
  }
}

export default Page
