import React from 'react'
import Page from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import NavigationWarning from 'components/NavigationWarning'

import PositionForm from './Form'

import API from 'api'
import {Position, Organization} from 'models'

export default class PositionNew extends Page {
	static pageProps = {
		useNavigation: false
	}

	constructor(props) {
		super(props)

		this.state = {
			position: setDefaultPermissions(new Position( {type: Position.TYPE.ADVISOR})),
			originalPosition: setDefaultPermissions(new Position( {type: Position.TYPE.ADVISOR})),
		}
	}

	fetchData(props) {
		if (props.location.query.organizationId) {
			//If an organizationId was given in query parameters,
			// then look that org up and pre-populate the field.
			API.query(/* GraphQL */`
				organization(id:${props.location.query.organizationId}) {
					id, shortName, longName, type
				}
			`).then(data => {
				function getPositionFromData() {
					let organization = new Organization(data.organization)
					return setDefaultPermissions(new Position({
						type: organization.isAdvisorOrg() ? Position.TYPE.ADVISOR : Position.TYPE.PRINCIPAL,
						organization,
					}))
				}

				this.setState({
					position: getPositionFromData(),
					originalPosition: getPositionFromData()
				})
			})
		}
	}

	render() {
		let position = this.state.position

		return (
			<div>
				<Breadcrumbs items={[['Create new Position', Position.pathForNew()]]} />

				<NavigationWarning original={this.state.originalPosition} current={position} />
				<PositionForm position={position} />
			</div>
		)
	}
}

function setDefaultPermissions(position) {
	if (!position.permissions) {
		position.permissions = position.type
	}
	return position
}
