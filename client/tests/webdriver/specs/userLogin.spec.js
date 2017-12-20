import Home from '../pages/home.page'
import { expect } from 'chai'

describe('Anet user login', () => {
	it('Default user is logged in"', () => {
		Home.open()
		Home.securityBanner.waitForExist()
		Home.securityBanner.waitForVisible()
		const securityText = Home.securityBanner.getText()
		expect(securityText).to.equal('DEMO USE ONLY || ERINSON, Erin (edit)')
	})

	it('Super user is logged in"', () => {
		Home.openAsSuperUser()
		Home.securityBanner.waitForExist()
		Home.securityBanner.waitForVisible()
		const securityText = Home.securityBanner.getText()
		expect(securityText).to.equal('DEMO USE ONLY || DMIN, Arthur (edit)')
	})
})
