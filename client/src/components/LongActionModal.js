import React, {Component, PropTypes} from 'react'
import {Button, Modal} from 'react-bootstrap'
import autobind from 'autobind-decorator'
import { Line } from 'rc-progress'

export default class LongAction extends Component {
	

	// @vassil need to abstract the labeling

	static propTypes = {
		showModal: PropTypes.bool,
		onCancel: PropTypes.func.isRequired,
		current: PropTypes.number.isRequired,
		total: PropTypes.number.isRequired

	}

	constructor(props, context) {
		super(props, context)
	}


	render() {
		let percentage = 100 * this.props.current / this.props.total
		return (
			<Modal show={this.props.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title> Export csv</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Exporting {this.props.current+1} out of {this.props.total} </p>
					<Line percent={percentage} strokeWidth="2" strokeColor="#3d5166" />
				</Modal.Body>
				<Modal.Footer>
					<Button className="pull-left" onClick={this.close}>Cancel</Button>
				</Modal.Footer>
			</Modal>
		)
	}


	@autobind
	close() {
		this.props.onCancel()
	}
}
