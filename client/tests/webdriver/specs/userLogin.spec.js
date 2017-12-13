import Home from '../pages/home.page'
import { expect } from 'chai'

describe('Anet default user login', () => {
	it('Default user is logged in"', () => {
		Home.open()
		const defaultUserValue = 'DEMO USE ONLY || ERINSON, Erin (edit)'
		Home.waitForSecurityBannerValue(defaultUserValue)

		const securityText = Home.securityBanner.getText()
		expect(securityText).to.equal(defaultUserValue)
	})
})

describe('Anet super user login', () => {
	it('Super user is logged in"', () => {
		Home.openAsSuperUser()
		const superUserValue = 'DEMO USE ONLY || DMIN, Arthur (edit)'
		Home.waitForSecurityBannerValue(superUserValue)

		const securityText = Home.securityBanner.getText()
		expect(securityText).to.equal(superUserValue)
	})
})
