import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'

import PositionForm from './Form'

import API from 'api'
import {Position, Organization} from 'models'

import utils from 'utils'

import { setPageProps, PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PositionNew extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

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
			API.query(/* GraphQL */`
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

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(PositionNew)
