import PropTypes from 'prop-types'
import React from 'react'
import {Button, Alert, HelpBlock, Radio, Col, ControlLabel, FormGroup} from 'react-bootstrap'
import DatePicker from 'react-bootstrap-date-picker'
import autobind from 'autobind-decorator'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Form from 'components/Form'
import Fieldset from 'components/Fieldset'
import Messages from 'components/Messages'
import TextEditor from 'components/TextEditor'
import History from 'components/History'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import OptionListModal from 'components/OptionListModal'

import API from 'api'
import Settings from 'Settings'
import {Person} from 'models'
import utils from 'utils'

import CALENDAR_ICON from 'resources/calendar.png'
import '../../components/NameInput.css'

import { confirmAlert } from 'react-confirm-alert'
import 'react-confirm-alert/src/react-confirm-alert.css'

export default class PersonForm extends ValidatableFormWrapper {
	static propTypes = {
		person: PropTypes.object.isRequired,
		edit: PropTypes.bool,
		legendText: PropTypes.string,
		saveText: PropTypes.string,
	}

	static contextTypes = {
		app: PropTypes.object.isRequired,
		currentUser: PropTypes.object.isRequired,
	}

	constructor(props) {
		super(props)
		this.state = {
			person: null,
			error: null,
			originalStatus: props.person.status,
			showWrongPersonModal: false,
		}
	}

	countries = person => {
		switch(person.role) {
			case Person.ROLE.ADVISOR:
				return Settings.fields.advisor.person.countries
			case Person.ROLE.PRINCIPAL:
				return Settings.fields.principal.person.countries
			default:
				return []
		}
	}

	renderCountrySelectOptions = (countries) => {
		return countries.map(country =>
			<option key={country} value={country}>{country}</option>
		)
	}

	render() {
		if (this.state.person === null) return null
		const { person } = this.state
		const { edit } = this.props
		const isAdvisor = person.isAdvisor()
		const legendText = this.props.legendText || (edit ? `Edit Person ${person.name}` : 'Create a new Person')

		const {ValidatableForm, RequiredField} = this

		const willAutoKickPosition = person.status === 'INACTIVE' && person.position && !!person.position.id
		const warnDomainUsername = person.status === 'INACTIVE' && person.domainUsername
		const ranks = Settings.fields.person.ranks || []

		const countries = this.countries(person)
		if (!edit && countries.length === 1) {
			// For new objects, assign default country if there's only one
			person.country = countries[0]
		}
		const firstNameProps = {
			id: "firstName",
			type: "text",
			display: "inline",
			placeholder: "First name(s)",
			onChange: this.handleOnChangeFirstName
		}

		const currentUser = this.context.currentUser
		const isAdmin = currentUser && currentUser.isAdmin()
		const isSelf = Person.isEqual(currentUser, person)
		const disableStatusChange = this.state.originalStatus === 'INACTIVE' || isSelf
		// admins can edit all persons, new users can be edited by super users or themselves
		const canEditName = isAdmin || (
				(person.isNewUser() || !edit) && currentUser && (
						currentUser.isSuperUser() ||
						isSelf
				)
			)
		const fullName = Person.fullName(this.state.person)
		const nameMessage = "This is not " + (isSelf ? "me" : fullName)
		const modalTitle = `It is possible that the information of ${fullName} is out of date. Please help us identify if any of the following is the case:`

		return <ValidatableForm formFor={person} onChange={this.onChange} onSubmit={this.onSubmit} horizontal
			submitText={this.props.saveText || 'Save person'}>

			<Messages error={this.state.error} />

			<Fieldset title={legendText}>
				<FormGroup>
					<Col sm={2} componentClass={ControlLabel}>Name</Col>
					<Col sm={7}>
						<Col sm={5}>
							<RequiredField disabled={!canEditName}
								id="lastName"
								type="text"
								display="inline"
								placeholder="LAST NAME"
								onChange={this.handleOnChangeLastName}
								onKeyDown={this.handleOnKeyDown}
								/>
						</Col>
						<Col sm={1} className="name-input">,</Col>
						<Col sm={6}>
						{isAdvisor ?
							<RequiredField disabled={!canEditName} {...firstNameProps} />
							:
							<Form.Field disabled={!canEditName} {...firstNameProps} />
						}
						</Col>
						<RequiredField disabled={!canEditName} className="hidden" id="name" value={fullName} />
					</Col>

					{edit && !canEditName &&
						<div>
							<Button id="wrongPerson" onClick={this.showWrongPersonModal}>{nameMessage}</Button>

							<OptionListModal
								title={modalTitle}
								showModal={this.state.showWrongPersonModal}
								onCancel={this.hideWrongPersonModal.bind(this)}
								onSuccess={this.hideWrongPersonModal.bind(this)}>
								{(isSelf &&
									<div>
										<Radio name="wrongPerson" value="needNewAccount">
											<em>{fullName}</em> has left and is replaced by me. I need to set up a new account.
										</Radio>
										<Radio name="wrongPerson" value="haveAccount">
											<em>{fullName}</em> has left and is replaced by me. I already have an account.
										</Radio>
										<Radio name="wrongPerson" value="transferAccount">
											<em>{fullName}</em> is still active, but this should be my account.
										</Radio>
										<Radio name="wrongPerson" value="misspelledName">
											I am <em>{fullName}</em>, but my name is misspelled.
										</Radio>
										<Radio name="wrongPerson" value="otherError">
											Something else is wrong.
										</Radio>
									</div>
								) || (
									<div>
										<Radio name="wrongPerson" value="leftVacant">
											<em>{fullName}</em> has left and the position is vacant.
										</Radio>
										<Radio name="wrongPerson" value="hasReplacement">
											<em>{fullName}</em> has left and has a replacement.
										</Radio>
										<Radio name="wrongPerson" value="misspelledName">
											The name of <em>{fullName}</em> is misspelled.
										</Radio>
										<Radio name="wrongPerson" value="otherError">
											Something else is wrong.
										</Radio>
									</div>
								)}
							</OptionListModal>
						</div>
					}
				</FormGroup>

				{edit ?
					<Form.Field type="static" id="role" value={person.humanNameOfRole()} />
					:
					<Form.Field id="role">
						<ButtonToggleGroup>
							<Button id="roleAdvisorButton" disabled={!isAdmin} value={Person.ROLE.ADVISOR}>{Settings.fields.advisor.person.name}</Button>
							<Button id="rolePrincipalButton" value={Person.ROLE.PRINCIPAL}>{Settings.fields.principal.person.name}</Button>
						</ButtonToggleGroup>
					</Form.Field>
				}

				{disableStatusChange ?
					<Form.Field type="static" id="status" value={person.humanNameOfStatus()} />
					:
					person.isNewUser() ?
						<Form.Field type="static" id="status" value="New user" />
						:
						<Form.Field id="status" >
							<ButtonToggleGroup>
								<Button id="statusActiveButton" value="ACTIVE">Active</Button>
								<Button id="statusInactiveButton" value="INACTIVE">Inactive</Button>
							</ButtonToggleGroup>

							{willAutoKickPosition && <HelpBlock>
								<span className="text-danger">Settings this person to inactive will automatically remove them from the <strong>{person.position.name}</strong> position.</span>
							</HelpBlock> }

							{warnDomainUsername && <HelpBlock>
								<span className="text-danger">Settings this person to inactive means the next person to logon with the user name <strong>{person.domainUsername}</strong> will have to create a new profile. Do you want the next person to login with this user name to create a new profile?</span>
							</HelpBlock> }
						</Form.Field>
				}

				{!edit && isAdvisor &&
					<Alert bsStyle="warning">
						Creating a {Settings.fields.advisor.person.name} in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts, please contact an ANET administrator.
					</Alert>
				}
			</Fieldset>

			<Fieldset title="Additional information">
				<RequiredField id="emailAddress" label="Email" required={isAdvisor}
					humanName="Valid email address"
					type="email"
					validate={ this.handleEmailValidation } />
				<Form.Field id="phoneNumber" label="Phone" />
				<RequiredField id="rank"  componentClass="select"
					required={isAdvisor}>

					<option />
					{ranks.map(rank =>
						<option key={rank} value={rank}>{rank}</option>
					)}
				</RequiredField>

				<RequiredField id="gender" componentClass="select"
					required={isAdvisor}>
					<option />
					<option value="MALE" >Male</option>
					<option value="FEMALE" >Female</option>
				</RequiredField>

				<RequiredField id="country" label="Nationality" componentClass="select"
					required={isAdvisor}>
					<option />
					{this.renderCountrySelectOptions(countries)}
				</RequiredField>

				<Form.Field id="endOfTourDate" label="End of tour" addon={CALENDAR_ICON}>
					<DatePicker placeholder="End of Tour Date" dateFormat="DD/MM/YYYY" showClearButton={false} />
				</Form.Field>

				<Form.Field id="biography" componentClass={TextEditor} className="biography" />
			</Fieldset>
		</ValidatableForm>
	}

	componentWillReceiveProps(nextProps) {
		const { person } = nextProps
		const emptyName = { lastName: '', firstName: ''}

		const parsedName = person.name ? Person.parseFullName(person.name) : emptyName

		this.savePersonWithFullName(person, parsedName)
	}

	savePersonWithFullName(person, editName) {
		if (editName.lastName) { person.lastName = editName.lastName }
		if (editName.firstName) { person.firstName = editName.firstName }

		person.name = Person.fullName(person)
		this.setState({ person })
	}

	handleOnKeyDown = (event) => {
		if (event.key === ',') {
			event.preventDefault()
			document.getElementById('firstName').focus()
		}
	}

	handleOnChangeLastName = (event) => {
		const value = event.target.value
		const { person } = this.state

		this.savePersonWithFullName(person, { lastName: value })
	}

	handleOnChangeFirstName = (event) => {
		const value = event.target.value
		const { person } = this.state

		this.savePersonWithFullName(person, { firstName: value })
	}

	@autobind
	onChange() {
		this.forceUpdate()
	}

	@autobind
	handleEmailValidation(value) {
		return utils.handleEmailValidation(value, this.props.person.isAdvisor())
	}

	@autobind
	onSubmit(event) {
		const { edit } = this.props
		let { person } = this.state
		let isFirstTimeUser = false
		if (person.isNewUser()) {
			isFirstTimeUser = true
			person.status = 'ACTIVE'
		}
		this.updatePerson(person, edit, isFirstTimeUser)
	}

	@autobind
	updatePerson(person, edit, isNew) {
		// Clean up person object for JSON response
		person = Object.without(person, 'firstName', 'lastName')

		let url = `/api/people/${edit ? 'update' : 'new'}`
		API.send(url, person, {disableSubmits: true})
			.then(response => {
				if (response.code) {
					throw response.code
				}

				if (isNew) {
					localStorage.clear()
					localStorage.newUser = 'true'
					this.context.app.loadData()
					History.push('/', {skipPageLeaveWarning: true})
				} else {
					if (response.id) {
						person.id = response.id
					}

					History.replace(Person.pathForEdit(person), false)
					History.push(Person.pathFor(person), {success: 'Person saved successfully', skipPageLeaveWarning: true})
				}
			}).catch(error => {
				this.setState({error: error})
				window.scrollTo(0, 0)
			})
	}

	@autobind
	showWrongPersonModal() {
		this.setState({showWrongPersonModal: true})
	}

	@autobind
	hideWrongPersonModal(optionValue) {
		this.setState({showWrongPersonModal: false})
		if (optionValue) {
			// do something useful with optionValue
			switch (optionValue) {
				case 'needNewAccount':
				case 'leftVacant':
				case 'hasReplacement':
					// reset account?
					const confirmLabel = optionValue === 'needNewAccount'
						? 'Yes, I would like to inactivate my predecessor\'s account and set up a new one for myself'
						: 'Yes, I would like to inactivate this account'
					confirmAlert({
						title: 'Confirm to proceed',
						message: 'Are you sure you want to reset this account?',
						confirmLabel: confirmLabel,
						cancelLabel: 'I am not sure',
						onConfirm: () => {
							const { person } = this.state
							person.status = 'INACTIVE'
							this.updatePerson(person, true, optionValue === 'needNewAccount')
						}
					})
					break
				default:
					// TODO: integrate action to email admin
					alert("Please contact your administrator " + Settings.SUPPORT_EMAIL_ADDR)
					break
			}
		}
	}
}
