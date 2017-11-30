import Page from './page'

class Home extends Page {
    get topbar() { return browser.element('#topbar') }
    get securityBanner() { return browser.element('#topbar .banner') }
    get searchBar() { return browser.element('#searchBarInput') }
    get submitSearch() { return browser.element('#topbar #searchBarSubmit') }
}

export default new Home()
