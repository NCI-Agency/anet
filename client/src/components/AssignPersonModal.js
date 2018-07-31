import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import Autocomplete from 'components/Autocomplete'
import {Modal, Button, Grid, Row, Col, Alert, Table} from 'react-bootstrap'
import {Person, Position} from 'models'
import LinkTo from 'components/LinkTo'
import API from 'api'

export default class AssignPersonModal extends Component {
	static propTypes = {
		position: PropTypes.object.isRequired,
		showModal: PropTypes.bool,
		onCancel: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props)
		this.state = {
			person: props.position && props.position.person
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.position.person !== this.props.position.person) {
			this.setState({person: this.props.position.person})
		}
	}

	render() {
		let {position} = this.props
		let newPerson = this.state.person

		let personSearchQuery = {status: [Person.STATUS.ACTIVE, Person.STATUS.NEW_USER]}
		if (position.type === Position.TYPE.PRINCIPAL) {
			personSearchQuery.role = Person.ROLE.PRINCIPAL
		} else  {
			personSearchQuery.role = Person.ROLE.ADVISOR
		}

		return (
			<Modal show={this.props.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>Set Person for <LinkTo position={position} isLink={false}/></Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{position.person.id &&
						<div style={{textAlign:'center'}}>
							<Button bsStyle="danger" onClick={this.remove}>
								Remove <LinkTo person={position.person} isLink={false}/> from <LinkTo position={position} isLink={false}/>
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
										<LinkTo person={person} isLink={false} />
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
		// Reset state before closing (cancel)
		this.setState({person: this.props.position.person})
		this.props.onCancel()
	}

	@autobind
	onPersonSelect(person) {
		this.setState({person})
	}

}
