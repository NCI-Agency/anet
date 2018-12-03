import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Button, Alert, HelpBlock, Radio, Col, ControlLabel, FormGroup} from 'react-bootstrap'
import DatePicker from 'react-16-bootstrap-date-picker'
import autobind from 'autobind-decorator'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

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
import _clone from 'lodash/clone'

class BasePersonForm extends Component {
	static propTypes = {
		initialValues: PropTypes.object.isRequired,
		title: PropTypes.string,
		edit: PropTypes.bool,
		saveText: PropTypes.string,
		currentUser: PropTypes.instanceOf(Person),
		loadAppData: PropTypes.func,
	}

	static defaultProps = {
		initialValues: new Person(),
		title: '',
		edit: false,
	}

	constructor(props) {
		super(props)
		this.state = {
			success: null,
			originalStatus: '',
			showWrongPersonModal: false,
			wrongPersonOptionValue: null,
		}
	}

	statusButtons = [
		{
			id: 'statusActiveButton',
			value: Person.STATUS.ACTIVE,
			label: 'ACTIVE',
		},
		{
			id: 'statusInactiveButton',
			value: Person.STATUS.INACTIVE,
			label: 'INACTIVE'
		},
	]

	roleButtons = ({ isAdmin, title }) => [
		{
			id: 'roleAdvisorButton',
			title: title,
			value: Person.ROLE.ADVISOR,
			label: Settings.fields.advisor.person.name,
			disabled: !isAdmin
		},
		{
			id: 'rolePrincipalButton',
			value: Person.ROLE.PRINCIPAL,
			label: Settings.fields.principal.person.name
		},
	]

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
			<Field component="option" key={country} value={country} >{country}</Field>
		)
	}

	render() {
		const { currentUser, edit, title, ...myFormProps } = this.props
		return <Formik
			enableReinitialize
			onSubmit={this.onSubmit}
			validationSchema={Person.yupSchema}
			isInitialValid={() => Person.yupSchema.isValidSync(this.props.initialValues)}
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
			const person = new Person(values)
			const fullName = Person.fullName(Person.parseFullName(person.name))
			const isSelf = Person.isEqual(currentUser, person)
			const isAdmin = currentUser && currentUser.isAdmin()
			const isAdvisor = person.isAdvisor()

			const willAutoKickPosition = person.status === Person.STATUS.INACTIVE && person.position && !!person.position.uuid
			const warnDomainUsername = person.status === Person.STATUS.INACTIVE && !_isEmpty(person.domainUsername)
			const ranks = Settings.fields.person.ranks || []

			const countries = this.countries(person)
			if (!edit && countries.length === 1) {
				// For new objects, assign default country if there's only one
				person.country = countries[0]
			}
			// anyone with edit permissions can change status to INACTIVE, only admins can change back to ACTIVE (but nobody can change status of self!)
			const disableStatusChange = (this.props.initialValues.status === Person.STATUS.INACTIVE && !isAdmin) || isSelf
			// admins can edit all persons, new users can be edited by super users or themselves
			const canEditName = isAdmin || (
					(person.isNewUser() || !edit) && currentUser && (
							currentUser.isSuperUser() ||
							isSelf
					)
				)

			const advisorSingular = Settings.fields.advisor.person.name
			const advisorPlural = pluralize(advisorSingular)
			const superUserAdvisorTitle = isAdmin ? null : `Super users cannot create ${advisorSingular} profiles. ANET uses the domain user name to authenticate and uniquely identify each ANET user. To ensure that ${advisorPlural} have the correct domain name associated with their profile, it is required that each new ${advisorSingular} individually logs into ANET and creates their own ANET profile.`
			const nameMessage = "This is not " + (isSelf ? "me" : fullName)
			const modalTitle = `It is possible that the information of ${fullName} is out of date. Please help us identify if any of the following is the case:`
			const confirmLabel = this.state.wrongPersonOptionValue === 'needNewAccount'
					? 'Yes, I would like to inactivate my predecessor\'s account and set up a new one for myself'
					: 'Yes, I would like to inactivate this account'

			const action = <React.Fragment>
				<Button key="submit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save Person</Button>
			</React.Fragment>

			return <React.Fragment>
				<NavigationWarning isBlocking={dirty} />
				<Form className="form-horizontal" method="post">
					<Messages error={this.state.error} />
					<Fieldset title={this.props.title} action={action} />
					<Fieldset>
						<FormGroup>
							<Col sm={2} componentClass={ControlLabel}>Name</Col>
							<Col sm={7}>
								<Col sm={5}>
									<Field
										name="lastName"
										component={FieldHelper.renderInputFieldNoLabel}
										display="inline"
										placeholder="LAST NAME"
										disabled={!canEditName}
										onKeyDown={this.handleLastNameOnKeyDown}
									/>
								</Col>
								<Col sm={1} className="name-input">,</Col>
								<Col sm={6}>
									<Field
										name="firstName"
										component={FieldHelper.renderInputFieldNoLabel}
										display="inline"
										placeholder="First name(s) - Lower-case except for the first letter of each name"
										disabled={!canEditName}
									/>
								</Col>
							</Col>

							{edit && !canEditName &&
								<React.Fragment>
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
								</React.Fragment>
							}
						</FormGroup>

						{isAdmin &&
							<Field
								name="domainUsername"
								component={FieldHelper.renderInputField}
								extraColElem={<span className="text-danger">Be careful when changing this field; you might lock someone out or create duplicate accounts.</span>}
							/>
						}

						{edit ?
							<Field
								name="role"
								component={FieldHelper.renderReadonlyField}
								humanValue={person.humanNameOfRole()}
							/>
								:
							<Field
								name="role"
								component={FieldHelper.renderButtonToggleGroup}
								buttons={this.roleButtons({ isAdmin, title: superUserAdvisorTitle})}
							/>
						}

						{disableStatusChange ?
							<Field
								name="status"
								component={FieldHelper.renderReadonlyField}
								type="text"
							/>
								:
							person.isNewUser() ?
								<Field
									name="status"
									component={FieldHelper.renderReadonlyField}
								/>
								:
								<Field
									name="status"
									component={FieldHelper.renderButtonToggleGroup}
									buttons={this.statusButtons}
								>
								{willAutoKickPosition && <HelpBlock>
									<span className="text-danger">Settings this person to inactive will automatically remove them from the <strong>{person.position.name}</strong> position.</span>
									</HelpBlock> }

									{warnDomainUsername && <HelpBlock>
										<span className="text-danger">Settings this person to inactive means the next person to logon with the user name <strong>{person.domainUsername}</strong> will have to create a new profile. Do you want the next person to login with this user name to create a new profile?</span>
									</HelpBlock> }
								</Field>
						}

						{!edit && isAdvisor &&
							<Alert bsStyle="warning">
								Creating a {Settings.fields.advisor.person.name} in ANET could result in duplicate accounts if this person logs in later. If you notice duplicate accounts, please contact an ANET administrator.
							</Alert>
						}
					</Fieldset>

					<Fieldset title="Additional information">
						<Field
							name="emailAddress"
							label="Email"
							type="email"
							validate={(email) => this.handleEmailValidation(email, person)}
							component={FieldHelper.renderInputField}
						/>
						<Field
							name="phoneNumber"
							label="Phone"
							component={FieldHelper.renderInputField}
						/>
						<Field
							name="rank"
							component={FieldHelper.renderSpecialField}
							widget={
								<Field component="select" className="form-control" >
									<Field component="option" />
									{ranks.map(rank =>
											<Field component="option" key={rank} value={rank} >{rank}</Field>
										)
									}
								</Field>
							}
						/>
						<Field
							name="gender"
							component={FieldHelper.renderSpecialField}
							widget={
								<Field component="select" className="form-control" >
									<Field component="option" value="MALE" >Male</Field>
									<Field component="option" value="FEMALE" >Female</Field>
								</Field>
							}
						/>
						<Field
							name="country"
							label="Nationality"
							component={FieldHelper.renderSpecialField}
							value={person.country}
							widget={
								<Field component="select" className="form-control" >
									<Field component="option" />
									{this.renderCountrySelectOptions(countries)}
								</Field>
							}
						/>
						<Field
							name="endOfTourDate"
							label="End of tour"
							component={FieldHelper.renderSpecialField}
							onChange={(value, formattedValue) => setFieldValue('endOfTourDate', value)}
							addon={CALENDAR_ICON}
							widget={
								<DatePicker placeholder="End of Tour Date" dateFormat="DD/MM/YYYY" showClearButton={false} />
							}
						/>
						<Field
							name="biography"
							className="biography"
							component={FieldHelper.renderSpecialField}
							onChange={(value) => setFieldValue('biography', value)}
							widget={
								<RichTextEditor />
							}
						/>
					</Fieldset>
					<div className="submit-buttons">
						<div>
							<Button onClick={this.onCancel}>Cancel</Button>
						</div>
						<div>
							<Button id="formBottomSubmit" bsStyle="primary" type="button" onClick={submitForm} disabled={isSubmitting || !isValid}>Save Person</Button>
						</div>
					</div>
				</Form>
			</React.Fragment>
		}}
		</Formik>
	}

	getFullName(splitName, editName) {
		if (editName.lastName !== undefined) { splitName.lastName = editName.lastName }
		if (editName.firstName !== undefined) { splitName.firstName = editName.firstName }

		return Person.fullName(splitName)
	}

	handleEmailValidation = (value, person) => {
		return utils.handleEmailValidation(value, {validate: person.isAdvisor()})
	}

	handleLastNameOnKeyDown = (event) => {
		// adding a "," to the last name results in jumping to the end of the first name
		if (event.key === ',') {
			event.preventDefault()
			document.getElementById('firstName').focus()
		}
	}

	onSubmit = (values, form) => {
		const person = new Person(values)
		let isFirstTimeUser = false
		if (person.isNewUser()) {
			isFirstTimeUser = true
			person.status = Person.STATUS.ACTIVE
		}
		this.updatePerson(person, form, isFirstTimeUser)
	}

	updatePerson = (person, form, isNew) => {
		const { edit } = this.props
		person.name = Person.fullName({firstName: person.firstName, lastName: person.lastName}, true)
		// Clean up person object for JSON response
		person = Object.without(person, 'firstName', 'lastName')
		const operation = edit ? 'updatePerson' : 'createPerson'
		let graphql = operation + '(person: $person)'
		graphql += edit ? '' : ' { uuid }'
		const variables = { person: person }
		const variableDef = '($person: PersonInput!)'
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				form.resetForm()
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
				this.setState({error})
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
