import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

export default class SubNav extends Component {

	static propTypes = {
		subnavElemId: PropTypes.string.isRequired,
	}

	constructor(props) {
		super(props)

		this.state = {
			subnavElem: document.getElementById(this.props.subnavElemId),
		}
	}

	componentDidMount() {
		const elem = document.getElementById(this.props.subnavElemId)
		if (elem !== this.state.subnavElem) {
			this.setState({subnavElem: elem})
		}
	}

	render() {
		return (this.state.subnavElem &&
			ReactDOM.createPortal(
				this.props.children,
				this.state.subnavElem
			)
		)
	}

}
