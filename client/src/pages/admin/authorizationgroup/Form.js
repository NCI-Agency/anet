import React, {PropTypes} from 'react'
import {Button} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Fieldset from 'components/Fieldset'
import History from 'components/History'
import Form from 'components/Form'
import Messages from 'components/Messages'
import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import PositionsSelector from 'components/PositionsSelector'

import API from 'api'
import {AuthorizationGroup} from 'models'

export default class AuthorizationGroupForm extends ValidatableFormWrapper {
	static propTypes = {
		authorizationGroup: PropTypes.object.isRequired,
		edit: PropTypes.bool
	}

	constructor(props) {
		super(props)

		this.state = {
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
		this.forceUpdate()
	}

	@autobind
	onSubmit(event) {
		let authGroup = this.props.authorizationGroup
		let edit = this.props.edit
		let url = `/api/authorizationGroups/${edit ? 'update'  :'new'}`
		API.send(url, authGroup, {disableSubmits: true})
			.then(response => {
				if (response.id) {
					authGroup.id = response.id
				}
				History.push(AuthorizationGroup.pathFor(authGroup), {success: 'Saved authorization group', skipPageLeaveWarning: true})
			}).catch(error => {
				this.setState({error: error})
				window.scrollTo(0, 0)
			})
	}

}
