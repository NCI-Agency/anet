import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps} from 'components/Page'
import moment from 'moment'

import PersonForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import API from 'api'
import {Person} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PersonEdit extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	static modelName = 'User'

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			person: new Person(),
		}
	}

	fetchData(props) {
		API.query(/*GraphQL*/ `
			person(uuid:"${props.match.params.uuid}") {
				uuid,
				name, rank, role, emailAddress, phoneNumber, status, domainUsername,
				biography, country, gender, endOfTourDate,
				position {
					uuid, name
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

				<PersonForm original={originalPerson} person={person} edit showPositionAssignment={canEditPosition}
					legendText={legendText} saveText={saveText} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(PersonEdit)
