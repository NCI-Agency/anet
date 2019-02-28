import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import PersonForm from './Form'

import {Person} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PersonNew extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	state = {
		person: new Person(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	render() {
		const {person} = this.state
		return (
			<PersonForm initialValues={person} title='Create a new Person' />
		)
	}
}

export default connect(null, mapDispatchToProps)(PersonNew)
