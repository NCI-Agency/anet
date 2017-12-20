import React, {PropTypes} from 'react'
import Page from 'components/Page'
import moment from 'moment'

import PersonForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'
import NavigationWarning from 'components/NavigationWarning'

import API from 'api'
import {Person} from 'models'

export default class PersonEdit extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	static pageProps = {
		useNavigation: false
	}

	static modelName = 'User'

	constructor(props) {
		super(props)

		this.state = {
			person: new Person(),
		}
	}

	fetchData(props) {
		API.query(/*GraphQL*/ `
			person(id:${props.params.id}) {
				id,
				name, rank, role, emailAddress, phoneNumber, status, domainUsername,
				biography, country, gender, endOfTourDate,
				position {
					id, name
				}
			}
		`).then(data => {
			if (data.person.endOfTourDate) {
				data.person.endOfTourDate = moment(data.person.endOfTourDate).format()
			}
			this.setState({person: new Person(data.person), originalPerson: new Person(data.person)})
		})
	}

	render() {
		let {person, originalPerson} = this.state

		let currentUser = this.context.currentUser
		let canEditPosition = currentUser && currentUser.isSuperUser()

		const legendText = person.isNewUser() ? 'Create your account' : `Edit ${person.name}`
		const saveText = person.isNewUser() ? 'Create profile' : null

		return (
			<div>
				{!person.isNewUser() &&
					<Breadcrumbs items={[[`Edit ${person.name}`, Person.pathForEdit(person)]]} />
				}

				<NavigationWarning original={originalPerson} current={person} />
				<PersonForm person={person} edit showPositionAssignment={canEditPosition}
					legendText={legendText} saveText={saveText} />
			</div>
		)
	}
}
