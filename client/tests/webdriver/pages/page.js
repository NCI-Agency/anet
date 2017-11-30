const DEFAULT_CREDENTIALS = { user: 'erin', superUser: 'arthur' }

class Page {
	open(pathName = '/', credentials = DEFAULT_CREDENTIALS.user) {
		const urlToGet = `${browser.options.baseUrl}${pathName}?user=${credentials}&pass=${credentials}`
		browser.url(urlToGet)
	}

	openAsSuperUser(pathName = '/') {
		const credentials = 'arthur'
		const urlToGet = `${browser.options.baseUrl}${pathName}?user=${credentials}&pass=${credentials}`
		browser.url(urlToGet)
	}
}

export default Page
