import React from 'react'
import Page from 'components/Page'

import PersonForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import {Person} from 'models'

export default class PersonNew extends Page {
	static pageProps = {
		useNavigation: false
	}

	constructor(props) {
		super(props)

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

				<PersonForm original={this.state.originalPerson} person={person} showPositionAssignment={true} />
			</div>
		)
	}
}
