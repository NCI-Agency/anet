import Page from './page'

const Page_URL = '/rollup'
const DEFAULT_CREDENTIALS = { login: 'erin:erin' }

class Rollup extends Page {
	get printButton() { return browser.element('a.btn.btn-default') }

	open() {
		super.open(Page_URL)
	}

	openAPI(url) {
		const loginUrl = url.replace(/localhost:3000/i, `${DEFAULT_CREDENTIALS.login}@localhost:8080`)
		browser.url(loginUrl)
	}
}

export default new Rollup()
