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
import { Col, ControlLabel, FormGroup } from 'react-bootstrap'
import '../../components/NameInput.css'

const WILDCARD = '*'

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
		}
	}

	countries = person => {
		switch(person.role) {
			case Person.ROLE.ADVISOR:
				return this.lookupCountries('countries')
			case Person.ROLE.PRINCIPAL:
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
		if (this.state.person === null) return null
		const { person } = this.state
		const { edit } = this.props
		const isAdvisor = person.isAdvisor()
		const legendText = this.props.legendText || (edit ? `Edit Person ${person.name}` : 'Create a new Person')

		const {ValidatableForm, RequiredField} = this

		let willAutoKickPosition = person.status === 'INACTIVE' && person.position && !!person.position.id
		let warnDomainUsername = person.status === 'INACTIVE' && person.domainUsername
		let ranks = dict.lookup('ranks') || []

		const countries = this.countries(person)
		const nationalityDefaultValue = countries.length === 1 ? countries[0] : ''
		const firstNameProps = {
			id: "firstName",
			type: "text",
			display: "inline",
			placeholder: "First name(s)",
			onChange: this.handleOnChangeFirstName
		}

		let currentUser = this.context.currentUser
		let isAdmin = currentUser && currentUser.isAdmin()
		let disableStatusChange = this.state.originalStatus === 'INACTIVE' || Person.isEqual(currentUser, person)

		return <ValidatableForm formFor={person} onChange={this.onChange} onSubmit={this.onSubmit} horizontal
			submitText={this.props.saveText || 'Save person'}>

			<Messages error={this.state.error} />

			<Fieldset title={legendText}>
				<FormGroup>
					<Col sm={2} componentClass={ControlLabel}>Name</Col>
					<Col sm={8}>
						<Col sm={5}>
							<RequiredField
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
							<RequiredField {...firstNameProps} />
							:
							<Form.Field {...firstNameProps} />
						}
						</Col>
						<RequiredField className="hidden" id="name" value={this.fullName(this.state.person)} />
					</Col>
				</FormGroup>

				{edit ?
					<Form.Field type="static" id="role" value={person.humanNameOfRole()} />
					:
					<Form.Field id="role">
						<ButtonToggleGroup>
							<Button id="roleAdvisorButton" disabled={!isAdmin} value={Person.ROLE.ADVISOR}>{dict.lookup('ADVISOR_PERSON_TITLE')}</Button>
							<Button id="rolePrincipalButton" value={Person.ROLE.PRINCIPAL}>{dict.lookup('PRINCIPAL_PERSON_TITLE')}</Button>
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

				{!edit && isAdvisor &&
					<Alert bsStyle="warning">
						Creating a {dict.lookup('ADVISOR_PERSON_TITLE')} in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts, please contact an ANET administrator.
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

	componentWillReceiveProps(nextProps) {
		const { person } = nextProps
		const emptyName = { lastName: '', firstName: ''}

		const parsedName = person.name ? this.parseFullName(person.name) : emptyName

		this.savePersonWithFullName(person, parsedName)
	}

	savePersonWithFullName(person, editName) {
		if (editName.lastName) { person.lastName = editName.lastName }
		if (editName.firstName) { person.firstName = editName.firstName }

		person.name = this.fullName(person)
		this.setState({ person })
	}

	handleOnKeyDown = (event) => {
		if (event.key === ',') {
			let nameInput = document.getElementById("firstName")
			nameInput.focus()
		}
	}

	handleOnChangeLastName = (event) => {
		const value = event.target.value
		const { person } = this.state

		this.savePersonWithFullName(person, { lastName: value.toUpperCase() })
	}

	handleOnChangeFirstName = (event) => {
		const { person } = this.state
		const target = event.target
		const value = target.value

		if (value[0] === ',') target.value = ''
		this.savePersonWithFullName(person, { firstName: value })
	}

	fullName = (person) => {
		if (person.lastName && person.firstName) {
			return(`${person.lastName.trim()}, ${person.firstName.trim()}`)
		}
		else if (person.lastName) {
			return person.lastName.trim()
		}
		else {
			return ''
		}
	}

	parseFullName = (name) => {
		const delimiter = name.indexOf(',')
		let lastName = name
		let firstName = ''

		if(delimiter > -1) {
			lastName = name.substring(0, delimiter)
			firstName = name.substring(delimiter + 1, name.length)
		}

		return(
			{
				lastName: lastName.trim().toUpperCase(),
				firstName: firstName.trim()
			}
		)
	}

	@autobind
	onChange() {
		this.forceUpdate()
	}

	@autobind
	handleEmailValidation(value) {
		let domainNames = dict.lookup('domainNames')
		if (!this.props.person.isAdvisor() || domainNames.length === 0) {
			return { isValid: null, message: 'No custom validator is set' }
		}

		let wildcardDomains = this.getWildcardDomains(domainNames, WILDCARD)
		let isValid = this.validateEmail(value, domainNames, wildcardDomains)

		return { isValid: isValid, message: this.emailErrorMessage(domainNames) }
	}

	validateEmail(emailValue, domainNames, wildcardDomains) {
		let email = emailValue.split('@')
		let from =  email[0].trim()
		let domain = email[1]
		return (
			this.validateWithWhitelist(from, domain, domainNames) ||
			this.validateWithWildcard(domain, wildcardDomains)
		)
	}

	validateWithWhitelist(from, domain, whitelist) {
		return from.length > 0 && whitelist.includes(domain)
	}

	validateWithWildcard(domain, wildcardDomains) {
		let isValid = false
		if (domain) {
			isValid = wildcardDomains.some(wildcard => {
				return domain[0] !== '.' && domain.endsWith(wildcard.substr(1))
			})
		}
		return isValid
	}

	getWildcardDomains(domainList, token) {
		let wildcardDomains = domainList.filter(domain => {
			return domain[0] === token
		})
		return wildcardDomains
	}

	emailErrorMessage(validDomainNames) {
		const supportEmail = dict.lookup('SUPPORT_EMAIL_ADDR')
		const emailMessage = supportEmail ? ` at ${supportEmail}`: ''
		const errorMessage = `Only the following email domain names are allowed. If your email domain name is not in the list, please contact the support team${emailMessage}.`
		const items = validDomainNames.map(name => [
			<li>{name}</li>
		])
		return (
			<div>
				<p>{errorMessage}</p>
				<ul>{items}</ul>
			</div>
		)
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

		// Clean up person object for JSON response
		person = Object.without(person, 'firstName', 'lastName')

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
