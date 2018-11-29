import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {Button, HelpBlock} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import Fieldset from 'components/Fieldset'
import NewAutocomplete from 'components/NewAutocomplete'
import Messages from 'components/Messages'

import API from 'api'
import {Location, Organization, Person, Position} from 'models'
import * as PositionDefs from 'models/Position'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import LinkTo from 'components/LinkTo'
import { jumpToTop } from 'components/Page'
import DictionaryField from 'HOC/DictionaryField'
import utils from 'utils'

import LOCATION_ICON from 'resources/locations.png'
import ORGANIZATION_ICON from 'resources/organizations.png'
import WARNING_ICON from 'resources/warning.png'

class BasePositionForm extends Component {
	static propTypes = {
		initialValues: PropTypes.object.isRequired,
		title: PropTypes.string,
		edit: PropTypes.bool,
		currentUser: PropTypes.instanceOf(Person),
	}

	static defaultProps = {
		initialValues: new Position(),
		title: '',
		edit: false,
	}

	statusButtons = [
		{
			id: 'statusActiveButton',
			value: Position.STATUS.ACTIVE,
			label: 'Active',
		},
		{
			id: 'statusInactiveButton',
			value: Position.STATUS.INACTIVE,
			label: 'Inactive'
		},
	]
	typeButtons = [
		{
			id: 'typeAdvisorButton',
			value: Position.TYPE.ADVISOR,
			label: PositionDefs.advisorPosition.name,
		},
		{
			id: 'typePrincipalButton',
			value: Position.TYPE.PRINCIPAL,
			label: PositionDefs.principalPosition.name
		},
	]
	nonAdminPermissionsButtons = [
		{
			id: 'permsAdvisorButton',
			value: Position.TYPE.ADVISOR,
			label: PositionDefs.advisorPosition.type,
		},
	]
	adminPermissionsButtons = this.nonAdminPermissionsButtons.concat([
		{
			id: 'permsSuperUserButton',
			value: Position.TYPE.SUPER_USER,
			label: PositionDefs.superUserPosition.type,
		},
		{
			id: 'permsAdminButton',
			value: Position.TYPE.ADMINISTRATOR,
			label: PositionDefs.administratorPosition.type,
		},
	])
	CodeFieldWithLabel = DictionaryField(Field)
	state = {
		error: null,
	}

	render() {
		const { currentUser, edit, title, ...myFormProps } = this.props
		const { initialValues } = myFormProps
		// For advisor types of positions, add permissions property.
		// The permissions property allows selecting a
		// specific advisor type and is removed in the onSubmit method.
		if ([Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR].includes(initialValues.type)) {
			initialValues.permissions = initialValues.type
		}

		return (
			<Formik
				enableReinitialize={true}
				onSubmit={this.onSubmit}
				validationSchema={Position.yupSchema}
				isInitialValid={() => Position.yupSchema.isValidSync(this.props.initialValues)}
				{...myFormProps}
			>
			{({
				handleSubmit,
				isSubmitting,
				isValid,
				dirty,
				errors,
				setFieldValue,
				values,
				submitForm
			}) => {
				const isPrincipal = values.type === Position.TYPE.PRINCIPAL
				const positionSettings = isPrincipal ? PositionDefs.principalPosition : PositionDefs.advisorPosition

				const isAdmin = currentUser && currentUser.isAdmin()
				const permissionsButtons = isAdmin ? this.adminPermissionsButtons : this.nonAdminPermissionsButtons

				const orgSearchQuery = {status: Organization.STATUS.ACTIVE}
				if (isPrincipal) {
					orgSearchQuery.type = Organization.TYPE.PRINCIPAL_ORG
				} else {
					orgSearchQuery.type = Organization.TYPE.ADVISOR_ORG
					if (currentUser && currentUser.position && currentUser.position.type === Position.TYPE.SUPER_USER) {
						orgSearchQuery.parentOrgUuid = currentUser.position.organization.uuid
						orgSearchQuery.parentOrgRecursively = true
					}
				}
				// Reset the organization property when changing the organization type
				if (values.organization && values.organization.type && (values.organization.type !== orgSearchQuery.type)) {
					values.organization = {}
				}
				const willAutoKickPerson = values.status === Position.STATUS.INACTIVE && values.person && values.person.uuid
				const action = <div>
					<Button key="submit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save Position</Button>
				</div>
				return <div>
					<NavigationWarning isBlocking={dirty} />
					<Messages error={this.state.error} />
					<Form className="form-horizontal" method="post">
						<Fieldset title={title} action={action} />
						<Fieldset>
							{this.props.edit
								? <Field
									name="type"
									component={FieldHelper.renderReadonlyField}
									humanValue={Position.humanNameOfType}
								/>
								: <Field
									name="type"
									component={FieldHelper.renderButtonToggleGroup}
									buttons={this.typeButtons}
								/>
							}

							<Field
								name="status"
								component={FieldHelper.renderButtonToggleGroup}
								buttons={this.statusButtons}
							>
								{willAutoKickPerson &&
									<HelpBlock>
										<span className="text-danger">Setting this position to inactive will automatically remove <LinkTo person={values.person}/> from this position.</span>
									</HelpBlock>
								}
							</Field>

							<Field
								name="organization"
								component={FieldHelper.renderSpecialField}
								onChange={value => setFieldValue('organization', value)}
								addon={ORGANIZATION_ICON}
								widget={
									<NewAutocomplete
										objectType={Organization}
										valueKey="shortName"
										fields={Organization.autocompleteQuery}
										placeholder="Select the organization for this position"
										queryParams={orgSearchQuery}
										template={org => <span>{org.shortName} - {org.longName} {org.identificationCode}</span>}
									/>
								}
							/>

							<this.CodeFieldWithLabel
								dictProps={positionSettings.code}
								name="code"
								component={FieldHelper.renderInputField}
							/>

							<Field
								name="name"
								component={FieldHelper.renderInputField}
								label={PositionDefs.fieldLabels.name}
								placeholder="Name/Description of Position"
							/>

							{!isPrincipal &&
								<Field
									name="permissions"
									component={FieldHelper.renderButtonToggleGroup}
									buttons={permissionsButtons}
								/>
							}
						</Fieldset>

						<Fieldset title="Additional information">
							<Field
								name="location"
								component={FieldHelper.renderSpecialField}
								onChange={value => setFieldValue('location', value)}
								addon={LOCATION_ICON}
								widget={
									<NewAutocomplete
										objectType={Location}
										valueKey="name"
										fields={Location.autocompleteQuery}
										placeholder="Start typing to find a location where this Position will operate from..."
										queryParams={{status: Location.STATUS.ACTIVE}}
									/>
								}
							/>
						</Fieldset>

						<div className="submit-buttons">
							<div>
								<Button onClick={this.onCancel}>Cancel</Button>
							</div>
							<div>
								<Button id="formBottomSubmit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save Position</Button>
							</div>
						</div>
					</Form>
				</div>
			}}
			</Formik>
		)
	}

	onCancel = () => {
		this.props.history.goBack()
	}

	onSubmit = (values, form) => {
		return this.save(values, form)
			.then(response => this.onSubmitSuccess(response, values, form))
			.catch(error => {
				this.setState({error})
				jumpToTop()
			})
	}

	onSubmitSuccess = (response, values, form) => {
		const { edit } = this.props
		const operation = edit ? 'updatePosition' : 'createPosition'
		const position = new Position({uuid: (response[operation].uuid ? response[operation].uuid : this.props.initialValues.uuid)})
		// After successful submit, reset the form in order to make sure the dirty
		// prop is also reset (otherwise we would get a blocking navigation warning)
		form.resetForm()
		this.props.history.replace(Position.pathForEdit(position))
		this.props.history.push({
			pathname: Position.pathFor(position),
			state: {
				success: 'Position saved',
			}
		})
	}

	save = (values, form) => {
		const position = new Position(values)
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
		const { edit } = this.props
		const operation = edit ? 'updatePosition' : 'createPosition'
		let graphql = operation + '(position: $position)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { position: position }
		const variableDef = '($position: PositionInput!)'
		return API.mutation(graphql, variables, variableDef)
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
