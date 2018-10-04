import PropTypes from 'prop-types'
import React, { Component } from 'react'
import autobind from 'autobind-decorator'
import Autocomplete from 'components/Autocomplete'
import {Modal, Button, Grid, Row, Col, Alert, Table} from 'react-bootstrap'
import {Person, Position} from 'models'
import LinkTo from 'components/LinkTo'
import Messages from 'components/Messages'
import API from 'api'
import _isEmpty from 'lodash/isEmpty'

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
			error: null,
			person: props.position && props.position.person
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.position.person !== this.props.position.person) {
			this.setState({person: this.props.position.person}, () => this.updateAlert())
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
					{position.person.uuid &&
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
									fields={'uuid, name, rank, role, position { uuid, name}'}
									template={person =>
										<LinkTo person={person} isLink={false} />
									}
									queryParams={personSearchQuery}
									value={this.state.person}
									onChange={this.onPersonSelect}
								/>
							</Col>
						</Row>
						{newPerson && newPerson.uuid &&
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
												(newPerson.uuid === position.person.uuid ?
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
						<Messages error={this.state.error} />
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
		let graphql = 'deletePersonFromPosition(uuid: $uuid)'
		const variables = {
			uuid: this.props.position.uuid,
		}
		const variableDef = '($uuid: String!)'
		API.mutation(graphql, variables, variableDef)
			.then(
				data => this.props.onSuccess()
			).catch(error => {
				this.setState({error: error})
			})
	}

	@autobind
	save() {
		const operation = 'putPersonInPosition'
		let graphql = operation + '(uuid: $uuid, person: $person)'
		const variables = {
			uuid: this.props.position.uuid,
			person: {uuid: this.state.person.uuid}
		}
		const variableDef = '($uuid: String!, $person: PersonInput!)'
		API.mutation(graphql, variables, variableDef)
			.then(
				data => this.props.onSuccess()
			).catch(error => {
				this.setState({error: error})
			})
	}

	@autobind
	close() {
		// Reset state before closing (cancel)
		this.setState({person: this.props.position.person}, () => this.updateAlert())
		this.props.onCancel()
	}

	@autobind
	onPersonSelect(person) {
		this.setState({person}, () => this.updateAlert())
	}

	@autobind
	updateAlert() {
		let error = null
		if (!_isEmpty(this.state.person) && !_isEmpty(this.state.person.position) && this.state.person.position.uuid !== this.props.position.uuid) {
			const errorMessage = <React.Fragment>This person is currently in another position. By selecting this person, <b>{this.state.person.position.name}</b> will be left unfilled.</React.Fragment>
			error = {message: errorMessage}
		}
		this.setState({error: error})
	}

}
