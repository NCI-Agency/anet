import Page from './page'

const Page_URL = '/rollup'

class Rollup extends Page {
	get printButton() { return browser.element('a.btn.btn-default') }

	open() {
		super.open(Page_URL)
	}
}

export default new Rollup()
