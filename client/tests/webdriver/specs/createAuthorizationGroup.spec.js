import CreateAuthorizationGroup from '../pages/createAuthorizationGroup.page'
import { expect } from 'chai'

const POSITION_AUTOCOMPLETE = 'ANET'
const POSITION = 'ANET Administrator'

describe('Create authorization group form page', () => {

    beforeEach('On the create authorization group page...', () => {
        CreateAuthorizationGroup.open()
        CreateAuthorizationGroup.form.waitForExist()
        CreateAuthorizationGroup.form.waitForVisible()
    })

    describe('When creating an authorization group', () => {
        it('Should save an authorization group with only a name', () => {
            CreateAuthorizationGroup.name.setValue('authorization group 1')
            CreateAuthorizationGroup.description.setValue('this is just a test authorization group')
            CreateAuthorizationGroup.statusActiveButton.waitForVisible()
            expect(CreateAuthorizationGroup.statusActiveButton.getAttribute('class')).to.include('active')
            CreateAuthorizationGroup.statusInactiveButton.waitForVisible()
            expect(CreateAuthorizationGroup.statusInactiveButton.getAttribute('class')).to.not.include('active')
            CreateAuthorizationGroup.statusInactiveButton.click()
            expect(browser.isExisting('.positions_table')).to.equal(false)
            CreateAuthorizationGroup.positions.setValue(POSITION_AUTOCOMPLETE)
            CreateAuthorizationGroup.waitForPositionsAutoCompleteToChange(POSITION)
            expect(CreateAuthorizationGroup.positionsAutocomplete.getText()).to.include(POSITION)
            CreateAuthorizationGroup.positionsAutocomplete.click()
            // Autocomplete gets empty, the position is added to a table underneath
            expect(CreateAuthorizationGroup.positions.getValue()).to.equal('')
            // positions table exists now
            expect(browser.isExisting('.positions_table'))
            CreateAuthorizationGroup.submitForm()
            CreateAuthorizationGroup.waitForAlertSuccessToLoad()
            const alertMessage = CreateAuthorizationGroup.alertSuccess.getText()
            expect(alertMessage).to.equal('Saved authorization group')
        })
    })
})
