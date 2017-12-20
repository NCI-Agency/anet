import React, {Component, PropTypes} from 'react'
import autobind from 'autobind-decorator'
import Autocomplete from 'components/Autocomplete'
import {Modal, Button, Grid, Row, Col, Alert, Table} from 'react-bootstrap'
import {Person, Position} from 'models'
import API from 'api'

export default class AssignPersonModal extends Component {
	static propTypes = {
		position: PropTypes.object.isRequired,
		showModal: PropTypes.bool,
		onCancel: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired
	}

	constructor(props, context) {
		super(props, context)
		this.state = {
			person: props.position && props.position.person
		}
	}

	componentWillReceiveProps(nextProps, nextContext) {
		let person = nextProps.position.person
		this.setState({person})
	}

	render() {
		let {position} = this.props
		let newPerson = this.state.person

		let personSearchQuery = {}
		if (position.type === Position.TYPE.PRINCIPAL) {
			personSearchQuery.role = 'PRINCIPAL'
		} else  {
			personSearchQuery.role = 'ADVISOR'
		}

		return (
			<Modal show={this.props.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>Set Person for {position.name}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{position.person.id &&
						<div style={{textAlign:'center'}}>
							<Button bsStyle="danger" onClick={this.remove}>
								Remove {position.person.name} from {position.name}
							</Button>
							<hr className="assignModalSplit" />
						</div>
					}
					<Grid fluid>
						<Row>
							<Col md={2}>
								<b>Select a person</b>
							</Col>
							<Col md={10}>
								<Autocomplete valueKey="name"
									placeholder="Select a person for this position"
									objectType={Person}
									className="select-person-autocomplete"
									fields={'id, name, rank, role, position  { id, name}'}
									template={person =>
										<span>{[person.name, person.rank].join(' - ')}</span>
									}
									queryParams={personSearchQuery}
									value={this.state.person}
									onChange={this.onPersonSelect}
								/>
							</Col>
						</Row>
						{newPerson && newPerson.id &&
							<Table>
								<thead>
									<tr>
										<th>Rank</th>
										<th>Name</th>
										<th>Current Position</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											{newPerson.rank}
										</td>
										<td>
											{newPerson.name}
										</td>
										<td>
											{newPerson.position ?
												newPerson.position.name
												:
												(newPerson.id === position.person.id ?
													position.name
													:
													<i>None</i>
												)
											}
										</td>
									</tr>
								</tbody>
							</Table>
						}
						{this.state.person && this.state.person.position && this.state.person.position.id !== position.id &&
							<Alert bsStyle={"danger"}>
								This person is currently in another position. By selecting this person, <b>{this.state.person.position.name}</b> will be left unfilled.
							</Alert>
						}
					</Grid>
				</Modal.Body>
				<Modal.Footer>
					<Button className="pull-left" onClick={this.close}>Cancel</Button>
					<Button onClick={this.save} bsStyle={"primary"} className="save-button">Save</Button>
				</Modal.Footer>
			</Modal>
		)
	}

	@autobind
	remove() {
		let position = this.props.position
		API.fetch('/api/positions/' + position.id + '/person', { method: 'DELETE'}
			).then(resp =>
				this.props.onSuccess()
			).catch(error => {
				//halp
			})
	}

	@autobind
	save() {
		let person = {id: this.state.person.id}
		let position = this.props.position
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
	onPersonSelect(person) {
		this.setState({person})
	}

}
