import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import PersonForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import {Person} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PersonNew extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			originalPerson: new Person(),
			person: new Person(),
		}
	}

	render() {
		let person = this.state.person

		return (
			<div>
				<Breadcrumbs items={[['Create new Person', Person.pathForNew()]]} />
				<PersonForm
					original={this.state.originalPerson}
					person={person} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(PersonNew)
