import CreatePerson from '../pages/createNewPerson.page'
import { expect } from 'chai'

describe('Create a new user form page', () => {

    before('On the create a new user page...', () => {
        CreatePerson.open()
    })

    it('A demo user is logged in"', () => {
      CreatePerson.submit({firstName: 'hi', lastName: 'you'})
      expect(CreatePerson.alert.to.equal('Person saved succesfully'))
    })

})
