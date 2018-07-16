import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import OrganizationForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'

import API from 'api'
import {Organization, Person} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class OrganizationEdit extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	static modelName = 'Organization'

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			originalOrganization: new Organization(),
			organization: new Organization(),
		}
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			organization(id:${props.match.params.id}) {
				id, shortName, longName, status, identificationCode, type,
				parentOrg { id, shortName, longName, identificationCode }
				approvalSteps { id, name
					approvers { id, name, person { id, name, rank}}
				},
				tasks { id, shortName, longName}
			}
		`).then(data => {
			this.setState({
				organization: new Organization(data.organization),
				originalOrganization: new Organization(data.organization)
			})
		})
	}

	render() {
		let organization = this.state.organization

		return (
			<div>
				<Breadcrumbs items={[[`Edit ${organization.shortName}`, Organization.pathForEdit(organization)]]} />
				<Messages error={this.state.error} success={this.state.success} />

				<OrganizationForm original={this.state.originalOrganization} organization={organization} edit />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(OrganizationEdit)
