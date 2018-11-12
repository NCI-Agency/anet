import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Element} from 'react-scroll'

export default class Fieldset extends Component {
	static propTypes = {
		title: PropTypes.node,
		action: PropTypes.node,
		style: PropTypes.object,
	}

	render() {
		let {id, title, action, ...props} = this.props

		return <Element id={id} name={id} className="scroll-anchor-container" style={this.props.style}>
			{(title || action) &&
			<h2 className="legend">
				<span className="title-text">{title}</span>
				{action && <small>{action}</small>}
			</h2>
			}

			<fieldset style={this.props.style} {...props} />
		</Element>
	}
}
