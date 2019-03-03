import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {Button, HelpBlock} from 'react-bootstrap'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import Fieldset from 'components/Fieldset'
import Autocomplete from 'components/Autocomplete'
import Messages from 'components/Messages'

import {Location, Organization, Person, Position} from 'models'
import API, {Settings} from 'api'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import LinkTo from 'components/LinkTo'
import { jumpToTop } from 'components/Page'
import DictionaryField from 'HOC/DictionaryField'
import utils from 'utils'

import LOCATIONS_ICON from 'resources/locations.png'
import ORGANIZATIONS_ICON from 'resources/organizations.png'
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
			label: Settings.fields.advisor.position.name,
		},
		{
			id: 'typePrincipalButton',
			value: Position.TYPE.PRINCIPAL,
			label: Settings.fields.principal.position.name
		},
	]
	nonAdminPermissionsButtons = [
		{
			id: 'permsAdvisorButton',
			value: Position.TYPE.ADVISOR,
			label: Settings.fields.advisor.position.type,
		},
	]
	adminPermissionsButtons = this.nonAdminPermissionsButtons.concat([
		{
			id: 'permsSuperUserButton',
			value: Position.TYPE.SUPER_USER,
			label: Settings.fields.superUser.position.type,
		},
		{
			id: 'permsAdminButton',
			value: Position.TYPE.ADMINISTRATOR,
			label: Settings.fields.administrator.position.type,
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
				const positionSettings = isPrincipal ? Settings.fields.principal.position : Settings.fields.advisor.position

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
								addon={ORGANIZATIONS_ICON}
								widget={
									<Autocomplete
										objectType={Organization}
										valueKey="shortName"
										fields={Organization.autocompleteQuery}
										placeholder="Select the organization for this position"
										queryParams={orgSearchQuery}
										template={Organization.autocompleteTemplate}
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
								label={Settings.fields.position.name}
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
								addon={LOCATIONS_ICON}
								widget={
									<Autocomplete
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
