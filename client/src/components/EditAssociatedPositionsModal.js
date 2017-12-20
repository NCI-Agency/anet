import React, {Component, PropTypes} from 'react'
import autobind from 'autobind-decorator'
import Autocomplete from 'components/Autocomplete'
import {Modal, Button, Table} from 'react-bootstrap'
import {Position,Person} from 'models'
import API from 'api'
import dict from 'dictionary'

import Messages from'components/Messages'

import REMOVE_ICON from 'resources/delete.png'

export default class EditAssociatedPositionsModal extends Component {
	static propTypes = {
		position: PropTypes.object.isRequired,
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
			associatedPositions: props.position.associatedPositions
		}
	}

	componentWillReceiveProps(nextProps, nextContext) {
		let assoc = nextProps.position.associatedPositions
		this.setState({associatedPositions: assoc})
	}

	render() {
		let {position} = this.props
		let {associatedPositions} = this.state
		let currentUser = this.context.currentUser
		let assignedRole = position.type === Position.TYPE.PRINCIPAL ? dict.lookup('ADVISOR_PERSON_TITLE') : dict.lookup('PRINCIPAL_PERSON_TITLE')

		let positionSearchQuery = {matchPersonName: true}
		if (position.type === Position.TYPE.PRINCIPAL) {
			positionSearchQuery.type = [Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR]
			if (currentUser.isAdmin() === false) {
				//Super Users can only assign a position in their organization!
				positionSearchQuery.organizationId = currentUser.position.organization.id
				positionSearchQuery.includeChildrenOrgs = true
			}
		} else {
			positionSearchQuery.type = [Position.TYPE.PRINCIPAL]
		}

		return (
			<Modal show={this.props.showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>Modify assigned {assignedRole}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Messages error={this.state.error} success={this.state.success} />
					<Autocomplete
						placeholder={'Start typing to search for a ' + assignedRole + ' position...'}
						objectType={Position}
						fields={'id, name, code, type, person { id, name, rank }, organization { id, shortName, longName, identificationCode}'}
						template={pos => {
							let components = []
							pos.person && components.push(pos.person.name)
							pos.name && components.push(pos.name)
							pos.code && components.push(pos.code)
							return <span>{components.join(' - ')}</span>
						}}
						onChange={this.addPositionRelationship}
						clearOnSelect={true}
						value={associatedPositions}
						queryParams={positionSearchQuery} />

					<Table hover striped>
						<thead>
							<tr>
								<th></th>
								<th>Name</th>
								<th>Position</th>
								<th>Org</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{Position.map(associatedPositions, relPos => {
								let person = new Person(relPos.person)
								return (
									<tr key={relPos.id}>
										<td>
											{person && <img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />}
										</td>

										<td>{person && person.name}</td>
										<td>{relPos.name}</td>
										<td>{relPos.organization && relPos.organization.shortName}</td>

										<td onClick={this.removePositionRelationship.bind(this, relPos)}>
											<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Unassign person" /></span>
										</td>
									</tr>
								)
							})}
						</tbody>
					</Table>
				</Modal.Body>
				<Modal.Footer>
					<Button className="pull-left" onClick={this.close}>Cancel</Button>
					<Button onClick={this.save} bsStyle={"primary"} >Save</Button>
				</Modal.Footer>
			</Modal>
		)
	}

	@autobind
	addPositionRelationship(newRelatedPos)  {
		let rels = this.state.associatedPositions

		if (!rels.find(relPos => relPos.id === newRelatedPos.id)) {
			let newRels = rels.slice()
			newRels.push(new Position(newRelatedPos))

			this.setState({associatedPositions: newRels})
		}
	}

	@autobind
	removePositionRelationship(relToDelete) {
		let rels = this.state.associatedPositions
		let index = rels.findIndex(rel => rel.id === relToDelete.id)

		if (index !== -1) {
			rels.splice(index, 1)
			this.setState({associatedPositions: rels})
		}
	}

	@autobind
	save() {
		let position = new Position(this.props.position)
		position.associatedPositions = this.state.associatedPositions
		delete position.previousPeople
		delete position.person //prevent any changes to person.

		API.send('/api/positions/update', position)
			.then(resp =>
				this.props.onSuccess()
			).catch(error => {
				this.setState({error: error})
			})
	}

	@autobind
	close() {
		this.props.onCancel()
	}
}
