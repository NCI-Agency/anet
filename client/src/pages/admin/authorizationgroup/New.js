import React from 'react'

import NavigationWarning from 'components/NavigationWarning'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import AuthorizationGroupForm from 'pages/admin/authorizationgroup/Form'

import {AuthorizationGroup} from 'models'

export default class AuthorizationGroupNew extends ValidatableFormWrapper {
	static pageProps = {
		useNavigation: false
	}

	constructor(props) {
		super(props)

		this.state = {
			authorizationGroup: new AuthorizationGroup(),
		}
	}

	render() {
		let authorizationGroup = this.state.authorizationGroup

		return (
			<div>
				<NavigationWarning original={new AuthorizationGroup()} current={authorizationGroup} />
				<Breadcrumbs items={[['Create new authorization group', AuthorizationGroup.pathForNew()]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<AuthorizationGroupForm authorizationGroup={authorizationGroup} />
			</div>
		)
	}
}
