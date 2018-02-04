import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class Fieldset extends Component {
	static propTypes = {
		title: PropTypes.node,
		action: PropTypes.node,
	}

	render() {
		let {id, title, action, ...props} = this.props

		return <div id={id} data-jumptarget={id}>
			<h2 className="legend">
				<span className="title-text">{title}</span>
				{action && <small>{action}</small>}
			</h2>

			<fieldset {...props} />
		</div>
	}
}