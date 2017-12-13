import Page from './page'

class Home extends Page {
    get topbar() { return browser.element('#topbar') }
    get securityBanner() { return browser.element('#topbar .banner') }
    get searchBar() { return browser.element('#searchBarInput') }
    get submitSearch() { return browser.element('#topbar #searchBarSubmit') }

    waitForSecurityBannerValue(value) {
        this.securityBanner.waitForExist()
		this.securityBanner.waitForVisible()
        return browser.waitUntil( () => {
            return this.securityBanner.getText() ===  value
          }, 5000, 'Expected different banner text after 5s')
    }
}

export default new Home()
