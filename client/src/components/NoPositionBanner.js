import React, {Component} from 'react'

const css = {
	background: 'orange',
}

export default class NoPositionBanner extends Component {
	render() {
		return (
			<div className="banner" style={css}>
				You haven't been assigned to a position. Contact your organization's super user to be added.
			</div>
		)
	}
}
