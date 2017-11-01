import React from 'react'
import Page from 'components/Page'

import NavigationWarning from 'components/NavigationWarning'
import OrganizationForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'

import API from 'api'
import {Organization} from 'models'

export default class OrganizationNew extends Page {
	static pageProps = {
		useNavigation: false,
	}

	constructor(props) {
		super(props)

		this.state = {
			originalOrganization: new Organization({type: 'ADVISOR_ORG'}),
			organization: new Organization({type: 'ADVISOR_ORG'}),
		}
	}

	fetchData(props) {
		if (props.location.query.parentOrgId) {
			API.query(/* GraphQL */`
				organization(id: ${props.location.query.parentOrgId}) {
					id, shortName, longName, identificationCode, type
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

				<NavigationWarning original={this.state.originalOrganization} current={organization} />
				<OrganizationForm organization={organization} />
			</div>
		)
	}
}
