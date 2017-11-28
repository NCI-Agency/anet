const DEFAULT_CREDENTIALS = { user: 'erin', superUser: 'arthur' }

class Page {
	get topbar()  { return browser.element('#topbar') }
    get securityBanner()  { return browser.element('#topbar .banner') }
    get searchBar()  { return browser.element('#searchBarInput') }
	get submitSearch()  { return browser.element('#topbar #searchBarSubmit') }

	open(pathName = '/', credentials = DEFAULT_CREDENTIALS.user) {
		const urlToGet = `${browser.options.baseUrl}${pathName}?user=${credentials}&pass=${credentials}`
		browser.url(urlToGet)
	}

	openAsSuperUser(pathName) {
		this.open(pathName, DEFAULT_CREDENTIALS.superUser)
	}
}

export default Page
