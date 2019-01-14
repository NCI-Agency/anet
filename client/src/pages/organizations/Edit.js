import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import OrganizationForm from './Form'
import Breadcrumbs from 'components/Breadcrumbs'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import API from 'api'
import {Organization, Person} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class OrganizationEdit extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	static modelName = 'Organization'

	state = {
		organization: new Organization(),
	}

	static modelName = 'Organization'

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			organization(uuid:"${props.match.params.uuid}") {
				uuid, shortName, longName, status, identificationCode, type,
				parentOrg { uuid, shortName, longName, identificationCode }
				approvalSteps { uuid, name
					approvers { uuid, name, person { uuid, name, rank, role }}
				},
				tasks { uuid, shortName, longName}
				${GRAPHQL_NOTES_FIELDS}
			}
		`).then(data => {
			this.setState({
				organization: new Organization(data.organization),
			})
		})
	}

	render() {
		const { organization } = this.state

		return (
			<div>
				<RelatedObjectNotes notes={organization.notes} relatedObject={organization.uuid && {relatedObjectType: 'organizations', relatedObjectUuid: organization.uuid}} />
				<Breadcrumbs items={[[`Organization ${organization.shortName}`, Organization.pathForEdit(organization)]]} />
				<OrganizationForm edit initialValues={organization} title={`Organization ${organization.shortName}`} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(OrganizationEdit)
