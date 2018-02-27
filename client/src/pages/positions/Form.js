import React, {PropTypes} from 'react'
import {Button, HelpBlock} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import Messages from 'components/Messages'
import Autocomplete from 'components/Autocomplete'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import History from 'components/History'

import API from 'api'
import Settings from 'Settings'
import {Position, Organization} from 'models'


export default class PositionForm extends ValidatableFormWrapper {
	static propTypes = {
		position: PropTypes.object.isRequired,
		edit: PropTypes.bool,
		error: PropTypes.object,
		success: PropTypes.object,
	}

	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	render() {
		let {position, error, success, edit} = this.props
		error = this.props.error || (this.state && this.state.error)

		const currentUser = this.context.currentUser
		const isAdmin = currentUser && currentUser.isAdmin()

		let orgSearchQuery = {}
		if (position.isPrincipal()) {
			orgSearchQuery.type = Organization.TYPE.PRINCIPAL_ORG
		} else {
			orgSearchQuery.type = Organization.TYPE.ADVISOR_ORG
			if (currentUser && currentUser.position && currentUser.position.type === Position.TYPE.SUPER_USER) {
				orgSearchQuery.parentOrgId = currentUser.position.organization.id
				orgSearchQuery.parentOrgRecursively = true
			}
		}

		// Reset the organization property when changing the organization type
		if (position.organization && position.organization.type && (position.organization.type !== orgSearchQuery.type)) {
			position.organization = ''
		}

		const {ValidatableForm, RequiredField} = this

		let willAutoKickPerson = position.status === Position.STATUS.INACTIVE && position.person && position.person.id

		return (
			<ValidatableForm
				formFor={position}
				onChange={this.onChange}
				onSubmit={this.onSubmit}
				submitText="Save position"
				horizontal
			>

				<Messages error={error} success={success} />

				<Fieldset title={edit ? `Edit Position ${position.name}` : "Create a new Position"}>
					<Form.Field id="type" disabled={this.props.edit}>
						<ButtonToggleGroup>
							<Button id="typeAdvisorButton" value={Position.TYPE.ADVISOR}>{Settings.fields.advisor.position.name}</Button>
							<Button id="typePrincipalButton" value={Position.TYPE.PRINCIPAL}>{Settings.fields.principal.position.name}</Button>
						</ButtonToggleGroup>
					</Form.Field>

					<Form.Field id="status" >
						<ButtonToggleGroup>
							<Button id="statusActiveButton" value={ Position.STATUS.ACTIVE }>Active</Button>
							<Button id="statusInactiveButton" value={ Position.STATUS.INACTIVE }>Inactive</Button>
						</ButtonToggleGroup>

						{willAutoKickPerson && <HelpBlock>
							<span className="text-danger">Setting this position to inactive will automatically remove <strong>{position.person.name}</strong> from this position.</span>
						</HelpBlock> }
					</Form.Field>

					<Form.Field id="organization">
						<Autocomplete
							placeholder="Select the organization for this position"
							objectType={Organization}
							fields="id, longName, shortName, identificationCode, type"
							template={org => <span>{org.shortName} - {org.longName} {org.identificationCode}</span>}
							queryParams={orgSearchQuery}
							valueKey="shortName"
						/>
					</Form.Field>

					<Form.Field id="code"
						label={position.type === Position.TYPE.PRINCIPAL ? Settings.PRINCIPAL_POSITION_CODE_NAME : Settings.ADVISOR_POSITION_CODE_NAME}
						placeholder="Postion ID or Number" />

					<RequiredField id="name" label="Position Name" placeholder="Name/Description of Position"/>

					{position.type !== Position.TYPE.PRINCIPAL &&
						<Form.Field id="permissions">
							<ButtonToggleGroup>
								<Button id="permsAdvisorButton" value={Position.TYPE.ADVISOR}>{Settings.fields.advisor.position.name}</Button>
								{isAdmin &&
									<Button id="permsSuperUserButton" value={Position.TYPE.SUPER_USER}>{Settings.fields.superUser.position.name}</Button>
								}
								{isAdmin &&
									<Button id="permsAdminButton" value={Position.TYPE.ADMINISTRATOR}>{Settings.fields.administrator.position.name}</Button>
								}
							</ButtonToggleGroup>
						</Form.Field>
					}

				</Fieldset>

				<Fieldset title="Additional information">
					<Form.Field id="location">
						<Autocomplete valueKey="name" placeholder="Start typing to find a location where this Position will operate from..." url="/api/locations/search" />
					</Form.Field>
				</Fieldset>
			</ValidatableForm>
		)
	}


	@autobind
	onChange() {
		this.forceUpdate()
	}

	@autobind
	onSubmit(event) {
		let {position, edit} = this.props
		position = Object.assign({}, position)
		if (position.type !== Position.TYPE.PRINCIPAL) {
			position.type = position.permissions || Position.TYPE.ADVISOR
		}
		// Remove permissions property, was added temporarily in order to be able
		// to select a specific advisor type.
		delete position.permissions
		position.organization = {id: position.organization.id}
		position.person = (position.person && position.person.id) ? {id: position.person.id} : {}
		position.code = position.code || null //Need to null out empty position codes

		let url = `/api/positions/${edit ? 'update' : 'new'}`
		API.send(url, position, {disableSubmits: true})
			.then(response => {
				if (response.id) {
					position.id = response.id
				}

				History.replace(Position.pathForEdit(position), false)
				History.push(Position.pathFor(position), {success: 'Saved Position', skipPageLeaveWarning: true})
			}).catch(error => {
				this.setState({error: error})
				window.scrollTo(0, 0)
			})
	}

}
