import PropTypes from 'prop-types'
import React from 'react'
import {Button} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import Messages from 'components/Messages'
import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import PositionsSelector from 'components/PositionsSelector'
import { jumpToTop } from 'components/Page'

import API from 'api'
import {AuthorizationGroup, Position} from 'models'

import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'

class AuthorizationGroupForm extends ValidatableFormWrapper {
	static propTypes = {
		authorizationGroup: PropTypes.object.isRequired,
		original: PropTypes.object.isRequired,
		edit: PropTypes.bool
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
		let {errors} = this.state
		let authorizationGroup = this.props.authorizationGroup
		let edit = this.props.edit

		const {ValidatableForm, RequiredField} = this
		return (
			<div>
				<NavigationWarning isBlocking={this.state.isBlocking} />

				<Messages success={this.state.success} error={this.state.error} />

				<ValidatableForm formFor={authorizationGroup} onChange={this.onChange} onSubmit={this.onSubmit} horizontal submitText="Save authorization group">
					{this.state.error && <fieldset><p>There was a problem saving this authorization group</p><p>{this.state.error}</p></fieldset>}

					<Fieldset title={edit ? `Edit authorization group ${authorizationGroup.name}` : "Create new authorization group"}>
						<RequiredField id="name" />
						<RequiredField id="description" componentClass="textarea" maxCharacters={250}
							canSubmitWithError={true}
							validateBeforeUserTouches={this.props.edit}>
							<Form.Field.ExtraCol>{250 - authorizationGroup.description.length} characters remaining</Form.Field.ExtraCol>
						</RequiredField>
						<Form.Field id="status" >
							<ButtonToggleGroup>
								<Button id="statusActiveButton" value={ AuthorizationGroup.STATUS.ACTIVE }>Active</Button>
								<Button id="statusInactiveButton" value={ AuthorizationGroup.STATUS.INACTIVE }>Inactive</Button>
							</ButtonToggleGroup>
						</Form.Field>
						<PositionsSelector
							positions={authorizationGroup.positions}
							queryParams={{status: Position.STATUS.ACTIVE, type: [Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR]}}
							onChange={this.onChange}
							onErrorChange={this.onPositonError}
							validationState={errors.positions} />
					</Fieldset>
				</ValidatableForm>
			</div>
		)
	}
	@autobind
	onPositonError(isError, message) {
		let errors = this.state.errors
		if (isError) {
			errors.positions = 'error'
		} else {
			delete errors.positions
		}
		this.setState({errors})
	}

	@autobind
	onChange() {
		this.setState({
			isBlocking: this.formHasUnsavedChanges(this.props.authorizationGroup, this.props.original),
		})
	}

	@autobind
	onSubmit(event) {
		let authGroup = this.props.authorizationGroup
		let edit = this.props.edit
		const operation = edit ? 'updateAuthorizationGroup' : 'createAuthorizationGroup'
		let graphql = operation + '(authorizationGroup: $authorizationGroup)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { authorizationGroup: authGroup }
		const variableDef = '($authorizationGroup: AuthorizationGroupInput!)'
		this.setState({isBlocking: false})
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				if (data[operation].uuid) {
					authGroup.uuid = data[operation].uuid
				}
				this.props.history.replace(AuthorizationGroup.pathForEdit(authGroup))
				this.props.history.push({
					pathname: AuthorizationGroup.pathFor(authGroup),
					state: {
						success: 'Authorization group saved',
					}
				})
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
	}

}

export default withRouter(AuthorizationGroupForm)
