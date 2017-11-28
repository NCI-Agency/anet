import { expect } from 'chai'

describe('Anet home page', function() {
    it('should have the right title', function () {
        browser.url('/')
        var title = browser.getTitle()
        expect(title).to.equal('ANET')
    })
})
