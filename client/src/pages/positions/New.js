import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'

import PositionForm from './Form'

import API from 'api'
import {Organization, Person, Position} from 'models'

import utils from 'utils'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PositionNew extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			position: setDefaultPermissions(new Position( {type: Position.TYPE.ADVISOR})),
			originalPosition: setDefaultPermissions(new Position( {type: Position.TYPE.ADVISOR})),
		}
	}

	fetchData(props) {
		const qs = utils.parseQueryString(props.location.search)
		if (qs.organizationUuid) {
			//If an organizationUuid was given in query parameters,
			// then look that org up and pre-populate the field.
			return API.query(/* GraphQL */`
				organization(uuid:"${qs.organizationUuid}") {
					uuid, shortName, longName, identificationCode, type
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

				<PositionForm original={this.state.originalPosition} position={position} />
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

export default connect(null, mapDispatchToProps)(PositionNew)
