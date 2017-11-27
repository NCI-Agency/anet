import React, {PropTypes} from 'react'
import autobind from 'autobind-decorator'

import {Button} from 'react-bootstrap'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Fieldset from 'components/Fieldset'
import Autocomplete from 'components/Autocomplete'
import Form from 'components/Form'
import History from 'components/History'
import Messages from'components/Messages'
import ButtonToggleGroup from 'components/ButtonToggleGroup'

import dict from 'dictionary'
import API from 'api'
import {Poam, Position} from 'models'

export default class PoamForm extends ValidatableFormWrapper {
	static propTypes = {
		poam: PropTypes.object.isRequired,
		edit: PropTypes.bool,
	}

	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		let {poam, edit} = this.props
		let {currentUser} = this.context.app.state
		let poamShortTitle = dict.lookup('POAM_SHORT_NAME')

		let orgSearchQuery = {}
		orgSearchQuery.type = 'ADVISOR_ORG'
		if (currentUser && currentUser.position && currentUser.position.type === Position.TYPE.SUPER_USER) {
			orgSearchQuery.parentOrgId = currentUser.position.organization.id
			orgSearchQuery.parentOrgRecursively = true
		}


		const {ValidatableForm, RequiredField} = this
		return (
			<div>
				<Messages error={this.state.error} success={this.state.success} />

				<ValidatableForm
					formFor={poam}
					onChange={this.onChange}
					onSubmit={this.onSubmit}
					submitText={`Save ${poamShortTitle}`}
					horizontal>

					<Fieldset title={edit ?
						`Edit ${poamShortTitle} ${poam.shortName}`
						:
						`Create a new ${poamShortTitle}`
					}>
						<RequiredField id="shortName" label={`${poamShortTitle} number`} />
						<RequiredField id="longName" label={`${poamShortTitle} description`} />

						<Form.Field id="status" >
							<ButtonToggleGroup>
								<Button id="statusActiveButton" value="ACTIVE">Active</Button>
								<Button id="statusInactiveButton" value="INACTIVE">Inactive</Button>
							</ButtonToggleGroup>
						</Form.Field>

						<Form.Field id="responsibleOrg" label="Responsible organization">
							<Autocomplete valueKey="shortName"
								placeholder={`Select a responsible organization for this ${poamShortTitle}`}
								url="/api/organizations/search"
								queryParams={orgSearchQuery}
							/>
						</Form.Field>
					</Fieldset>
				</ValidatableForm>
			</div>
		)
	}

	@autobind
	onChange() {
		this.forceUpdate()
	}

	@autobind
	onSubmit(event) {
		let {poam, edit} = this.props
		if (poam.responsibleOrg && poam.responsibleOrg.id) {
			poam.responsibleOrg = {id: poam.responsibleOrg.id}
		}

		let url = `/api/poams/${edit ? 'update' : 'new'}`
		API.send(url, poam, {disableSubmits: true})
			.then(response => {
				if (response.code) {
					throw response.code
				}

				if (response.id) {
					poam.id = response.id
				}

				History.replace(Poam.pathForEdit(poam), false)
				History.push(Poam.pathFor(poam), {success: 'Saved successfully', skipPageLeaveWarning: true})
			}).catch(error => {
				this.setState({error: error})
				window.scrollTo(0, 0)
			})
	}
}
