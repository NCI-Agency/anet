import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Button} from 'react-bootstrap'

import Confirm from 'react-confirm-bootstrap'
import 'components/react-confirm-bootstrap.css'

export default class ConfirmDelete extends Component {
	static propTypes = {
		onConfirmDelete: PropTypes.func,
		objectType: PropTypes.string,
		objectDisplay: PropTypes.string,
		bsStyle: PropTypes.string,
		buttonLabel: PropTypes.string,
		buttonClass: PropTypes.string,
	}

	render() {
		const confirmDeleteText = `Yes, I am sure that I want to delete ${this.props.objectType} ${this.props.objectDisplay}`
		const title = `Confirm to delete ${this.props.objectType}`
		const body = `Are you sure you want to delete this ${this.props.objectType}? This cannot be undone.`

		return (
			<Confirm
				onConfirm={this.props.onConfirmDelete}
				title={title}
				body={body}
				confirmText={confirmDeleteText}
				cancelText="No, I am not entirely sure at this point"
				dialogClassName="react-confirm-bootstrap-modal"
				confirmBSStyle="primary">
				<Button bsStyle={this.props.bsStyle}>
					{this.props.buttonLabel}
				</Button>
			</Confirm>
		)
	}
}
