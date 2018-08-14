import React from 'react'

import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import Breadcrumbs from 'components/Breadcrumbs'
import Fieldset from 'components/Fieldset'
import AuthorizationGroupTable from 'components/AuthorizationGroupTable'

import API from 'api'

import { connect } from 'react-redux'

class AuthorizationGroups extends Page {

	static propTypes = {...pagePropTypes}

	constructor(props) {
		super(props)

		this.state = {
			authorizationGroups: []
		}
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			authorizationGroups {
				list { id, name, description, positions { id, name, type }, status }
			}
		`).then(data => {
			this.setState({authorizationGroups: data.authorizationGroups.list})
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

export default connect(null, mapDispatchToProps)(AuthorizationGroups)
