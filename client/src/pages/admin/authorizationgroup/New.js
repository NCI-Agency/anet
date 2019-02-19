import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import AuthorizationGroupForm from './Form'

import {AuthorizationGroup} from 'models'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class AuthorizationGroupNew extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	state = {
		authorizationGroup: new AuthorizationGroup(),
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	render() {
		const { authorizationGroup } = this.state
		return (
			<div>
				<AuthorizationGroupForm initialValues={authorizationGroup} title='Create a new Authorization Group' />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(AuthorizationGroupNew)
