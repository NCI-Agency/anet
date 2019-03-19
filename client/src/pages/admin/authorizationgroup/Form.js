import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {Button} from 'react-bootstrap'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

import AdvancedMultiSelect from 'components/AdvancedMultiSelect'
import Fieldset from 'components/Fieldset'
import LinkTo from 'components/LinkTo'
import Messages from 'components/Messages'
import PositionTable from 'components/PositionTable'
import { jumpToTop } from 'components/Page'

import API from 'api'
import {AuthorizationGroup, Position} from 'models'

import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'

import POSITIONS_ICON from 'resources/positions.png'

class AuthorizationGroupForm extends Component {
	static propTypes = {
		initialValues: PropTypes.object.isRequired,
		title: PropTypes.string,
		edit: PropTypes.bool,
	}

	static defaultProps = {
		initialValues: new AuthorizationGroup(),
		title: '',
		edit: false,
	}

	statusButtons = [
		{
			id: 'statusActiveButton',
			value: AuthorizationGroup.STATUS.ACTIVE,
			label: 'Active',
		},
		{
			id: 'statusInactiveButton',
			value: AuthorizationGroup.STATUS.INACTIVE,
			label: 'Inactive'
		},
	]
	state = {
		error: null,
	}

	render() {
		const { edit, title, ...myFormProps } = this.props

		return (
			<Formik
				enableReinitialize={true}
				onSubmit={this.onSubmit}
				validationSchema={AuthorizationGroup.yupSchema}
				isInitialValid={() => AuthorizationGroup.yupSchema.isValidSync(this.props.initialValues)}
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
				const positionsFilters = {
					allAdvisorPositions: {
						label: 'All advisor positions',
						searchQuery: true,
						queryVars: {type: Position.TYPE.ADVISOR, matchPersonName: true},
					}
				}
				const action = <div>
					<Button key="submit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save Authorization Group</Button>
				</div>
				return <div>
					<NavigationWarning isBlocking={dirty} />
					<Messages error={this.state.error} />
					<Form className="form-horizontal" method="post">
						<Fieldset title={title} action={action} />
						<Fieldset>
							<Field
								name="name"
								component={FieldHelper.renderInputField}
							/>

							<Field
								name="description"
								component={FieldHelper.renderInputField}
								componentClass="textarea"
								maxLength={250}
								onKeyUp={(event) => this.countCharsLeft('descriptionCharsLeft', 250, event)}
								extraColElem={<React.Fragment><span id="descriptionCharsLeft">{250 - this.props.initialValues.description.length}</span> characters remaining</React.Fragment>}
							/>

							<Field
								name="status"
								component={FieldHelper.renderButtonToggleGroup}
								buttons={this.statusButtons}
							/>

							<AdvancedMultiSelect
								fieldName="positions"
								fieldLabel="Positions"
								placeholder="Search for a position..."
								selectedItems={values.positions}
								renderSelected={<PositionTable positions={values.positions} showDelete={true} />}
								overlayColumns={['', 'Name', 'Position']}
								overlayRenderRow={this.renderPositionOverlayRow}
								filterDefs={positionsFilters}
								onChange={value => setFieldValue('positions', value)}
								objectType={Position}
								queryParams={{status: Position.STATUS.ACTIVE, type: [Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR]}}
								fields={Position.autocompleteQuery}
								addon={POSITIONS_ICON}
							/>
						</Fieldset>

						<div className="submit-buttons">
							<div>
								<Button onClick={this.onCancel}>Cancel</Button>
							</div>
							<div>
								<Button id="formBottomSubmit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save Authorization Group</Button>
							</div>
						</div>
					</Form>
				</div>
			}}
			</Formik>
		)
	}

	countCharsLeft = (elemId, maxChars, event) => {
		// update the number of characters left
		const charsLeftElem = document.getElementById(elemId)
		charsLeftElem.innerHTML = maxChars - event.target.value.length
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
		const operation = edit ? 'updateAuthorizationGroup' : 'createAuthorizationGroup'
		const authGroup = new AuthorizationGroup({uuid: (response[operation].uuid ? response[operation].uuid : this.props.initialValues.uuid)})
		// After successful submit, reset the form in order to make sure the dirty
		// prop is also reset (otherwise we would get a blocking navigation warning)
		form.resetForm()
		this.props.history.replace(AuthorizationGroup.pathForEdit(authGroup))
		this.props.history.push({
			pathname: AuthorizationGroup.pathFor(authGroup),
			state: {
				success: 'Authorization Group saved',
			}
		})
	}

	save = (values, form) => {
		const authGroup = new AuthorizationGroup(values)
		const { edit } = this.props
		const operation = edit ? 'updateAuthorizationGroup' : 'createAuthorizationGroup'
		let graphql = operation + '(authorizationGroup: $authorizationGroup)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { authorizationGroup: authGroup }
		const variableDef = '($authorizationGroup: AuthorizationGroupInput!)'
		return API.mutation(graphql, variables, variableDef)
	}

	renderPositionOverlayRow = (item) => {
		return (
			<React.Fragment key={item.uuid}>
				<td><LinkTo person={item.person} target="_blank" /></td>
				<td><LinkTo position={item} target="_blank" /></td>
			</React.Fragment>
		)
	}

}

export default withRouter(AuthorizationGroupForm)
