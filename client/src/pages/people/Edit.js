import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import moment from 'moment'

import PersonForm from './Form'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import API from 'api'
import {Person} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PersonEdit extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	static modelName = 'User'

	state = {
		person: new Person(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	fetchData(props) {
		return API.query(/*GraphQL*/ `
			person(uuid:"${props.match.params.uuid}") {
				uuid,
				name, rank, role, emailAddress, phoneNumber, status, domainUsername,
				biography, country, gender, endOfTourDate,
				position {
					uuid, name, type
				}
				${GRAPHQL_NOTES_FIELDS}
			}
		`).then(data => {
			if (data.person.endOfTourDate) {
				data.person.endOfTourDate = moment(data.person.endOfTourDate).format()
			}
			const parsedFullName = Person.parseFullName(data.person.name)
			data.person.firstName = parsedFullName.firstName
			data.person.lastName = parsedFullName.lastName
			this.setState({ person: new Person(data.person) })
		})
	}

	render() {
		const { person } = this.state
		const legendText = person.isNewUser() ? 'Create your account' : `Edit ${person.name}`
		const saveText = person.isNewUser() ? 'Create profile' : 'Save Person'
		return (
			<div>
				<RelatedObjectNotes notes={person.notes} relatedObject={person.uuid && {relatedObjectType: 'people', relatedObjectUuid: person.uuid}} />
				<PersonForm
					initialValues={person}
					edit
					title={legendText}
					saveText={saveText} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(PersonEdit)
