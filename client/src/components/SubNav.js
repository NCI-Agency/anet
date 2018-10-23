import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

export default class SubNav extends Component {

	static propTypes = {
		subnavElemId: PropTypes.string.isRequired,
	}

	render() {
		const subnavElem = document.getElementById(this.props.subnavElemId)
		return subnavElem &&
			ReactDOM.createPortal(
				this.props.children,
				subnavElem
			)
	}

}
