import React from 'react'

import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import Fieldset from 'components/Fieldset'
import AuthorizationGroupTable from './AuthorizationGroupTable'

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
				list { uuid, name, description, positions { uuid, name, type }, status }
			}
		`).then(data => {
			this.setState({authorizationGroups: data.authorizationGroups.list})
		})
	}

	render() {
		return (
			<div>
				<Fieldset title='Authorization Groups'>
					<AuthorizationGroupTable authorizationGroups={this.state.authorizationGroups} />
				</Fieldset>
			</div>
		)
	}

}

export default connect(null, mapDispatchToProps)(AuthorizationGroups)
