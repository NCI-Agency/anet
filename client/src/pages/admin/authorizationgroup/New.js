import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import AuthorizationGroupForm from 'pages/admin/authorizationgroup/Form'

import {AuthorizationGroup} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class AuthorizationGroupNew extends Page {

	static propTypes = {...pagePropTypes}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			authorizationGroup: new AuthorizationGroup(),
			originalAuthorizationGroup : new AuthorizationGroup()
		}
	}

	render() {
		let authorizationGroup = this.state.authorizationGroup

		return (
			<div>
				<Breadcrumbs items={[['Create new authorization group', AuthorizationGroup.pathForNew()]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<AuthorizationGroupForm original={this.state.originalAuthorizationGroup} authorizationGroup={authorizationGroup} />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(AuthorizationGroupNew)
