import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Element} from 'react-scroll'

export default class Fieldset extends Component {
	static propTypes = {
		title: PropTypes.node,
		action: PropTypes.node,
	}

	render() {
		let {id, title, action, ...props} = this.props

		return <Element id={id} name={id} className="scroll-anchor-container">
			<h2 className="legend">
				<span className="title-text">{title}</span>
				{action && <small>{action}</small>}
			</h2>

			<fieldset {...props} />
		</Element>
	}
}
