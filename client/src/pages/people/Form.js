import React, {PropTypes} from 'react'
import {Button, Alert, HelpBlock} from 'react-bootstrap'
import DatePicker from 'react-bootstrap-date-picker'
import autobind from 'autobind-decorator'

import ValidatableFormWrapper from 'components/ValidatableFormWrapper'
import Form from 'components/Form'
import Fieldset from 'components/Fieldset'
import Messages from 'components/Messages'
import TextEditor from 'components/TextEditor'
import History from 'components/History'
import ButtonToggleGroup from 'components/ButtonToggleGroup'

import API from 'api'
import dict from 'dictionary'
import {Person} from 'models'

import CALENDAR_ICON from 'resources/calendar.png'

const ADVISOR = 'ADVISOR'
const PRINCIPAL = 'PRINCIPAL'

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
			error: null,
			originalStatus: props.person.status
		}
	}

	countries = person => {
		switch(person.role) {
			case ADVISOR:
				return this.lookupCountries('countries')
			case PRINCIPAL:
				return this.lookupCountries('principal_countries')
			default:
				return []
		}
	}

	lookupCountries = key => {
		return dict.lookup(key) || []
	}

	renderCountrySelectOptions = (countries) => {
		return countries.map(country =>
			<option key={country} value={country}>{country}</option>
		)
	}

	render() {
		let {person, edit} = this.props
		const isAdvisor = person.role === 'ADVISOR'
		const legendText = this.props.legendText || (edit ? `Edit Person ${person.name}` : 'Create a new Person')

		const {ValidatableForm, RequiredField} = this

		let willAutoKickPosition = person.status === 'INACTIVE' && person.position && !!person.position.id
		let warnDomainUsername = person.status === 'INACTIVE' && person.domainUsername
		let ranks = dict.lookup('ranks') || []

		const countries = this.countries(person)
		const nationalityDefaultValue = countries.length === 1 ? countries[0] : ''

		let currentUser = this.context.currentUser
		let isAdmin = currentUser && currentUser.isAdmin()
		let disableStatusChange = this.state.originalStatus === 'INACTIVE' || Person.isEqual(currentUser, person)

		return <ValidatableForm formFor={person} onChange={this.onChange} onSubmit={this.onSubmit} horizontal
			submitText={this.props.saveText || 'Save person'}>

			<Messages error={this.state.error} />

			<Fieldset title={legendText}>
				<RequiredField id="name" />

				{edit ?
					<Form.Field type="static" id="role" value={person.humanNameOfRole()} />
					:
					<Form.Field id="role">
						<ButtonToggleGroup>
							<Button id="roleAdvisorButton" disabled={!isAdmin} value="ADVISOR">{dict.lookup('ADVISOR_PERSON_TITLE')}</Button>
							<Button id="rolePrincipalButton" value="PRINCIPAL">{dict.lookup('PRINCIPAL_PERSON_TITLE')}</Button>
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
								<span className="text-danger">Setting this person to inactive will automatically remove them from the <strong>{person.position.name}</strong> position.</span>
							</HelpBlock> }

							{warnDomainUsername && <HelpBlock>
								<span className="text-danger">Setting this person to inactive means the next person to logon with the user name <strong>{person.domainUsername}</strong> will have to create a new profile. Do you want the next person to login with this user name to create a new profile?</span>
							</HelpBlock> }
						</Form.Field>
				}

				{!edit && person.role === 'ADVISOR' &&
					<Alert bsStyle="warning">
						Creating a {dict.lookup('ADVISOR_PERSON_TITLE')} in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts, please contact an ANET administrator.
					</Alert>
				}
			</Fieldset>

			<Fieldset title="Additional information">
				<RequiredField id="emailAddress" label="Email" required={isAdvisor}
					humanName="Valid email address"
					type="email" />
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
					value={nationalityDefaultValue}
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

	@autobind
	onChange() {
		this.forceUpdate()
	}

	@autobind
	onSubmit(event) {
		let {person, edit} = this.props
		let isFirstTimeUser = false
		if (person.isNewUser()) {
			isFirstTimeUser = true
			person.status = 'ACTIVE'
		}

		let url = `/api/people/${edit ? 'update' : 'new'}`
		API.send(url, person, {disableSubmits: true})
			.then(response => {
				if (response.code) {
					throw response.code
				}

				if (isFirstTimeUser) {
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
}
