import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'
import {Button} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import { withRouter } from 'react-router-dom'
import { setPageProps, PAGE_PROPS_MIN_HEAD } from 'actions'
import { connect } from 'react-redux'

class OnboardingShow extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	constructor(props) {
		super(props, PAGE_PROPS_MIN_HEAD)
		this.state = {}
	}

	render() {
		return (
			<div className="onboarding-new">
				<h1>Welcome to ANET</h1>
				<p>ANET is a training system for reporting TAA engagements, and learning about past engagements and people.</p>
				<p>Let's create a new account for you. We'll grab your basic information and help your super user get you set up.</p>
				<div className="create-account-button-wrapper">
					<Button bsStyle="primary" onClick={this.onCreateAccountClick}>Create your account</Button>
				</div>
			</div>
		)
	}

	@autobind
	onCreateAccountClick() {
		this.props.history.push('/onboarding/edit')
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(withRouter(OnboardingShow))
