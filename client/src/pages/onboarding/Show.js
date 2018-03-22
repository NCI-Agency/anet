import React from 'react'
import Page from 'components/Page'
import {Button} from 'react-bootstrap'
import autobind from 'autobind-decorator'


export default class OnboardingShow extends Page {
	static pageProps = {
		useNavigation: false,
		minimalHeader: true,
	}

	constructor() {
		super()
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
//		History.push('/onboarding/edit') FIXME React16
	}
}
