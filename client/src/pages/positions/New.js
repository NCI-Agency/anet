import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import PositionForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import API from 'api'
import {Organization, Position} from 'models'

import utils from 'utils'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PositionNew extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	state = {
		position: new Position(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
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
					const organization = new Organization(data.organization)
					return new Position({
						type: organization.isAdvisorOrg() ? Position.TYPE.ADVISOR : Position.TYPE.PRINCIPAL,
						organization,
					})
				}

				this.setState({
					position: getPositionFromData(),
				})
			})
		}
	}

	render() {
		const { position } = this.state
		return (
			<div>
				<Breadcrumbs items={[['New Position', Position.pathForNew()]]} />
				<PositionForm initialValues={position} title='Create a new position' />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(PositionNew)
