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

	state = {
		organization: new Organization(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	fetchData(props) {
		const qs = utils.parseQueryString(props.location.search)
		if (qs.parentOrgUuid) {
			return API.query(/* GraphQL */`
				organization(uuid:"${qs.parentOrgUuid}") {
					uuid, shortName, longName, identificationCode, type
				}
			`).then(data => {
				const {organization} = this.state
				organization.parentOrg = new Organization(data.organization)
				organization.type = organization.parentOrg.type
				this.setState({organization})
			})
		}
	}

	render() {
		const { organization } = this.state
		return (
			<div>
				<Breadcrumbs items={[['New Organization', Organization.pathForNew()]]} />
				<OrganizationForm initialValues={organization} title='Create a new Organization' />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(OrganizationNew)
