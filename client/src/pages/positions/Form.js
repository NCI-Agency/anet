import PropTypes from 'prop-types'
import React from 'react'
import {Button, HelpBlock} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import Messages from 'components/Messages'
import Autocomplete from 'components/Autocomplete'
import ButtonToggleGroup from 'components/ButtonToggleGroup'

import API from 'api'
import Settings from 'Settings'
import {Location, Organization, Person, Position} from 'models'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import LinkTo from 'components/LinkTo'
import { jumpToTop } from 'components/Page'
import utils from 'utils'

import WARNING_ICON from 'resources/warning.png'

class BasePositionForm extends ValidatableFormWrapper {
	static propTypes = {
		position: PropTypes.object.isRequired,
		original: PropTypes.object.isRequired,
		edit: PropTypes.bool,
		error: PropTypes.object,
		success: PropTypes.object,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)

		this.state = {
			success: null,
			error: null,
			isBlocking: false,
			errors: {},
		}
	}

	render() {
		let {position, error, success, edit} = this.props
		error = this.props.error || (this.state && this.state.error)
		const { errors } = this.state
		const hasErrors = Object.keys(errors).length > 0

		const { currentUser } = this.props
		const isAdmin = currentUser && currentUser.isAdmin()

		let orgSearchQuery = {status: Organization.STATUS.ACTIVE}
		if (position.isPrincipal()) {
			orgSearchQuery.type = Organization.TYPE.PRINCIPAL_ORG
		} else {
			orgSearchQuery.type = Organization.TYPE.ADVISOR_ORG
			if (currentUser && currentUser.position && currentUser.position.type === Position.TYPE.SUPER_USER) {
				orgSearchQuery.parentOrgUuid = currentUser.position.organization.uuid
				orgSearchQuery.parentOrgRecursively = true
			}
		}

		// Reset the organization property when changing the organization type
		if (position.organization && position.organization.type && (position.organization.type !== orgSearchQuery.type)) {
			position.organization = ''
		}

		const {ValidatableForm, RequiredField} = this

		let willAutoKickPerson = position.status === Position.STATUS.INACTIVE && position.person && position.person.uuid

		return (
			<div>
			<NavigationWarning isBlocking={this.state.isBlocking} />

			<ValidatableForm
				formFor={position}
				onChange={this.onChange}
				onSubmit={this.onSubmit}
				submitDisabled={hasErrors}
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
							<span className="text-danger">Setting this position to inactive will automatically remove <LinkTo person={position.person}/> from this position.</span>
						</HelpBlock> }
					</Form.Field>

					<RequiredField id="organization" validationState={errors.organization}>
						<Autocomplete
							placeholder="Select the organization for this position"
							objectType={Organization}
							fields="uuid, longName, shortName, identificationCode, type"
							template={org => <span>{org.shortName} - {org.longName} {org.identificationCode}</span>}
							queryParams={orgSearchQuery}
							valueKey="shortName"
						/>

						{errors.organization && <HelpBlock>
							<img src={WARNING_ICON} alt="" height="20px" />
							Organization not found in ANET Database.
						</HelpBlock>}
					</RequiredField>

					<Form.Field id="code"
						label={position.type === Position.TYPE.PRINCIPAL ? Settings.PRINCIPAL_POSITION_CODE_NAME : Settings.ADVISOR_POSITION_CODE_NAME}
						placeholder="Postion ID or Number" />

					<RequiredField id="name" label="Position Name" placeholder="Name/Description of Position"/>

					{position.type !== Position.TYPE.PRINCIPAL &&
						<Form.Field id="permissions">
							<ButtonToggleGroup>
								<Button id="permsAdvisorButton" value={Position.TYPE.ADVISOR}>{Settings.fields.advisor.position.type}</Button>
								{isAdmin &&
									<Button id="permsSuperUserButton" value={Position.TYPE.SUPER_USER}>{Settings.fields.superUser.position.type}</Button>
								}
								{isAdmin &&
									<Button id="permsAdminButton" value={Position.TYPE.ADMINISTRATOR}>{Settings.fields.administrator.position.type}</Button>
								}
							</ButtonToggleGroup>
						</Form.Field>
					}

				</Fieldset>

				<Fieldset title="Additional information">
					<Form.Field id="location">
						<Autocomplete
							objectType={Location}
							valueKey="name"
							fields={Location.autocompleteQuery}
							placeholder="Start typing to find a location where this Position will operate from..."
							queryParams={{status: Location.STATUS.ACTIVE}}
						/>
					</Form.Field>
				</Fieldset>
			</ValidatableForm>
			</div>
		)
	}

	@autobind
	onChange() {
		this.setState({
			errors : this.validatePosition(),
			isBlocking: this.formHasUnsavedChanges(this.props.position, this.props.original),
		})
	}

	@autobind
	validatePosition() {
		let position = this.props.position
		let errors = this.state.errors
		if (position.organization && (typeof position.organization !== 'object')) {
			errors.organization = 'error'
		} else {
			delete errors.organization
		}

		return errors
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
		position.location = utils.getReference(position.location)
		position.organization = utils.getReference(position.organization)
		position.person = utils.getReference(position.person)
		position.code = position.code || null //Need to null out empty position codes

		const operation = edit ? 'updatePosition' : 'createPosition'
		let graphql = operation + '(position: $position)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { position: position }
		const variableDef = '($position: PositionInput!)'
		this.setState({isBlocking: false})
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				if (data[operation].uuid) {
					position.uuid = data[operation].uuid
				}
				this.props.history.replace(Position.pathForEdit(position))
				this.props.history.push({
					pathname: Position.pathFor(position),
					state: {
						success: 'Position saved',
					}
				})
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
	}

}

const PositionForm = (props) => (
	<AppContext.Consumer>
		{context =>
			<BasePositionForm currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(PositionForm)
