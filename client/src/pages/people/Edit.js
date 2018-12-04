import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import moment from 'moment'

import PersonForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import API from 'api'
import {Person} from 'models'

import AppContext from 'components/AppContext'
import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class BasePersonEdit extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	static modelName = 'User'

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
		this.state = {
			person: new Person(),
		}
	}

	fetchData(props) {
		return API.query(/*GraphQL*/ `
			person(uuid:"${props.match.params.uuid}") {
				uuid,
				name, rank, role, emailAddress, phoneNumber, status, domainUsername,
				biography, country, gender, endOfTourDate,
				position {
					uuid, name
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
		const { currentUser } = this.props
		let canEditPosition = currentUser && currentUser.isSuperUser()

		const legendText = person.isNewUser() ? 'Create your account' : `Edit ${person.name}`
		const saveText = person.isNewUser() ? 'Create profile' : 'Save Person'
		return (
			<div>
				<RelatedObjectNotes notes={person.notes} relatedObject={person.uuid && {relatedObjectType: 'people', relatedObjectUuid: person.uuid}} />
				{!person.isNewUser() &&
					<Breadcrumbs items={[[`Edit ${person.name}`, Person.pathForEdit(person)]]} />
				}
				<PersonForm
					initialValues={person}
					edit
					showPositionAssignment={canEditPosition}
					title={legendText}
					saveText={saveText} />
			</div>
		)
	}
}

const PersonEdit = (props) => (
	<AppContext.Consumer>
		{context =>
			<BasePersonEdit currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(PersonEdit)
