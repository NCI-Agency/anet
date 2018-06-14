import PropTypes from 'prop-types'
import React, { Component } from 'react'
import LinkTo from 'components/LinkTo'
import {Person} from 'models'

const SETTING_KEY_TEXT = 'SECURITY_BANNER_TEXT'
const SETTING_KEY_COLOR = 'SECURITY_BANNER_COLOR'

const css = {
	zIndex: 101,
}

const aCss = {
	color: 'white',
	fontSize: '0.7em',
}

export default class SecurityBanner extends Component {
	static propTypes = {
		location: PropTypes.object.isRequired,
		currentUser: PropTypes.instanceOf(Person),
	}

	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		const { settings } = this.context.app.state || {}
		const { currentUser } = this.props

		return (
			<div className="banner" style={{...css, background: settings[SETTING_KEY_COLOR]}}>
				{settings[SETTING_KEY_TEXT]}
				{' '}||{' '}
				{currentUser.name} <LinkTo person={currentUser} style={aCss}>(edit)</LinkTo>
			</div>
		)
	}
}