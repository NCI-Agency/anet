import PropTypes from 'prop-types'
import React from 'react'
import {Button, Alert, HelpBlock, Radio, Col, ControlLabel, FormGroup} from 'react-bootstrap'
import DatePicker from 'react-16-bootstrap-date-picker'
import autobind from 'autobind-decorator'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Form from 'components/Form'
import Fieldset from 'components/Fieldset'
import Messages from 'components/Messages'
import RichTextEditor from 'components/RichTextEditor'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import OptionListModal from 'components/OptionListModal'

import API from 'api'
import Settings from 'Settings'
import {Person} from 'models'
import utils from 'utils'
import pluralize from 'pluralize'

import CALENDAR_ICON from 'resources/calendar.png'
import 'components/NameInput.css'

import TriggerableConfirm from 'components/TriggerableConfirm'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'
import { jumpToTop } from 'components/Page'
import _isEmpty from 'lodash/isEmpty'

class BasePersonForm extends ValidatableFormWrapper {
	static propTypes = {
		person: PropTypes.object.isRequired,
		original: PropTypes.object.isRequired,
		edit: PropTypes.bool,
		legendText: PropTypes.string,
		saveText: PropTypes.string,
		currentUser: PropTypes.instanceOf(Person),
		loadAppData: PropTypes.func,
	}

	constructor(props) {
		super(props)
		const { person } = props
		const splitName = Person.parseFullName(person.name)
		this.state = {
			success: null,
			error: null,
			isBlocking: false,
			fullName: Person.fullName(splitName),
			splitName: splitName,
			originalStatus: person.status,
			showWrongPersonModal: false,
			wrongPersonOptionValue: null,
		}
	}

	componentDidUpdate(prevProps, prevState) {
		const { person } = this.props
		const prevPerson = prevProps.person
		if (person.uuid !== prevPerson.uuid) {
			const splitName = Person.parseFullName(person.name)
			this.setState({
				fullName: Person.fullName(splitName),
				splitName: splitName,
				originalStatus: person.status,
			})
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
		const { person } = this.props
		if (!person) return null
		const { edit } = this.props
		const isAdvisor = person.isAdvisor()
		const { fullName } = this.state
		const legendText = this.props.legendText || (edit ? `Edit Person ${fullName}` : 'Create a new Person')

		const {ValidatableForm, RequiredField} = this

		const willAutoKickPosition = person.status === Person.STATUS.INACTIVE && person.position && !!person.position.uuid
		const warnDomainUsername = person.status === Person.STATUS.INACTIVE && !_isEmpty(person.domainUsername)
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
			placeholder: "First name(s) - Lower-case except for the first letter of each name",
			value: this.state.splitName.firstName,
			onChange: this.handleOnChangeFirstName
		}

		const { currentUser } = this.props
		const isAdmin = currentUser && currentUser.isAdmin()
		const isSelf = Person.isEqual(currentUser, person)
		const disableStatusChange = this.state.originalStatus === Person.STATUS.INACTIVE || isSelf
		// admins can edit all persons, new users can be edited by super users or themselves
		const canEditName = isAdmin || (
				(person.isNewUser() || !edit) && currentUser && (
						currentUser.isSuperUser() ||
						isSelf
				)
			)
		const nameMessage = "This is not " + (isSelf ? "me" : fullName)
		const modalTitle = `It is possible that the information of ${fullName} is out of date. Please help us identify if any of the following is the case:`

		const confirmLabel = this.state.wrongPersonOptionValue === 'needNewAccount'
				? 'Yes, I would like to inactivate my predecessor\'s account and set up a new one for myself'
				: 'Yes, I would like to inactivate this account'
		const advisorSingular = Settings.fields.advisor.person.name
		const advisorPlural = pluralize(advisorSingular)
		const superUserAdvisorTitle = isAdmin ? null : `Super users cannot create ${advisorSingular} profiles. ANET uses the domain user name to authenticate and uniquely identify each ANET user. To ensure that ${advisorPlural} have the correct domain name associated with their profile, it is required that each new ${advisorSingular} individually logs into ANET and creates their own ANET profile.`

		return <div>
			<NavigationWarning isBlocking={this.state.isBlocking} />

			<ValidatableForm formFor={person} onChange={this.onChange} onSubmit={this.onSubmit} horizontal
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
								value={this.state.splitName.lastName}
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
							<TriggerableConfirm
								onConfirm={this.confirmReset.bind(this)}
								title="Confirm to reset account"
								body="Are you sure you want to reset this account?"
								confirmText={confirmLabel}
								cancelText="No, I am not entirely sure at this point"
								bsStyle="warning"
								buttonLabel="Reset account"
								className="hidden"
								ref={confirmComponent => this.confirmHasReplacementButton = confirmComponent} />
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

				{isAdmin &&
					<Form.Field id="domainUsername">
						<Form.Field.ExtraCol>
							<span className="text-danger">Be careful when changing this field; you might lock someone out or create duplicate accounts.</span>
						</Form.Field.ExtraCol>
					</Form.Field>
				}

				{edit ?
					<Form.Field type="static" id="role" value={person.humanNameOfRole()} />
					:
					<Form.Field id="role">
						<ButtonToggleGroup>
							<Button id="roleAdvisorButton" disabled={!isAdmin} title={superUserAdvisorTitle} value={Person.ROLE.ADVISOR}>{Settings.fields.advisor.person.name}</Button>
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
								<Button id="statusActiveButton" value={ Person.STATUS.ACTIVE }>Active</Button>
								<Button id="statusInactiveButton" value={ Person.STATUS.INACTIVE }>Inactive</Button>
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

				<RequiredField  id="endOfTourDate" label="End of tour" addon={CALENDAR_ICON} required={isAdvisor} addOnBlur={true}>
					<DatePicker placeholder="End of Tour Date" dateFormat="DD/MM/YYYY" showClearButton={false} />
				</RequiredField>

				<Form.Field id="biography" componentClass={RichTextEditor} className="biography" />
			</Fieldset>
		</ValidatableForm>
		</div>
	}

	getFullName(splitName, editName) {
		if (editName.lastName !== undefined) { splitName.lastName = editName.lastName }
		if (editName.firstName !== undefined) { splitName.firstName = editName.firstName }

		return Person.fullName(splitName)
	}

	handleOnKeyDown = (event) => {
		if (event.key === ',') {
			event.preventDefault()
			document.getElementById('firstName').focus()
		}
	}

	handleOnChangeLastName = (event) => {
		const value = event.target.value
		const { splitName } = this.state
		this.setState({
			fullName: this.getFullName(splitName, { lastName: value }),
			splitName: splitName
		})
	}

	handleOnChangeFirstName = (event) => {
		const value = event.target.value
		const { splitName } = this.state
		this.setState({
			fullName: this.getFullName(splitName, { firstName: value }),
			splitName: splitName
		})
	}

	@autobind
	onChange() {
		const person = Object.without(this.props.person, 'firstName', 'lastName')
		this.setState({
			isBlocking: this.formHasUnsavedChanges(person, this.props.original),
		})
	}

	@autobind
	handleEmailValidation(value) {
		return utils.handleEmailValidation(value, this.props.person.isAdvisor())
	}

	@autobind
	onSubmit(event) {
		const { edit, person } = this.props
		let isFirstTimeUser = false
		if (person.isNewUser()) {
			isFirstTimeUser = true
			person.status = Person.STATUS.ACTIVE
		}
		this.updatePerson(person, edit, isFirstTimeUser)
	}

	@autobind
	updatePerson(person, edit, isNew) {
		// Clean up person object for JSON response
		person = Object.without(person, 'firstName', 'lastName')
		person.name = Person.fullName(this.state.splitName, true)
		const operation = edit ? 'updatePerson' : 'createPerson'
		let graphql = operation + '(person: $person)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { person: person }
		const variableDef = '($person: PersonInput!)'
		this.setState({isBlocking: false})
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				if (isNew) {
					localStorage.clear()
					localStorage.newUser = 'true'
					this.props.loadAppData()
					this.props.history.push({
						pathname: '/',
					})
				} else {
					if (data[operation].uuid) {
						person.uuid = data[operation].uuid
					}
					this.props.history.replace(Person.pathForEdit(person))
					this.props.history.push({
						pathname: Person.pathFor(person),
						state: {
							success: 'Person saved',
						}
					})
				}
			}).catch(error => {
				this.setState({success: null, error: error})
				jumpToTop()
			})
	}

	@autobind
	showWrongPersonModal() {
		this.setState({showWrongPersonModal: true})
	}

	@autobind
	confirmReset() {
		const { person } = this.props
		person.status = Person.STATUS.INACTIVE
		this.updatePerson(person, true, this.state.wrongPersonOptionValue === 'needNewAccount')
	}

	@autobind
	hideWrongPersonModal(optionValue) {
		this.setState({showWrongPersonModal: false, wrongPersonOptionValue: optionValue})
		if (optionValue) {
			// do something useful with optionValue
			switch (optionValue) {
				case 'needNewAccount':
				case 'leftVacant':
				case 'hasReplacement':
					// reset account?
					this.confirmHasReplacementButton.buttonRef.props.onClick()
					break
				default:
					// TODO: integrate action to email admin
					alert("Please contact your administrator " + Settings.SUPPORT_EMAIL_ADDR)
					break
			}
		}
	}
}

const PersonForm = (props) => (
	<AppContext.Consumer>
		{context =>
			<BasePersonForm currentUser={context.currentUser} loadAppData={context.loadAppData} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(PersonForm)
