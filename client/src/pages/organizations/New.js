import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import OrganizationForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import API from 'api'
import {Organization, Person} from 'models'

import utils from 'utils'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class OrganizationNew extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			originalOrganization: new Organization({type: Organization.TYPE.ADVISOR_ORG}),
			organization: new Organization({type: Organization.TYPE.ADVISOR_ORG}),
		}
	}

	fetchData(props) {
		const qs = utils.parseQueryString(props.location.search)
		if (qs.parentOrgUuid) {
			return API.query(/* GraphQL */`
				organization(uuid:"${qs.parentOrgUuid}") {
					uuid, shortName, longName, identificationCode, type
				}
			`).then(data => {
				let {organization, originalOrganization} = this.state
				organization.parentOrg = new Organization(data.organization)
				organization.type = organization.parentOrg.type

				originalOrganization.parentOrg = new Organization(data.organization)
				originalOrganization.type = originalOrganization.parentOrg.type

				this.setState({organization, originalOrganization})
			})
		}
	}


	render() {
		let organization = this.state.organization

		return (
			<div>
				<Breadcrumbs items={[['Create new Organization', Organization.pathForNew()]]} />

				<OrganizationForm original={this.state.originalOrganization} organization={organization} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(OrganizationNew)
