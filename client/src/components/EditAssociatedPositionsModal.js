import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { Formik, Form } from 'formik'

import {Modal, Button, Table} from 'react-bootstrap'
import {Position,Person} from 'models'
import API from 'api'
import Settings from 'Settings'
import _isEqual from 'lodash/isEqual'

import Messages from'components/Messages'
import MultiSelector from 'components/MultiSelector'
import AppContext from 'components/AppContext'

import POSITIONS_ICON from 'resources/positions.png'
import REMOVE_ICON from 'resources/delete.png'

const PositionTable = (props) => (
	<Table striped condensed hover responsive>
		<thead>
			<tr>
				<th></th>
				<th>Name</th>
				<th>Position</th>
				<th>Organization</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{Position.map(props.associatedPositions, relPos => {
				const person = new Person(relPos.person)
				return (
					<tr key={relPos.uuid}>
						<td>
							{person && <img src={person.iconUrl()} alt={person.humanNameOfRole()} height={20} className="person-icon" />}
						</td>

						<td>{person && person.name}</td>
						<td>{relPos.name}</td>
						<td>{relPos.organization && relPos.organization.shortName}</td>

						<td onClick={() => props.onDelete(relPos)}>
							<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Unassign person" /></span>
						</td>
					</tr>
				)
			})}
		</tbody>
	</Table>
)

class BaseEditAssociatedPositionsModal extends Component {
	static propTypes = {
		position: PropTypes.object.isRequired,
		showModal: PropTypes.bool,
		onCancel: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)
		this.state = {
			error: null,
		}
	}

	render() {
		const { position, currentUser } = this.props
		const assignedRole = position.type === Position.TYPE.PRINCIPAL ? Settings.fields.advisor.person.name : Settings.fields.principal.person.name

		const positionSearchQuery = {status: Position.STATUS.ACTIVE, matchPersonName: true}
		if (position.type === Position.TYPE.PRINCIPAL) {
			positionSearchQuery.type = [Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR]
			if (currentUser.isAdmin() === false) {
				//Super Users can only assign a position in their organization!
				positionSearchQuery.organizationUuid = currentUser.position.organization.uuid
				positionSearchQuery.includeChildrenOrgs = true
			}
		} else {
			positionSearchQuery.type = [Position.TYPE.PRINCIPAL]
		}

		return (
			<Formik
				enableReinitialize={true}
				onSubmit={this.onSubmit}
				initialValues={position}
			>
			{({
				setFieldValue,
				values,
				submitForm
			}) => {
				return (
					<Modal show={this.props.showModal} onHide={this.close}>
						<Modal.Header closeButton>
							<Modal.Title>Modify assigned {assignedRole}</Modal.Title>
						</Modal.Header>
						<Modal.Body>
							<Messages error={this.state.error} />
							<Form className="form-horizontal" method="post">
								<MultiSelector
									items={values.associatedPositions}
									objectType={Position}
									queryParams={positionSearchQuery}
									addFieldName='associatedPositions'
									addFieldLabel={null}
									addon={POSITIONS_ICON}
									renderExtraCol={false}
									placeholder={`Start typing to search for a ${assignedRole} position...`}
									fields='uuid, name, code, type, person { uuid, name, rank, role }, organization { uuid, shortName, longName, identificationCode }'
									template={pos => {
										const components = []
										pos.person && components.push(pos.person.name)
										pos.name && components.push(pos.name)
										pos.code && components.push(pos.code)
										return <span>{components.join(' - ')}</span>
									}}
									renderSelected={<PositionTable associatedPositions={values.associatedPositions} />}
									onChange={value => setFieldValue('associatedPositions', value)}
								/>
							</Form>
						</Modal.Body>
						<Modal.Footer>
							<Button className="pull-left" onClick={this.close}>Cancel</Button>
							<Button onClick={submitForm} bsStyle={"primary"} >Save</Button>
						</Modal.Footer>
					</Modal>
				)
			}}
			</Formik>
		)
	}

	close = () => {
		// Reset state before closing (cancel)
		this.setState({
			error: null,
		})
		this.props.onCancel()
	}

	onSubmit = (values, form) => {
		return this.save(values, form)
			.then(response => this.props.onSuccess())
			.catch(error => {
				this.setState({error}, () => {
					form.setSubmitting(false)
				})
			})
	}

	save = (values, form) => {
		const position = new Position(this.props.position)
		position.associatedPositions = values.associatedPositions
		delete position.previousPeople
		delete position.person //prevent any changes to person.
		const graphql = 'updateAssociatedPosition(position: $position)'
		const variables = { position: position }
		const variableDef = '($position: PositionInput!)'
		return API.mutation(graphql, variables, variableDef)
	}
}

const EditAssociatedPositionsModal = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseEditAssociatedPositionsModal currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default EditAssociatedPositionsModal
