import React from 'react'

import Breadcrumbs from 'components/Breadcrumbs'
import Page from 'components/Page'
import Fieldset from 'components/Fieldset'
import AuthorizationGroupTable from 'components/AuthorizationGroupTable'

import API from 'api'

export default class AuthorizationGroups extends Page {
	constructor(props) {
		super(props)
		this.state = {
			authorizationGroups: []
		}
	}

	fetchData() {
		API.query(/* GraphQL */`
			authorizationGroupList(f:getAll) {
				list { id, name, description, positions { id, name, type }, status }
			}
		`).then(data => {
			this.setState({authorizationGroups: data.authorizationGroupList.list})
		})
	}

	render() {
		return (
			<div>
				<Breadcrumbs items={[['Authorization Groups', '/admin/authorizationGroups']]} />
				<Fieldset title='Authorization groups' id='12'>
					<AuthorizationGroupTable authorizationGroups={this.state.authorizationGroups} />
				</Fieldset>
			</div>
		)
	}

}
