import React, {Component, PropTypes} from 'react'
import autobind from 'autobind-decorator'
import Autocomplete from 'components/Autocomplete'
import {Modal, Button, Grid, Row, Col, Alert, Table} from 'react-bootstrap'
import {Position} from 'models'
import API from 'api'

export default class AssignPositionModal extends Component {
	static propTypes = {
		person: PropTypes.object.isRequired,
		showModal: PropTypes.bool,
		onCancel: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired
	}

	static contextTypes = {
		currentUser: PropTypes.object
	}

	constructor(props, context) {
		super(props, context)
		this.state = {
			position: props.person && props.person.position
		}
	}

	componentWillReceiveProps(nextProps, nextContext) {
		let position = nextProps.person.position
		this.setState({position})
	}

	render() {
		let {person} = this.props
		let newPosition = new Position(this.state.position)
		let currentUser = this.context.currentUser

		let positionSearchQuery = {}
		if (person.role === 'ADVISOR') {
			positionSearchQuery.type = [Position.TYPE.ADVISOR]
			if (currentUser.isAdmin()) { //only admins can put people in admin billets.
				positionSearchQuery.type.push(Position.TYPE.ADMINISTRATOR)
				positionSearchQuery.type.push(Position.TYPE.SUPER_USER)
			} else if (currentUser.isSuperUser()) {
				//Only super users can put people in super user billets
				//And they are limited to their organization.
				positionSearchQuery.type.push(Position.TYPE.SUPER_USER)
				positionSearchQuery.organizationId = currentUser.position.organization.id
				positionSearchQuery.includeChildrenOrgs = true
			}
		} else if (person.role === 'PRINCIPAL') {
			positionSearchQuery.type = [Position.TYPE.PRINCIPAL]
		}

		return (
			<Modal show={this.props.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>Set Position for {person.name}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{person.position.id &&
						<div style={{textAlign:'center'}}>
							<Button bsStyle="danger" onClick={this.remove} className="remove-person-from-position">
								Remove {person.name} from {person.position.name}
							</Button>
							<hr className="assignModalSplit" />
						</div>
					}
					<Grid fluid>
						<Row>
							<Col md={2}>
								<b>Select a position</b>
							</Col>
							<Col md={10}>
								<Autocomplete valueKey="name"
									placeholder="Select a position for this person"
									objectType={Position}
									fields={'id, name, code, type, organization { id, shortName, longName}, person { id, name }'}
									template={pos =>
										<span>{[pos.name, pos.code].join(' - ')}</span>
									}
									queryParams={positionSearchQuery}
									value={this.state.position}
									onChange={this.onPositionSelect}
								/>
							</Col>
						</Row>
						{newPosition && newPosition.id &&
							<Table>
								<thead>
									<tr>
										<th>Organization</th>
										<th>Type</th>
										<th>Current Person</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											{newPosition.organization.shortName}
										</td>
										<td>
											{newPosition.humanNameOfType()}
										</td>
										<td>
											{newPosition.person ?
												newPosition.person.name
												:
												(newPosition.id === person.position.id ?
													person.name
													:
													<i>Unfilled</i>
												)
											}
										</td>
									</tr>
								</tbody>
							</Table>
						}
						{this.state.position && this.state.position.person && this.state.position.person.id !== person.id &&
							<Alert bsStyle={"danger"}>
								This position is currently held by {this.state.position.person.name}.  By selecting this position, they will be removed.
							</Alert>
						}
					</Grid>
				</Modal.Body>
				<Modal.Footer>
					<Button className="pull-left" onClick={this.close}>Cancel</Button>
					<Button onClick={this.save} bsStyle={"primary"} >Save</Button>
				</Modal.Footer>
			</Modal>
		)
	}

	@autobind
	remove() {
		let position = this.props.person.position
		API.fetch('/api/positions/' + position.id + '/person', { method: 'DELETE'}
			).then(resp =>
				this.props.onSuccess()
			).catch(error => {
				//halp
			})
	}

	@autobind
	save() {
		let person = {id: this.props.person.id}
		let position = this.state.position
		API.send('/api/positions/' + position.id + '/person', person)
			.then(resp =>
				this.props.onSuccess()
			).catch(error => {
				//halp
			})
	}

	@autobind
	close() {
		this.props.onCancel()
	}

	@autobind
	onPositionSelect(position) {
		this.setState({position})
	}

}
