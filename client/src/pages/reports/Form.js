import PropTypes from 'prop-types'
import React from 'react'
import {Checkbox, Table, Button, Collapse, HelpBlock} from 'react-bootstrap'
import DatePicker from 'react-16-bootstrap-date-picker'
import autobind from 'autobind-decorator'
import { WithContext as ReactTags } from 'react-tag-input'
import 'components/reactTags.css'

import Fieldset from 'components/Fieldset'
import Messages from 'components/Messages'
import Form from 'components/Form'
import RichTextEditor from 'components/RichTextEditor'
import AuthorizationGroupsSelector from 'components/AuthorizationGroupsSelector'
import Autocomplete from 'components/Autocomplete'
import NewAutocomplete from 'components/NewAutocomplete'
import ButtonToggleGroup from 'components/ButtonToggleGroup'
import TaskSelector from 'components/TaskSelector'
import LinkTo from 'components/LinkTo'
import ValidatableFormWrapper from 'components/ValidatableFormWrapper'

import moment from 'moment'

import API from 'api'
import Settings from 'Settings'
import {Location, Report, Person} from 'models'

import CALENDAR_ICON from 'resources/calendar.png'
import LOCATION_ICON from 'resources/locations.png'
import REMOVE_ICON from 'resources/delete.png'
import WARNING_ICON from 'resources/warning.png'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'
import NavigationWarning from 'components/NavigationWarning'

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'components/reactToastify.css'
import { jumpToTop } from 'components/Page'
import utils from 'utils'

class BaseReportForm extends ValidatableFormWrapper {
	static propTypes = {
		report: PropTypes.instanceOf(Report).isRequired,
		original: PropTypes.object.isRequired,
		edit: PropTypes.bool,
		onDelete: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)

		const { report, currentUser } = props
		this.state = {
			success: null,
			error: null,
			isBlocking: false,
			recents: {
				persons: [],
				locations: [],
				tasks: [],
				authorizationGroups: [],
			},
			reportTags: (report.tags || []).map(tag => ({id: tag.uuid, text: tag.name})),
			suggestionList: [],

			showReportText: !!report.reportText || !!report.reportSensitiveInformation,
			isCancelled: !!report.cancelledReason,
			errors: {},

			showAssignedPositionWarning: !currentUser.hasAssignedPosition(),
			showActivePositionWarning: currentUser.hasAssignedPosition() && !currentUser.hasActivePosition(),

			disableOnSubmit: false,

			//State for auto-saving reports
			reportChanged: false, //Flag to determine if we need to auto-save.
			timeoutId: null,
		}
		this.defaultTimeout = moment.duration(30, 'seconds')
		this.autoSaveTimeout = this.defaultTimeout.clone()
	}

	componentDidMount() {
		API.query(/* GraphQL */`
			locationRecents(maxResults:6) {
				list { uuid, name }
			}
			personRecents(maxResults:6) {
				list { uuid, name, rank, role, position { uuid, name, organization {uuid, shortName}, location {uuid, name} } }
			}
			taskRecents(maxResults:6) {
				list { uuid, shortName, longName }
			}
			authorizationGroupRecents(maxResults:6) {
				list { uuid, name, description }
			}
			tags {
				list { uuid, name, description }
			}
		`).then(data => {
			let newState = {
				recents: {
					locations: data.locationRecents.list,
					persons: data.personRecents.list,
					tasks: data.taskRecents.list,
					authorizationGroups: data.authorizationGroupRecents.list,
				},
				suggestionList: data.tags.list.map(tag => ({id: tag.uuid, text: tag.name})),
			}
			this.setState(newState)
		})

		// Schedule the auto-save timer
		let timeoutId = window.setTimeout(this.autoSave, this.autoSaveTimeout.asMilliseconds())
		this.setState({timeoutId})
	}

	componentWillUnmount() {
		window.clearTimeout(this.state.timeoutId)
	}

	componentDidUpdate(prevProps, prevState) {
		const { report, currentUser } = this.props
		const prevReport = prevProps.report
		const prevCurrentUser = prevProps.currentUser
		if (report.uuid !== prevReport.uuid) {
			this.setState({reportTags: (report.tags || []).map(tag => ({id: tag.uuid, text: tag.name}))})
		}
		const showReportText = !!report.reportText || !!report.reportSensitiveInformation
		const prevShowReportText = !!prevReport.reportText || !!prevReport.reportSensitiveInformation
		if (showReportText !== prevShowReportText) {
			this.setState({showReportText: showReportText})
		}
		const isCancelled = !!report.cancelledReason
		const prevIsCancelled = !!prevReport.cancelledReason
		if (isCancelled !== prevIsCancelled) {
			this.setState({isCancelled: isCancelled})
		}
		if (currentUser !== prevCurrentUser) {
			this.setState({
				showAssignedPositionWarning: !currentUser.hasAssignedPosition(),
				showActivePositionWarning: currentUser.hasAssignedPosition() && !currentUser.hasActivePosition(),
			})
		}
	}

	@autobind
	handleTagDelete(i) {
		let {reportTags} = this.state
		reportTags.splice(i, 1)
		this.setState({reportTags})
	}

	@autobind
	handleTagAddition(tag) {
		const newTag = this.state.suggestionList.find(t => t.id === tag.id)
		if (newTag) {
			let {reportTags} = this.state
			reportTags.push(newTag)
			this.setState({reportTags})
		}
	}

	@autobind
	handleTagSuggestions(query, suggestions) {
		const text = ((query && typeof query === 'object') ? query.text : query).toLowerCase()
		const {reportTags} = this.state
		return suggestions.filter(item => (
			item.text.toLowerCase().includes(text)
			&& !reportTags.some(reportTag => reportTag.id === item.id)
		))
	}

	render() {
		const { report, onDelete, currentUser } = this.props
		const {recents, suggestionList, errors, isCancelled, showAssignedPositionWarning, showActivePositionWarning} = this.state

		const hasErrors = Object.keys(errors).length > 0
		const isFuture = report.engagementDate && moment().endOf("day").isBefore(report.engagementDate)

		const invalidInputWarningMessage = <HelpBlock><b>
			<img src={WARNING_ICON} alt="" height="20px" />
			Location not found in database
		</b></HelpBlock>

		const futureMessage = isFuture && <HelpBlock>
			<span className="text-success">This will create an upcoming engagement</span>
		</HelpBlock>

		const {ValidatableForm, RequiredField} = this
		const submitText = currentUser.hasActivePosition() ? 'Preview and submit' : 'Save draft'
		const alertStyle = {top:132, marginBottom: '1rem', textAlign: 'center'}

		const supportEmail = Settings.SUPPORT_EMAIL_ADDR
		const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ''
		const advisorPositionSingular = Settings.fields.advisor.position.name
		return <div className="report-form">
			<NavigationWarning isBlocking={this.state.isBlocking} />

			<ToastContainer />

			<Messages error={this.state.error} />

			{showAssignedPositionWarning &&
				<div className="alert alert-warning" style={alertStyle}>
					You cannot submit a report: you are not assigned to a {advisorPositionSingular} position.<br/>
					Please contact your organization's super user(s) and request to be assigned to a {advisorPositionSingular} position.<br/>
					If you are unsure, you can also contact the support team {supportEmailMessage}.
				</div>
			}

			{showActivePositionWarning &&
				<div className="alert alert-warning" style={alertStyle}>
					You cannot submit a report: your assigned {advisorPositionSingular} position has an inactive status.<br/>
					Please contact your organization's super users and request them to assign you to an active {advisorPositionSingular} position.<br/>
					If you are unsure, you can also contact the support team {supportEmailMessage}.
				</div>
			}

			<ValidatableForm formFor={report} horizontal
				onSubmit={this.onSubmit} onChange={this.onChange} onDelete={onDelete}
				submitDisabled={hasErrors} submitText={submitText}
				bottomAccessory={this.state.autoSavedAt && <div>Last autosaved at {this.state.autoSavedAt.format('hh:mm:ss')}</div>}
			>

				<Fieldset title={this.props.title}>
					<RequiredField id="intent" label="Meeting goal (purpose)"
						canSubmitWithError={true}
						validateBeforeUserTouches={this.props.edit}
						className="meeting-goal"
						placeholder="What is the engagement supposed to achieve?" componentClass="textarea" maxCharacters={250}>
						<Form.Field.ExtraCol>{250 - report.intent.length} characters remaining</Form.Field.ExtraCol>
					</RequiredField>

					<Form.Field id="engagementDate" addon={CALENDAR_ICON} postInputGroupChildren={futureMessage} >
						<DatePicker showTodayButton placeholder="When did it happen?" dateFormat="DD/MM/YYYY" showClearButton={false} />
					</Form.Field>

					<Form.Field id="location" addon={LOCATION_ICON} validationState={errors.location} className="location-form-group"
						postInputGroupChildren={errors.location && invalidInputWarningMessage}>
						<NewAutocomplete
							objectType={Location}
							valueKey="name"
							fields={Location.autocompleteQuery}
							placeholder="Start typing to search for the location where this happened..."
							queryParams={{status: Location.STATUS.ACTIVE}}
						/>
						{recents.locations && recents.locations.length > 0 &&
							<Form.Field.ExtraCol className="shortcut-list">
								<h5>Recent locations</h5>
								<Button bsStyle="link"  onClick={this.setLocation.bind(this, recents.locations[0])}>Add {recents.locations[0].name}</Button>
							</Form.Field.ExtraCol>
						}
					</Form.Field>

					<Form.Field id="isCancelled" value={isCancelled} label="">
						<Checkbox inline onChange={this.toggleCancelled} checked={isCancelled} className="cancelled-checkbox">
							This engagement was cancelled
						</Checkbox>
					</Form.Field>

					{!isCancelled &&
						<Form.Field id="atmosphere" className="atmosphere-form-group" label="Atmospherics">
							<ButtonToggleGroup>
								<Button value="POSITIVE" id="positiveAtmos">Positive</Button>
								<Button value="NEUTRAL" id="neutralAtmos">Neutral</Button>
								<Button value="NEGATIVE" id="negativeAtmos">Negative</Button>
							</ButtonToggleGroup>
						</Form.Field>
					}

					{!isCancelled && report.atmosphere &&
						<RequiredField id="atmosphereDetails" className="atmosphere-details" label="Atmospherics details"
							placeholder={`Why was this engagement ${report.atmosphere.toLowerCase()}? ${report.atmosphere === 'POSITIVE' ? "(optional)" : ""}`}
							required={report.atmosphere !== 'POSITIVE'} />
					}

					{isCancelled &&
						<Form.Field id="cancelledReason" componentClass="select" className="cancelled-reason-form-group">
							<option value="CANCELLED_BY_ADVISOR">Cancelled by {Settings.fields.advisor.person.name}</option>
							<option value="CANCELLED_BY_PRINCIPAL">Cancelled by {Settings.fields.principal.person.name}</option>
							<option value="CANCELLED_DUE_TO_TRANSPORTATION">Cancelled due to Transportation</option>
							<option value="CANCELLED_DUE_TO_FORCE_PROTECTION">Cancelled due to Force Protection</option>
							<option value="CANCELLED_DUE_TO_ROUTES">Cancelled due to Routes</option>
							<option value="CANCELLED_DUE_TO_THREAT">Cancelled due to Threat</option>
						</Form.Field>
					}

					<Form.Field id="tags" label="Tags">
						<ReactTags tags={this.state.reportTags}
							suggestions={suggestionList}
							classNames={{
								tag: 'reportTag label label-info',
								remove: 'reportTagRemove label-info',
							}}
							minQueryLength={1}
							autocomplete={true}
							autofocus={false}
							handleFilterSuggestions={this.handleTagSuggestions}
							handleDelete={this.handleTagDelete}
							handleAddition={this.handleTagAddition} />
					</Form.Field>
				</Fieldset>

				<Fieldset title={!isCancelled ? "Meeting attendance" : "Planned attendance"} id="attendance-fieldset">
					<Form.Field id="attendees" validationState={errors.attendees}>
						<Autocomplete objectType={Person}
							onChange={this.addAttendee}
							onErrorChange={this.attendeeError}
							clearOnSelect={true}
							queryParams={{status: [Person.STATUS.ACTIVE, Person.STATUS.NEW_USER], matchPositionName: true}}
							fields={Person.autocompleteQuery}
							template={Person.autocompleteTemplate}
							placeholder="Start typing to search for people who attended the meeting..."
							valueKey="name" />

						{errors.attendees && <HelpBlock>
							<img src={WARNING_ICON} alt="" height="20px" />
							Person not found in ANET Database.
						</HelpBlock>}

						<Table condensed id="attendeesTable" className="borderless">
							<thead>
								<tr>
									<th style={{textAlign: 'center'}}>Primary</th>
									<th>Name</th>
									<th>Position</th>
									<th>Location</th>
									<th>Organization</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{Person.map(report.attendees.filter(p => p.role === Person.ROLE.ADVISOR), (person, idx) =>
									this.renderAttendeeRow(person, idx)
								)}

								<tr className="attendee-divider-row"><td colSpan={6}><hr /></td></tr>

								{Person.map(report.attendees.filter(p => p.role === Person.ROLE.PRINCIPAL), (person, idx) =>
									this.renderAttendeeRow(person, idx)
								)}
							</tbody>
						</Table>

						{recents.persons.length > 0 &&
							<Form.Field.ExtraCol className="shortcut-list">
								<h5>Recent attendees</h5>
								{Person.map(recents.persons, person =>
									<Button key={person.uuid} bsStyle="link" onClick={this.addAttendee.bind(this, person)}>Add <LinkTo person={person} isLink={false}/></Button>
								)}
							</Form.Field.ExtraCol>
						}
					</Form.Field>
				</Fieldset>

				{!isCancelled &&
					<TaskSelector tasks={report.tasks}
						shortcuts={recents.tasks}
						onChange={this.onChange}
						onErrorChange={this.onTaskError}
						validationState={errors.tasks}
						optional={false} />
				}

				<Fieldset title={!isCancelled ? "Meeting discussion" : "Next steps and details"}>
					{!isCancelled &&
						<RequiredField id="keyOutcomes" componentClass="textarea" maxCharacters={250} humanName="Key outcome description"
							canSubmitWithError={true}
							validateBeforeUserTouches={this.props.edit}>
							<Form.Field.ExtraCol>{250 - report.keyOutcomes.length} characters remaining</Form.Field.ExtraCol>
						</RequiredField>
					}

					<RequiredField id="nextSteps" componentClass="textarea" maxCharacters={250} humanName="Next steps description"
						canSubmitWithError={true}
						validateBeforeUserTouches={this.props.edit}>
						<Form.Field.ExtraCol>{250 - report.nextSteps.length} characters remaining</Form.Field.ExtraCol>
					</RequiredField>

					<Button className="center-block toggle-section-button" onClick={this.toggleReportText} id="toggleReportDetails" >
						{this.state.showReportText ? 'Hide' : 'Add'} detailed report
					</Button>

					<Collapse in={this.state.showReportText}>
						<div>
							<Form.Field id="reportText" className="reportTextField" componentClass={RichTextEditor} />

							{(report.reportSensitiveInformation || !this.props.edit) &&
								<div>
									<Form.Field id="reportSensitiveInformationText" className="reportSensitiveInformationField" componentClass={RichTextEditor}
										value={report.reportSensitiveInformation && report.reportSensitiveInformation.text}
										onChange={this.updateReportSensitiveInformation} />
									<AuthorizationGroupsSelector
										groups={report.authorizationGroups}
										shortcuts={recents.authorizationGroups}
										onChange={this.onChange}
										onErrorChange={this.onAuthorizationGroupError}
										validationState={errors.authorizationGroups} />
								</div>
							}
						</div>
					</Collapse>
				</Fieldset>
			</ValidatableForm>
		</div>
	}

	updateReportSensitiveInformation = (value) => {
		if (!this.props.report.reportSensitiveInformation) {
			this.props.report.reportSensitiveInformation = {}
		}
		this.props.report.reportSensitiveInformation.text = value
		this.onChange()
	}

	@autobind
	toggleReportText() {
		this.setState({showReportText: !this.state.showReportText})
	}

	@autobind
	toggleCancelled() {
		//Toggle the isCancelled state. And set a default reason if necessary
		let cancelled = !this.state.isCancelled
		this.props.report.cancelledReason = (cancelled) ? 'CANCELLED_BY_ADVISOR' : null
		this.setState({isCancelled: cancelled})
	}

	@autobind
	setLocation(location) {
		this.props.report.location = location
		this.onChange()
	}

	@autobind
	addAttendee(newAttendee) {
		this.props.report.addAttendee(newAttendee)
		this.onChange()
	}

	@autobind
	attendeeError(isError, message) {
		let errors = this.state.errors
		if (isError) {
			errors.attendees = 'error'
		} else {
			delete errors.attendees
		}
		this.setState({errors})
	}

	@autobind
	renderAttendeeRow(person, idx) {
		return <tr key={person.uuid}>
			<td className="primary-attendee">
				<Checkbox checked={person.primary} onChange={this.setPrimaryAttendee.bind(this, person)} id={'attendeePrimary_' + person.role + "_" + idx}/>
			</td>

			<td id={"attendeeName_" + person.role + "_" + idx} >
				<img src={person.iconUrl()} alt={person.role} height={20} className="person-icon" />
				<LinkTo person={person}/>
			</td>
			<td><LinkTo position={person.position} />{person.position && person.position.code ? `, ${person.position.code}`: ``}</td>
			<td><LinkTo whenUnspecified="" anetLocation={person.position && person.position.location} /></td>
			<td><LinkTo whenUnspecified="" organization={person.position && person.position.organization} /> </td>
			<td onClick={this.removeAttendee.bind(this, person)} id={'attendeeDelete_' + person.role + "_" + idx} >
				<span style={{cursor: 'pointer'}}><img src={REMOVE_ICON} height={14} alt="Remove attendee" /></span>
			</td>
		</tr>
	}


	@autobind
	onTaskError(isError, message) {
		let errors = this.state.errors
		if (isError) {
			errors.tasks = 'error'
		} else {
			delete errors.tasks
		}
		this.setState({errors})
	}

	@autobind
	removeAttendee(oldAttendee) {
		let report = this.props.report
		let attendees = report.attendees
		let index = attendees.findIndex(attendee => Person.isEqual(attendee, oldAttendee))

		if (index !== -1) {
			let person = attendees[index]
			attendees.splice(index, 1)

			if (person.primary) {
				let nextPerson = attendees.find(nextPerson => nextPerson.role === person.role)
				if (nextPerson)
					nextPerson.primary = true
			}

			this.onChange()
		}
	}

	@autobind
	setPrimaryAttendee(person) {
		let report = this.props.report
		let attendees = report.attendees

		attendees.forEach(nextPerson => {
			if (nextPerson.role === person.role)
				nextPerson.primary = false
			if (Person.isEqual(nextPerson, person))
				nextPerson.primary = true
		})

		this.onChange()
	}

	@autobind
	onAuthorizationGroupError(isError, message) {
		let errors = this.state.errors
		if (isError) {
			errors.authorizationGroups = 'error'
		} else {
			delete errors.authorizationGroups
		}
		this.setState({errors})
	}

	@autobind
	onChange() {
		this.setState({
			errors : this.validateReport(),
			reportChanged: true,
			isBlocking: this.formHasUnsavedChanges(this.props.report, this.props.original),
		})
	}

	@autobind
	validateReport() {
		let report = this.props.report
		let errors = this.state.errors
		if (report.location && (typeof report.location !== 'object')) {
			errors.location = 'error'
		} else {
			delete errors.location
		}

		return errors
	}

	@autobind
	isEditMode() {
		// We're in edit mode when the form was started as an edit form, or when the report got an id after autosave
		return this.props.edit || this.props.report.uuid
	}

	@autobind
	saveReport(disableSubmits) {
		let report = new Report(Object.without(this.props.report, 'reportSensitiveInformationText', 'tags'))
		report.tags = this.state.reportTags.map(tag => ({uuid: tag.id}))
		if(report.primaryAdvisor) { report.attendees.find(a => a.uuid === report.primaryAdvisor.uuid).isPrimary = true }
		if(report.primaryPrincipal) { report.attendees.find(a => a.uuid === report.primaryPrincipal.uuid).isPrimary = true }
		delete report.primaryPrincipal
		delete report.primaryAdvisor
		report.attendees = report.attendees.map(a =>
			Object.without(a, 'position', '_loaded')
		)
		report.location = utils.getReference(report.location)
		if (!this.state.isCancelled) {
			delete report.cancelledReason
		}
		let graphql = 'createReport(report: $report) { uuid reportSensitiveInformation { uuid text } }'
		let variableDef = '($report: ReportInput!)'
		let variables = {report: report}
		if (this.isEditMode()) {
			graphql = 'updateReport(report: $report, sendEditEmail: $sendEditEmail) { uuid reportSensitiveInformation { uuid text } }'
			variableDef = '($report: ReportInput!, $sendEditEmail: Boolean!)'
			variables.sendEditEmail = disableSubmits
		}
		// FIXME: maybe we can better fix the disableOnSubmit through the API.mutation
		if (disableSubmits) {
			this.setState({disableOnSubmit: disableSubmits})
		}
		return API.mutation(graphql, variables, variableDef, {disableSubmits: disableSubmits})
	}

	@autobind
	onSubmit(event) {
		const operation = this.isEditMode() ? 'updateReport' : 'createReport'
		this.setState({isBlocking: false})
		this.saveReport(true)
			.then(data => {
				if (data[operation].uuid) {
					// FIXME: do not change the value of the props
					this.props.report.uuid = data[operation].uuid
				}
				// this updates the current page URL on model/new to be the edit page,
				// so that if you press back after saving a new model, it takes you
				// back to editing the model you just saved
				this.props.history.replace(Report.pathForEdit(this.props.report))
				// then after, we redirect you to the to page
				this.props.history.push({
					pathname: Report.pathFor(this.props.report),
					state: {
						success: 'Report saved',
					}
				})
			}).catch(error => {
				// FIXME: should disableOnSubmit be set here?
				this.setState({success: null, error: error, disableOnSubmit: false})
				jumpToTop()
			})
	}

	@autobind
	autoSave() {
		const operation = this.isEditMode() ? 'updateReport' : 'createReport'
		// Only auto-save if the report has changed
		if (this.state.reportChanged === false) {
			// Just re-schedule the auto-save timer
			let timeoutId = window.setTimeout(this.autoSave, this.autoSaveTimeout.asMilliseconds())
			this.setState({timeoutId})
		} else {
			this.saveReport(false)
				.then(data => {
					if (data[operation].uuid) {
						// FIXME: do not change the value of the props
						this.props.report.uuid = data[operation].uuid
					}
					if (data[operation].reportSensitiveInformation) {
						this.props.report.reportSensitiveInformation = data[operation].reportSensitiveInformation
					}
					// Reset the reportChanged state, yes this could drop a few keystrokes that
					// the user made while we were saving, but that's not a huge deal.
					this.autoSaveTimeout = this.defaultTimeout.clone() // reset to default
					this.setState({autoSavedAt: moment(), reportChanged: false})
					toast.success('Your report has been automatically saved')
					// And re-schedule the auto-save timer
					let timeoutId = window.setTimeout(this.autoSave, this.autoSaveTimeout.asMilliseconds())
					this.setState({timeoutId, error: null})
				}).catch(error => {
					// Show an error message
					this.autoSaveTimeout.add(this.autoSaveTimeout) // exponential back-off
					toast.error("There was an error autosaving your report; we'll try again in " + this.autoSaveTimeout.humanize())
					// And re-schedule the auto-save timer
					let timeoutId = window.setTimeout(this.autoSave, this.autoSaveTimeout.asMilliseconds())
					this.setState({timeoutId, error})
				})
		}
	}
}

const ReportForm = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseReportForm currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(ReportForm)
