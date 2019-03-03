import PropTypes from 'prop-types'
import React, { Component } from 'react'
import LinkTo from 'components/LinkTo'
import {Person} from 'models'
import AppContext from 'components/AppContext'

const SETTING_KEY_TEXT = 'SECURITY_BANNER_TEXT'
const SETTING_KEY_COLOR = 'SECURITY_BANNER_COLOR'

const css = {
	zIndex: 101,
}

const aCss = {
	color: 'white',
	fontSize: '0.7em',
}

class BaseSecurityBanner extends Component {
	static propTypes = {
		location: PropTypes.object.isRequired,
		currentUser: PropTypes.instanceOf(Person),
		appSettings: PropTypes.object,
	}

	render() {
		const { appSettings } = this.props|| {}
		const { currentUser } = this.props

		return (
			<div className="banner" style={{...css, background: appSettings[SETTING_KEY_COLOR]}}>
				{appSettings[SETTING_KEY_TEXT]}
				{' '}||{' '}
				{currentUser.name} <LinkTo person={currentUser} style={aCss} showIcon={false}>(edit)</LinkTo>
			</div>
		)
	}
}

const SecurityBanner = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseSecurityBanner appSettings={context.appSettings} currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default SecurityBanner
