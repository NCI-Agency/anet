import React from 'react'
import Page from 'components/Page'
import NavigationWarning from 'components/NavigationWarning'

import OrganizationForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'

import API from 'api'
import {Organization} from 'models'

export default class OrganizationEdit extends Page {
	static pageProps = {
		useNavigation: false,
	}

	static modelName = 'Organization'

	constructor(props) {
		super(props)

		this.state = {
			organization: new Organization(),
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			organization(id:${props.params.id}) {
				id, shortName, longName, identificationCode, type,
				parentOrg { id, shortName, longName, identificationCode }
				approvalSteps { id, name
					approvers { id, name, person { id, name}}
				},
				poams { id, shortName, longName}
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
				<NavigationWarning original={this.state.originalOrganization} current={organization} />

				<Breadcrumbs items={[[`Edit ${organization.shortName}`, Organization.pathForEdit(organization)]]} />
				<Messages error={this.state.error} success={this.state.success} />

				<OrganizationForm organization={organization} edit />
			</div>
		)
	}
}
