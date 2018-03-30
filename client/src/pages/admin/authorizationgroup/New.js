import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import AuthorizationGroupForm from 'pages/admin/authorizationgroup/Form'

import {AuthorizationGroup} from 'models'

import { setPageProps, PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class AuthorizationGroupNew extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			authorizationGroup: new AuthorizationGroup(),
		}
	}

	render() {
		let authorizationGroup = this.state.authorizationGroup

		return (
			<div>
				<Breadcrumbs items={[['Create new authorization group', AuthorizationGroup.pathForNew()]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<AuthorizationGroupForm original={new AuthorizationGroup()} authorizationGroup={authorizationGroup} />
			</div>
		)
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(AuthorizationGroupNew)
