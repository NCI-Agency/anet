import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import Autocomplete from 'components/Autocomplete'
import {Modal, Button, Grid, Row, Col, Alert, Table} from 'react-bootstrap'
import {Position, Person} from 'models'
import LinkTo from 'components/LinkTo'
import API from 'api'
import AppContext from 'components/AppContext'

class BaseAssignPositionModal extends Component {
	static propTypes = {
		person: PropTypes.object.isRequired,
		showModal: PropTypes.bool,
		onCancel: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)
		this.state = {
			position: props.person && props.person.position
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.person.position !== this.props.person.position) {
			this.setState({position: this.props.person.position})
		}
	}

	render() {
		const { person, currentUser } = this.props
		let newPosition = new Position(this.state.position)

		let positionSearchQuery = {status: Position.STATUS.ACTIVE}
		if (person.role === Person.ROLE.ADVISOR) {
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
		} else if (person.role === Person.ROLE.PRINCIPAL) {
			positionSearchQuery.type = [Position.TYPE.PRINCIPAL]
		}

		return (
			<Modal show={this.props.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>Set Position for <LinkTo person={person} isLink={false}/></Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{person.position.id &&
						<div style={{textAlign:'center'}}>
							<Button bsStyle="danger" onClick={this.remove} className="remove-person-from-position">
								Remove <LinkTo person={person} isLink={false}/> from <LinkTo position={person.position} isLink={false}/>
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
									fields={'id, name, code, type, organization { id, shortName, longName, identificationCode}, person { id, name }'}
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
								This position is currently held by <LinkTo person={this.state.position.person}/>.  By selecting this position, they will be removed.
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
		if (position.id) {
			this.setState({position})
		}
	}

}
const AssignPositionModal = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseAssignPositionModal currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default AssignPositionModal
