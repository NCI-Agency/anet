import React from 'react'
import Page from 'components/Page'

import Messages from 'components/Messages'
import NavigationWarning from 'components/NavigationWarning'
import Breadcrumbs from 'components/Breadcrumbs'

import AuthorizationGroupForm from 'pages/admin/authorizationgroup/Form'
import {AuthorizationGroup} from 'models'

import API from 'api'

export default class AuthorizationGroupEdit extends Page {
	static pageProps = {
		useNavigation: false
	}

	constructor(props) {
		super(props)

		this.state = {
			authorizationGroup: new AuthorizationGroup(),
			originalAuthorizationGroup : new AuthorizationGroup()
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
				authorizationGroup(id:${props.params.id}) {
				id, name, description, positions { id, name, type }, status
			}
		`).then(data => {
			this.setState({
				authorizationGroup: new AuthorizationGroup(data.authorizationGroup),
				originalAuthorizationGroup : new AuthorizationGroup(data.authorizationGroup)
			})
		})
	}

	render() {
		let authorizationGroup = this.state.authorizationGroup
		return (
			<div>
				<Breadcrumbs items={[[authorizationGroup.name, AuthorizationGroup.pathFor(authorizationGroup)], ["Edit", AuthorizationGroup.pathForEdit(authorizationGroup)]]} />
				<Messages error={this.state.error} success={this.state.success} />

				<NavigationWarning original={this.state.originalAuthorizationGroup} current={authorizationGroup} />
				<AuthorizationGroupForm authorizationGroup={authorizationGroup} edit />
			</div>
		)
	}
}
